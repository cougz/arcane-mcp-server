import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { ArcaneClient } from "./arcane-client";
import { registerEnvironmentTools } from "./tools/environments";
import { registerStackTools } from "./tools/stacks";
import { registerContainerTools } from "./tools/containers";
import { registerContainerAdditionalTools } from "./tools/containers-additional";
import { registerImageTools } from "./tools/images";
import { registerVolumeTools } from "./tools/volumes";
import { registerVolumeBackupTools } from "./tools/volume-backups";
import { registerVolumeFileTools } from "./tools/volume-files";
import { registerNetworkTools } from "./tools/networks";
import { registerTemplateTools } from "./tools/templates";
import { registerSystemTools } from "./tools/system";
import { registerGitRepositoryTools } from "./tools/git-repositories";
import { registerGitOpsSyncTools } from "./tools/gitops-syncs";
import { registerProjectAdditionalTools } from "./tools/projects-additional";

export class ArcaneAgent extends McpAgent<Env, Record<string, never>, Record<string, never>> {
  server = new McpServer({
    name: "Arcane Docker MCP Server",
    version: "1.0.0",
  });

  async init() {
    const useVpc = this.env.USE_VPC === "true";
    const client = new ArcaneClient(
      useVpc ? "http://arcane1.home.seiffert.me" : this.env.ARCANE_HOST,
      this.env.ARCANE_API_KEY,
      useVpc ? this.env.VPC_SERVICE : undefined,
    );

    registerEnvironmentTools(this.server, client);
    registerStackTools(this.server, client);
    registerContainerTools(this.server, client);
    registerContainerAdditionalTools(this.server, client);
    registerImageTools(this.server, client);
    registerVolumeTools(this.server, client);
    registerVolumeBackupTools(this.server, client);
    registerVolumeFileTools(this.server, client);
    registerNetworkTools(this.server, client);
    registerTemplateTools(this.server, client);
    registerSystemTools(this.server, client);
    registerGitRepositoryTools(this.server, client);
    registerGitOpsSyncTools(this.server, client);
    registerProjectAdditionalTools(this.server, client);
  }
}

export default ArcaneAgent.serve("/mcp");
