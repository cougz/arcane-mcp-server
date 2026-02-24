import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ArcaneClient } from "../arcane-client";
import { resolveEnvironmentId } from "./resolve";

export async function resolveGitOpsSyncId(
  client: ArcaneClient,
  envId: string,
  syncId?: string,
  syncName?: string
): Promise<string> {
  if (syncId) {
    return syncId;
  }

  if (!syncName) {
    throw new Error("Either syncId or syncName must be provided");
  }

  const result = await client.gitOpsSyncs.list(envId);
  const matches = result.data?.filter((sync) => sync.name === syncName) ?? [];

  if (matches.length === 0) {
    const available = result.data?.map((sync) => sync.name).join(", ") ?? "none";
    throw new Error(`No GitOps sync found with name '${syncName}' in environment '${envId}'. Available syncs: ${available}`);
  }

  if (matches.length > 1) {
    const matchingIds = matches.map((sync) => sync.id).join(", ");
    throw new Error(
      `Multiple GitOps syncs found with name '${syncName}' in environment '${envId}'. Please use the sync ID instead. Matching IDs: ${matchingIds}`
    );
  }

  return matches[0].id;
}

export function registerGitOpsSyncTools(server: McpServer, client: ArcaneClient): void {
  server.tool(
    "arcane_gitops_sync_list",
    "List all GitOps syncs in an environment. GitOps syncs automatically deploy stacks from git repositories.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      search: z.string().optional().describe("Search query"),
      sort: z.string().optional().describe("Column to sort by"),
      order: z.string().optional().describe("Sort direction"),
      start: z.number().int().optional().describe("Start index"),
      limit: z.number().int().min(1).max(100).optional().default(50),
    },
    async ({ environmentId, environmentName, search, sort, order, start, limit = 50 }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const result = await client.gitOpsSyncs.list(envId, { search, sort, order, start, limit });
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
    "arcane_gitops_sync_get",
    "Get details of a specific GitOps sync by ID or name.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      syncId: z.string().optional().describe("Sync ID (use if known)"),
      syncName: z.string().optional().describe("Sync name (alternative to ID)"),
    },
    async ({ environmentId, environmentName, syncId, syncName }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const sId = await resolveGitOpsSyncId(client, envId, syncId, syncName);
        const result = await client.gitOpsSyncs.get(envId, sId);
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
    "arcane_gitops_sync_create",
    "Create a GitOps sync configuration for automatic deployment from a git repository.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      name: z.string().describe("Sync name"),
      repositoryId: z.string().describe("Git repository ID"),
      branch: z.string().describe("Git branch to sync"),
      composePath: z.string().describe("Path to docker-compose.yml in repository"),
      projectName: z.string().optional().describe("Project name (optional)"),
      autoSync: z.boolean().optional().describe("Enable automatic sync"),
      syncInterval: z.number().int().optional().describe("Sync interval in minutes"),
    },
    async ({ environmentId, environmentName, ...dto }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const result = await client.gitOpsSyncs.create(envId, dto);
        return {
          content: [{ type: "text", text: `GitOps sync created successfully:\n${JSON.stringify(result.data, null, 2)}` }],
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
    "arcane_gitops_sync_update",
    "Update an existing GitOps sync.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      syncId: z.string().optional().describe("Sync ID (use if known)"),
      syncName: z.string().optional().describe("Sync name (alternative to ID)"),
      name: z.string().optional().describe("New sync name"),
      repositoryId: z.string().optional().describe("New git repository ID"),
      branch: z.string().optional().describe("New git branch"),
      composePath: z.string().optional().describe("New path to docker-compose.yml"),
      projectName: z.string().optional().describe("New project name"),
      autoSync: z.boolean().optional().describe("Enable or disable automatic sync"),
      syncInterval: z.number().int().optional().describe("New sync interval in minutes"),
    },
    async ({ environmentId, environmentName, syncId, syncName, ...dto }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const sId = await resolveGitOpsSyncId(client, envId, syncId, syncName);
        const result = await client.gitOpsSyncs.update(envId, sId, dto);
        return {
          content: [{ type: "text", text: `GitOps sync updated successfully:\n${JSON.stringify(result.data, null, 2)}` }],
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
    "arcane_gitops_sync_delete",
    "Delete a GitOps sync from an environment.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      syncId: z.string().optional().describe("Sync ID (use if known)"),
      syncName: z.string().optional().describe("Sync name (alternative to ID)"),
    },
    async ({ environmentId, environmentName, syncId, syncName }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const sId = await resolveGitOpsSyncId(client, envId, syncId, syncName);
        const result = await client.gitOpsSyncs.delete(envId, sId);
        return {
          content: [{ type: "text", text: result.message || "GitOps sync deleted successfully" }],
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
    "arcane_gitops_sync_browse_files",
    "Browse files in a GitOps sync repository.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      syncId: z.string().optional().describe("Sync ID (use if known)"),
      syncName: z.string().optional().describe("Sync name (alternative to ID)"),
      path: z.string().optional().describe("Path to browse (defaults to root)"),
    },
    async ({ environmentId, environmentName, syncId, syncName, path }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const sId = await resolveGitOpsSyncId(client, envId, syncId, syncName);
        const result = await client.gitOpsSyncs.browseFiles(envId, sId, path);
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
    "arcane_gitops_sync_get_status",
    "Get the current sync status of a GitOps sync.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      syncId: z.string().optional().describe("Sync ID (use if known)"),
      syncName: z.string().optional().describe("Sync name (alternative to ID)"),
    },
    async ({ environmentId, environmentName, syncId, syncName }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const sId = await resolveGitOpsSyncId(client, envId, syncId, syncName);
        const result = await client.gitOpsSyncs.getStatus(envId, sId);
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
    "arcane_gitops_sync_perform_sync",
    "Manually trigger a sync for a GitOps sync.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      syncId: z.string().optional().describe("Sync ID (use if known)"),
      syncName: z.string().optional().describe("Sync name (alternative to ID)"),
    },
    async ({ environmentId, environmentName, syncId, syncName }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const sId = await resolveGitOpsSyncId(client, envId, syncId, syncName);
        const result = await client.gitOpsSyncs.performSync(envId, sId);
        return {
          content: [{ type: "text", text: result.message || "GitOps sync performed successfully" }],
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
