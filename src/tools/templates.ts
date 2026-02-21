import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ArcaneClient } from "../arcane-client";

export function registerTemplateTools(server: McpServer, client: ArcaneClient): void {
  server.tool(
    "arcane_template_list",
    "List all Docker Compose templates.",
    {
      search: z.string().optional().describe("Filter templates by name"),
      limit: z.number().int().min(1).max(100).optional().default(50),
    },
    async ({ search, limit = 50 }) => {
      try {
        const result = await client.templates.list({ search, limit });
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
    "arcane_template_get",
    "Get details of a specific template.",
    {
      templateId: z.string().describe("Template ID"),
    },
    async ({ templateId }) => {
      try {
        const result = await client.templates.get(templateId);
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
    "arcane_template_create",
    "Create a new Docker Compose template.",
    {
      name: z.string().describe("Template name"),
      composeContent: z.string().describe("Docker Compose YAML content"),
      envContent: z.string().optional().describe("Environment variables file content"),
      description: z.string().optional().describe("Template description"),
      category: z.string().optional().describe("Template category"),
      tags: z.array(z.string()).optional().describe("Template tags"),
    },
    async (dto) => {
      try {
        const result = await client.templates.create(dto);
        return {
          content: [{ type: "text", text: `Template created successfully:\n${JSON.stringify(result.data, null, 2)}` }],
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
    "arcane_template_update",
    "Update an existing template.",
    {
      templateId: z.string().describe("Template ID"),
      name: z.string().optional().describe("New template name"),
      composeContent: z.string().optional().describe("New Docker Compose YAML content"),
      envContent: z.string().optional().describe("New environment variables file content"),
      description: z.string().optional().describe("New template description"),
      category: z.string().optional().describe("New template category"),
      tags: z.array(z.string()).optional().describe("New template tags"),
    },
    async ({ templateId, ...dto }) => {
      try {
        const result = await client.templates.update(templateId, dto);
        return {
          content: [{ type: "text", text: `Template updated successfully:\n${JSON.stringify(result.data, null, 2)}` }],
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
    "arcane_template_delete",
    "Delete a template.",
    {
      templateId: z.string().describe("Template ID"),
    },
    async ({ templateId }) => {
      try {
        const result = await client.templates.delete(templateId);
        return {
          content: [{ type: "text", text: result.message || "Template deleted successfully" }],
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
