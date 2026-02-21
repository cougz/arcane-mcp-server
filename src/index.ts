import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { ArcaneClient } from "./arcane-client";
import { registerEnvironmentTools } from "./tools/environments";
import { registerStackTools } from "./tools/stacks";
import { registerContainerTools } from "./tools/containers";
import { registerImageTools } from "./tools/images";
import { registerVolumeTools } from "./tools/volumes";
import { registerNetworkTools } from "./tools/networks";
import { registerTemplateTools } from "./tools/templates";
import { registerSystemTools } from "./tools/system";

export class ArcaneAgent extends McpAgent<Env, Record<string, never>, Record<string, never>> {
  server = new McpServer({
    name: "Arcane Docker MCP Server",
    version: "1.0.0",
  });

  async init() {
    const client = new ArcaneClient(this.env.ARCANE_HOST, this.env.ARCANE_API_KEY);

    registerEnvironmentTools(this.server, client);
    registerStackTools(this.server, client);
    registerContainerTools(this.server, client);
    registerImageTools(this.server, client);
    registerVolumeTools(this.server, client);
    registerNetworkTools(this.server, client);
    registerTemplateTools(this.server, client);
    registerSystemTools(this.server, client);
  }
}

export default ArcaneAgent.serve("/mcp");
