import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ArcaneClient } from "../arcane-client";
import { resolveEnvironmentId } from "./resolve";

export function registerImageTools(server: McpServer, client: ArcaneClient): void {
  server.tool(
    "arcane_image_list",
    "List all Docker images in an environment.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
    },
    async ({ environmentId, environmentName }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const result = await client.images.list(envId);
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
    "arcane_image_pull",
    "Pull a Docker image in an environment.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      imageName: z.string().describe("Image name to pull (e.g., nginx:latest)"),
    },
    async ({ environmentId, environmentName, imageName }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const result = await client.images.pull(envId, { imageName });
        return {
          content: [{ type: "text", text: result.message || `Image '${imageName}' pulled successfully` }],
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
    "arcane_image_remove",
    "Remove a Docker image from an environment.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      imageId: z.string().describe("Image ID to remove"),
    },
    async ({ environmentId, environmentName, imageId }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const result = await client.images.remove(envId, imageId);
        return {
          content: [{ type: "text", text: result.message || `Image '${imageId}' removed successfully` }],
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
    "arcane_image_prune",
    "Remove unused Docker images from an environment.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
    },
    async ({ environmentId, environmentName }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const result = await client.images.prune(envId);
        return {
          content: [
            {
              type: "text",
              text: `Pruned ${result.data.imagesDeleted} images, reclaimed ${result.data.spaceReclaimed} bytes`,
            },
          ],
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
