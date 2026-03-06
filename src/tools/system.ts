import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ArcaneClient } from "../arcane-client";

export function registerSystemTools(server: McpServer, client: ArcaneClient): void {
  server.tool(
    "arcane_version",
    "Get the Arcane server version information.",
    {},
    async () => {
      try {
        const result = await client.system.version();
        const lines = [
          `Arcane version: ${result.displayVersion}`,
          `Go version: ${result.goVersion}`,
          `Revision: ${result.shortRevision}`,
          ...(result.buildTime ? [`Build time: ${result.buildTime}`] : []),
          result.updateAvailable
            ? `Update available: ${result.newestVersion} — ${result.releaseUrl}`
            : `Up to date`,
        ];
        return {
          content: [{ type: "text", text: lines.join("\n") }],
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
