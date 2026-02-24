import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ArcaneClient } from "../arcane-client";
import { resolveEnvironmentId } from "./resolve";

export function registerVolumeFileTools(server: McpServer, client: ArcaneClient): void {
  server.tool(
    "arcane_volume_browse",
    "Browse files and directories in a Docker volume.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      volumeName: z.string().describe("Volume name"),
      path: z.string().optional().describe("Directory path to browse (defaults to root)"),
    },
    async ({ environmentId, environmentName, volumeName, path }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const result = await client.volumeFiles.browse(envId, volumeName, path);
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
    "arcane_volume_upload_file",
    "Upload a file to a Docker volume.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      volumeName: z.string().describe("Volume name"),
      filename: z.string().describe("Name of the file to create"),
      content: z.string().describe("File content"),
      path: z.string().optional().describe("Destination path within the volume (defaults to root)"),
    },
    async ({ environmentId, environmentName, volumeName, filename, content, path }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const result = await client.volumeFiles.upload(envId, volumeName, filename, content, path);
        return {
          content: [{ type: "text", text: result.message || "File uploaded successfully" }],
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
