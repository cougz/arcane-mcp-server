import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ArcaneClient } from "../arcane-client";
import { resolveEnvironmentId } from "./resolve";

export function registerEnvironmentTools(server: McpServer, client: ArcaneClient): void {
  server.tool(
    "arcane_environment_list",
    "List all Docker environments managed by Arcane. Returns environment IDs, names, and connection status.",
    {
      search: z.string().optional().describe("Filter environments by name"),
      limit: z.number().int().min(1).max(100).optional().default(50),
    },
    async ({ search, limit }) => {
      try {
        const result = await client.environments.list({ search, limit });
        return {
          content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "arcane_environment_get",
    "Get details of a specific Docker environment by ID or name.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
    },
    async ({ environmentId, environmentName }) => {
      try {
        const id = await resolveEnvironmentId(client, environmentId, environmentName);
        const result = await client.environments.get(id);
        return {
          content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "arcane_environment_create",
    "Create a new Docker environment in Arcane.",
    {
      name: z.string().describe("Environment name"),
      apiUrl: z.string().describe("Docker API URL"),
      accessToken: z.string().optional().describe("Docker access token"),
      bootstrapToken: z.string().optional().describe("Bootstrap token for agent pairing"),
      enabled: z.boolean().optional().describe("Whether the environment is enabled"),
      isEdge: z.boolean().optional().describe("Whether this is an edge environment"),
      useApiKey: z.boolean().optional().describe("Use API key authentication"),
    },
    async (dto) => {
      try {
        const result = await client.environments.create(dto);
        return {
          content: [{ type: "text", text: `Environment created successfully:\n${JSON.stringify(result.data, null, 2)}` }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "arcane_environment_update",
    "Update an existing Docker environment.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      name: z.string().optional().describe("New environment name"),
      apiUrl: z.string().optional().describe("New Docker API URL"),
      accessToken: z.string().optional().describe("New Docker access token"),
      bootstrapToken: z.string().optional().describe("New bootstrap token"),
      enabled: z.boolean().optional().describe("Enable or disable the environment"),
      regenerateApiKey: z.boolean().optional().describe("Regenerate the API key"),
    },
    async ({ environmentId, environmentName, ...dto }) => {
      try {
        const id = await resolveEnvironmentId(client, environmentId, environmentName);
        const result = await client.environments.update(id, dto);
        return {
          content: [{ type: "text", text: `Environment updated successfully:\n${JSON.stringify(result.data, null, 2)}` }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "arcane_environment_delete",
    "Delete a Docker environment from Arcane.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
    },
    async ({ environmentId, environmentName }) => {
      try {
        const id = await resolveEnvironmentId(client, environmentId, environmentName);
        const result = await client.environments.delete(id);
        return {
          content: [{ type: "text", text: result.message || "Environment deleted successfully" }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    },
  );
}
