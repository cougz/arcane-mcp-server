import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ArcaneClient } from "../arcane-client";
import { resolveEnvironmentId } from "./resolve";

export function registerVolumeBackupTools(server: McpServer, client: ArcaneClient): void {
  server.tool(
    "arcane_volume_backup_create",
    "Create a backup of a Docker volume.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      volumeName: z.string().describe("Volume name"),
    },
    async ({ environmentId, environmentName, volumeName }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const result = await client.volumeBackups.create(envId, volumeName);
        return {
          content: [{ type: "text", text: `Volume backup created successfully:\n${JSON.stringify(result.data, null, 2)}` }],
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
    "arcane_volume_backup_list",
    "List all backups for a Docker volume.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      volumeName: z.string().describe("Volume name"),
      search: z.string().optional().describe("Search query"),
      sort: z.string().optional().describe("Column to sort by"),
      order: z.string().optional().describe("Sort direction"),
      start: z.number().int().optional().describe("Start index"),
      limit: z.number().int().min(1).max(100).optional().default(50),
    },
    async ({ environmentId, environmentName, volumeName, search, sort, order, start, limit = 50 }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const result = await client.volumeBackups.list(envId, volumeName, { search, sort, order, start, limit });
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
    "arcane_volume_backup_delete",
    "Delete a volume backup.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      backupId: z.string().describe("Backup ID"),
    },
    async ({ environmentId, environmentName, backupId }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const result = await client.volumeBackups.delete(envId, backupId);
        return {
          content: [{ type: "text", text: result.message || "Volume backup deleted successfully" }],
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
    "arcane_volume_backup_download",
    "Download a volume backup. Returns download URL or instructions.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      backupId: z.string().describe("Backup ID"),
    },
    async ({ environmentId, environmentName, backupId }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        return {
          content: [{ type: "text", text: `Download available for backup '${backupId}' in environment '${envId}'.\nNote: Binary download is not supported via MCP tool interface. Use the API directly to download the backup file.` }],
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
    "arcane_volume_backup_restore",
    "Restore a volume from a backup.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      volumeName: z.string().describe("Volume name"),
      backupId: z.string().describe("Backup ID"),
    },
    async ({ environmentId, environmentName, volumeName, backupId }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const result = await client.volumeBackups.restore(envId, volumeName, backupId);
        return {
          content: [{ type: "text", text: result.message || "Volume restored successfully from backup" }],
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
