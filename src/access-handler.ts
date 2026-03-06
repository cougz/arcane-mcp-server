import { Buffer } from "node:buffer";
import type { AuthRequest, OAuthHelpers } from "@cloudflare/workers-oauth-provider";
import {
	addApprovedClient,
	createOAuthState,
	fetchUpstreamAuthToken,
	generateCSRFProtection,
	getUpstreamAuthorizeUrl,
	isClientApproved,
	OAuthError,
	type Props,
	renderApprovalDialog,
	validateCSRFToken,
	validateOAuthState,
} from "./workers-oauth-utils";

type EnvWithOauth = Env & { OAUTH_PROVIDER: OAuthHelpers };

export async function handleAccessRequest(
	request: Request,
	env: EnvWithOauth,
	_ctx: ExecutionContext,
) {
	const { pathname, searchParams } = new URL(request.url);

	console.log(`[access-handler] ${request.method} ${pathname}`);

	// Derive all OIDC endpoint URLs from team name and client ID
	const oidcBase = `https://${env.ACCESS_TEAM_NAME}.cloudflareaccess.com/cdn-cgi/access/sso/oidc/${env.ACCESS_CLIENT_ID}`;
	const tokenUrl = `${oidcBase}/token`;
	const authorizationUrl = `${oidcBase}/authorization`;
	const jwksUrl = `${oidcBase}/jwks`;

	if (request.method === "GET" && pathname === "/authorize") {
		console.log("[access-handler] GET /authorize - parsing auth request");
		const oauthReqInfo = await env.OAUTH_PROVIDER.parseAuthRequest(request);
		const { clientId } = oauthReqInfo;
		if (!clientId) {
			console.error("[access-handler] GET /authorize - missing clientId");
			return new Response("Invalid request", { status: 400 });
		}

		// Check if client is already approved
		if (await isClientApproved(request, clientId, env.COOKIE_ENCRYPTION_KEY)) {
			console.log("[access-handler] GET /authorize - client already approved, skipping dialog");
			const { stateToken } = await createOAuthState(oauthReqInfo, env.OAUTH_KV);
			return redirectToAccess(request, env, authorizationUrl, stateToken);
		}

		// Generate CSRF protection for the approval form
		console.log("[access-handler] GET /authorize - rendering approval dialog");
		const { token: csrfToken, setCookie } = generateCSRFProtection();

		return renderApprovalDialog(request, {
			client: await env.OAUTH_PROVIDER.lookupClient(clientId),
			csrfToken,
			server: {
				description: "Arcane Docker MCP Server — authenticate with Cloudflare Access.",
				logo: "https://avatars.githubusercontent.com/u/314135?s=200&v=4",
				name: "Arcane MCP Server",
			},
			setCookie,
			state: { oauthReqInfo },
		});
	}

	if (request.method === "POST" && pathname === "/authorize") {
		console.log("[access-handler] POST /authorize - processing approval");
		try {
			// Read form data once at top
			const formData = await request.formData();
			console.log("[access-handler] POST /authorize - form data keys:", [...formData.keys()]);

			// Validate CSRF token - pass parsed FormData
			validateCSRFToken(formData, request);
			console.log("[access-handler] POST /authorize - CSRF valid");

			// Extract state from form data
			const encodedState = formData.get("state");
			if (!encodedState || typeof encodedState !== "string") {
				console.error("[access-handler] POST /authorize - missing state in form data");
				return new Response("Missing state in form data", { status: 400 });
			}

			let state: { oauthReqInfo?: AuthRequest };
			try {
				state = JSON.parse(atob(encodedState));
			} catch (_e) {
				console.error("[access-handler] POST /authorize - failed to parse state:", _e);
				return new Response("Invalid state data", { status: 400 });
			}

			if (!state.oauthReqInfo || !state.oauthReqInfo.clientId) {
				console.error("[access-handler] POST /authorize - invalid oauthReqInfo in state");
				return new Response("Invalid request", { status: 400 });
			}

			console.log("[access-handler] POST /authorize - adding approved client");
			// Add client to approved list
			const approvedClientCookie = await addApprovedClient(
				request,
				state.oauthReqInfo.clientId,
				env.COOKIE_ENCRYPTION_KEY,
			);

			console.log("[access-handler] POST /authorize - creating OAuth state in KV");
			// Create OAuth state with CSRF protection
			const { stateToken } = await createOAuthState(state.oauthReqInfo, env.OAUTH_KV);

			console.log("[access-handler] POST /authorize - redirecting to Access");
			return redirectToAccess(request, env, authorizationUrl, stateToken, {
				"Set-Cookie": approvedClientCookie,
			});
		} catch (error: any) {
			console.error("[access-handler] POST /authorize error:", error?.message, error?.stack);
			if (error instanceof OAuthError) {
				return error.toResponse();
			}
			// Unexpected non-OAuth error
			return new Response(`Internal server error: ${error.message}`, { status: 500 });
		}
	}

	if (request.method === "GET" && pathname === "/callback") {
		console.log("[access-handler] GET /callback - validating OAuth state");
		// Validate OAuth state (retrieves stored data from KV)
		let oauthReqInfo: AuthRequest;

		try {
			const result = await validateOAuthState(request, env.OAUTH_KV);
			oauthReqInfo = result.oauthReqInfo;
			console.log("[access-handler] GET /callback - state valid, clientId:", oauthReqInfo.clientId);
		} catch (error: any) {
			console.error("[access-handler] GET /callback - validateOAuthState error:", error?.message, error?.stack);
			if (error instanceof OAuthError) {
				return error.toResponse();
			}
			return new Response("Internal server error", { status: 500 });
		}

		if (!oauthReqInfo.clientId) {
			console.error("[access-handler] GET /callback - missing clientId in oauthReqInfo");
			return new Response("Invalid OAuth request data", { status: 400 });
		}

		console.log("[access-handler] GET /callback - exchanging code for token, tokenUrl:", tokenUrl);
		// Exchange the code for an access token
		const [accessToken, idToken, errResponse] = await fetchUpstreamAuthToken({
			client_id: env.ACCESS_CLIENT_ID,
			client_secret: env.ACCESS_CLIENT_SECRET,
			code: searchParams.get("code") ?? undefined,
			redirect_uri: new URL("/callback", request.url).href,
			upstream_url: tokenUrl,
		});
		if (errResponse) {
			console.error("[access-handler] GET /callback - token exchange failed:", errResponse.status);
			return errResponse;
		}

		console.log("[access-handler] GET /callback - verifying id_token");
		const idTokenClaims = await verifyToken(jwksUrl, idToken);
		const user = {
			email: idTokenClaims.email,
			name: idTokenClaims.name,
			sub: idTokenClaims.sub,
		};
		console.log("[access-handler] GET /callback - user verified, sub:", user.sub, "email:", user.email);

		// Return back to the MCP client a new token
		const { redirectTo } = await env.OAUTH_PROVIDER.completeAuthorization({
			metadata: {
				label: user.name,
			},
			// This will be available on this.props inside ArcaneAgent
			props: {
				accessToken,
				email: user.email,
				login: user.sub,
				name: user.name,
			} as Props,
			request: oauthReqInfo,
			scope: oauthReqInfo.scope,
			userId: user.sub,
		});

		console.log("[access-handler] GET /callback - authorization complete, redirecting");
		return Response.redirect(redirectTo, 302);
	}

	console.log("[access-handler] no route matched:", request.method, pathname);
	return new Response("Not Found", { status: 404 });
}

async function redirectToAccess(
	request: Request,
	env: Env,
	authorizationUrl: string,
	stateToken: string,
	headers: Record<string, string> = {},
) {
	return new Response(null, {
		headers: {
			...headers,
			location: getUpstreamAuthorizeUrl({
				client_id: env.ACCESS_CLIENT_ID,
				redirect_uri: new URL("/callback", request.url).href,
				scope: "openid email profile",
				state: stateToken,
				upstream_url: authorizationUrl,
			}),
		},
		status: 302,
	});
}

/**
 * Helper to get the Access public keys from the JWKS endpoint
 */
async function fetchAccessPublicKey(jwksUrl: string, kid: string) {
	// TODO: cache this
	const resp = await fetch(jwksUrl);
	const keys = (await resp.json()) as {
		keys: (JsonWebKey & { kid: string })[];
	};
	const jwk = keys.keys.filter((key) => key.kid === kid)[0];
	const key = await crypto.subtle.importKey(
		"jwk",
		jwk,
		{
			hash: "SHA-256",
			name: "RSASSA-PKCS1-v1_5",
		},
		false,
		["verify"],
	);
	return key;
}

/**
 * Parse a JWT into its respective pieces. Does not do any validation other than form checking.
 */
function parseJWT(token: string) {
	const tokenParts = token.split(".");

	if (tokenParts.length !== 3) {
		throw new Error("token must have 3 parts");
	}

	return {
		data: `${tokenParts[0]}.${tokenParts[1]}`,
		header: JSON.parse(Buffer.from(tokenParts[0], "base64url").toString()),
		payload: JSON.parse(Buffer.from(tokenParts[1], "base64url").toString()),
		signature: tokenParts[2],
	};
}

/**
 * Validates the provided token using the Access public key set
 */
async function verifyToken(jwksUrl: string, token: string) {
	const jwt = parseJWT(token);
	const key = await fetchAccessPublicKey(jwksUrl, jwt.header.kid);

	const verified = await crypto.subtle.verify(
		"RSASSA-PKCS1-v1_5",
		key,
		Buffer.from(jwt.signature, "base64url"),
		Buffer.from(jwt.data),
	);

	if (!verified) {
		throw new Error("failed to verify token");
	}

	const claims = jwt.payload;
	const now = Math.floor(Date.now() / 1000);
	// Validate expiration
	if (claims.exp < now) {
		throw new Error("expired token");
	}

	return claims;
}
