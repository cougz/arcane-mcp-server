import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ArcaneClient } from "../arcane-client";
import { resolveEnvironmentId, resolveContainerId } from "./resolve";

export function registerContainerTools(server: McpServer, client: ArcaneClient): void {
  server.tool(
    "arcane_container_list",
    "List all Docker containers in an environment.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
    },
    async ({ environmentId, environmentName }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const result = await client.containers.list(envId);
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
    "arcane_container_get",
    "Get details of a specific Docker container by ID or name.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      containerId: z.string().optional().describe("Container ID (use if known)"),
      containerName: z.string().optional().describe("Container name (alternative to ID)"),
    },
    async ({ environmentId, environmentName, containerId, containerName }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const cId = await resolveContainerId(client, envId, containerId, containerName);
        const result = await client.containers.get(envId, cId);
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
    "arcane_container_start",
    "Start a Docker container.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      containerId: z.string().optional().describe("Container ID (use if known)"),
      containerName: z.string().optional().describe("Container name (alternative to ID)"),
    },
    async ({ environmentId, environmentName, containerId, containerName }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const cId = await resolveContainerId(client, envId, containerId, containerName);
        const containerNameValue = containerName || (await client.containers.get(envId, cId)).data.name;
        const result = await client.containers.start(envId, cId);
        return {
          content: [{ type: "text", text: `Container '${containerNameValue}' started successfully in environment '${envId}'` }],
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
    "arcane_container_stop",
    "Stop a Docker container.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      containerId: z.string().optional().describe("Container ID (use if known)"),
      containerName: z.string().optional().describe("Container name (alternative to ID)"),
    },
    async ({ environmentId, environmentName, containerId, containerName }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const cId = await resolveContainerId(client, envId, containerId, containerName);
        const containerNameValue = containerName || (await client.containers.get(envId, cId)).data.name;
        const result = await client.containers.stop(envId, cId);
        return {
          content: [{ type: "text", text: `Container '${containerNameValue}' stopped successfully in environment '${envId}'` }],
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
    "arcane_container_restart",
    "Restart a Docker container.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      containerId: z.string().optional().describe("Container ID (use if known)"),
      containerName: z.string().optional().describe("Container name (alternative to ID)"),
    },
    async ({ environmentId, environmentName, containerId, containerName }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const cId = await resolveContainerId(client, envId, containerId, containerName);
        const containerNameValue = containerName || (await client.containers.get(envId, cId)).data.name;
        const result = await client.containers.restart(envId, cId);
        return {
          content: [{ type: "text", text: `Container '${containerNameValue}' restarted successfully in environment '${envId}'` }],
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
    "arcane_container_kill",
    "Force kill a Docker container.",
    {
      environmentId: z.string().optional().describe("Environment ID (use if known)"),
      environmentName: z.string().optional().describe("Environment name (alternative to ID)"),
      containerId: z.string().optional().describe("Container ID (use if known)"),
      containerName: z.string().optional().describe("Container name (alternative to ID)"),
    },
    async ({ environmentId, environmentName, containerId, containerName }) => {
      try {
        const envId = await resolveEnvironmentId(client, environmentId, environmentName);
        const cId = await resolveContainerId(client, envId, containerId, containerName);
        const containerNameValue = containerName || (await client.containers.get(envId, cId)).data.name;
        const result = await client.containers.kill(envId, cId);
        return {
          content: [{ type: "text", text: `Container '${containerNameValue}' killed successfully in environment '${envId}'` }],
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
