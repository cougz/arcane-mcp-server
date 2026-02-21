import type { ArcaneClient } from "../arcane-client";

export async function resolveEnvironmentId(
  client: ArcaneClient,
  envId?: string,
  envName?: string
): Promise<string> {
  if (envId) {
    return envId;
  }

  if (!envName) {
    throw new Error("Either environmentId or environmentName must be provided");
  }

  const result = await client.environments.list({ search: envName, limit: 50 });
  const matches = result.data?.filter((env) => env.name === envName) ?? [];

  if (matches.length === 0) {
    const available = result.data?.map((env) => env.name).join(", ") ?? "none";
    throw new Error(`No environment found with name '${envName}'. Available environments: ${available}`);
  }

  if (matches.length > 1) {
    const matchingIds = matches.map((env) => env.id).join(", ");
    throw new Error(
      `Multiple environments found with name '${envName}'. Please use the environment ID instead. Matching IDs: ${matchingIds}`
    );
  }

  return matches[0].id;
}

export async function resolveStackId(
  client: ArcaneClient,
  envId: string,
  stackId?: string,
  stackName?: string
): Promise<string> {
  if (stackId) {
    return stackId;
  }

  if (!stackName) {
    throw new Error("Either stackId or stackName must be provided");
  }

  const result = await client.stacks.list(envId, { search: stackName, limit: 50 });
  const matches = result.data?.filter((stack) => stack.name === stackName) ?? [];

  if (matches.length === 0) {
    const available = result.data?.map((stack) => stack.name).join(", ") ?? "none";
    throw new Error(`No stack found with name '${stackName}' in environment '${envId}'. Available stacks: ${available}`);
  }

  if (matches.length > 1) {
    const matchingIds = matches.map((stack) => stack.id).join(", ");
    throw new Error(
      `Multiple stacks found with name '${stackName}' in environment '${envId}'. Please use the stack ID instead. Matching IDs: ${matchingIds}`
    );
  }

  return matches[0].id;
}

export async function resolveContainerId(
  client: ArcaneClient,
  envId: string,
  containerId?: string,
  containerName?: string
): Promise<string> {
  if (containerId) {
    return containerId;
  }

  if (!containerName) {
    throw new Error("Either containerId or containerName must be provided");
  }

  const result = await client.containers.list(envId);
  const matches = result.data?.filter((container) =>
    container.names?.some((name) => name === `/${containerName}` || name === containerName)
  ) ?? [];

  if (matches.length === 0) {
    const available =
      result.data?.flatMap((container) => container.names ?? []).map((name) => name.replace(/^\//, "")).join(", ") ??
      "none";
    throw new Error(
      `No container found with name '${containerName}' in environment '${envId}'. Available containers: ${available}`
    );
  }

  if (matches.length > 1) {
    const matchingIds = matches.map((container) => container.id).join(", ");
    throw new Error(
      `Multiple containers found with name '${containerName}' in environment '${envId}'. Please use the container ID instead. Matching IDs: ${matchingIds}`
    );
  }

  return matches[0].id;
}
