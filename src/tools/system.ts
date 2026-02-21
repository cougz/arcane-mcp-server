import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ArcaneClient } from "../arcane-client";

export function registerSystemTools(server: McpServer, client: ArcaneClient): void {
  server.tool(
    "arcane_version",
    "Get the Arcane server version information.",
    {},
    async () => {
      try {
        const result = await client.system.version();
        return {
          content: [
            { type: "text", text: `Arcane version: ${result.data.version}` },
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
