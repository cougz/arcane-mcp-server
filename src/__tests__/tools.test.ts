import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ArcaneClient, ArcaneApiError } from "../arcane-client";
import { registerEnvironmentTools } from "../tools/environments";
import { registerStackTools } from "../tools/stacks";
import { registerContainerTools } from "../tools/containers";
import { registerImageTools } from "../tools/images";
import { registerVolumeTools } from "../tools/volumes";
import { registerNetworkTools } from "../tools/networks";
import { registerTemplateTools } from "../tools/templates";
import { registerSystemTools } from "../tools/system";

describe("MCP Tools", () => {
  const createMockClient = () => {
    const mockClient = {
      environments: {
        list: vi.fn(),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      stacks: {
        list: vi.fn(),
        get: vi.fn(),
        deploy: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        restart: vi.fn(),
        pull: vi.fn(),
      },
      containers: {
        list: vi.fn(),
        get: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        restart: vi.fn(),
        kill: vi.fn(),
      },
      images: {
        list: vi.fn(),
        pull: vi.fn(),
        remove: vi.fn(),
        prune: vi.fn(),
      },
      volumes: {
        list: vi.fn(),
        inspect: vi.fn(),
        remove: vi.fn(),
        prune: vi.fn(),
      },
      networks: {
        list: vi.fn(),
        inspect: vi.fn(),
        remove: vi.fn(),
        prune: vi.fn(),
      },
      templates: {
        list: vi.fn(),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      system: {
        version: vi.fn(),
      },
    } as unknown as ArcaneClient;
    return mockClient;
  };

  const createServer = () => {
    const server = new McpServer({
      name: "Test Server",
      version: "1.0.0",
    });
    return server;
  };

  describe("environment tools", () => {
    it("registers arcane_environment_list tool", () => {
      const mockClient = createMockClient();
      const server = createServer();
      const listSpy = vi.spyOn(server, "tool");

      registerEnvironmentTools(server, mockClient);

      expect(listSpy).toHaveBeenCalledWith(
        "arcane_environment_list",
        expect.any(String),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("arcane_environment_list calls client.environments.list with correct params", async () => {
      const mockClient = createMockClient();
      mockClient.environments.list.mockResolvedValue({
        success: true,
        data: [{ id: "env1", name: "production", apiUrl: "http://localhost", status: "connected", enabled: true, isEdge: false }],
        pagination: { totalItems: 1, totalPages: 1, currentPage: 1, itemsPerPage: 50 },
      });

      const server = createServer();
      registerEnvironmentTools(server, mockClient);

      const toolHandler = (server as any).tools.get("arcane_environment_list");
      const result = await toolHandler.handler({ search: "prod", limit: 10 });

      expect(mockClient.environments.list).toHaveBeenCalledWith({ search: "prod", limit: 10 });
      expect(result.content).toEqual([{ type: "text", text: expect.any(String) }]);
    });

    it("arcane_environment_get with environmentId calls client.environments.get", async () => {
      const mockClient = createMockClient();
      mockClient.environments.get.mockResolvedValue({
        success: true,
        data: { id: "env1", name: "production", apiUrl: "http://localhost", status: "connected", enabled: true, isEdge: false },
      });

      const server = createServer();
      registerEnvironmentTools(server, mockClient);

      const toolHandler = (server as any).tools.get("arcane_environment_get");
      const result = await toolHandler.handler({ environmentId: "env1" });

      expect(mockClient.environments.get).toHaveBeenCalledWith("env1");
      expect(result.content).toEqual([{ type: "text", text: expect.any(String) }]);
    });

    it("arcane_environment_get with environmentName uses resolver", async () => {
      const mockClient = createMockClient();
      mockClient.environments.list.mockResolvedValue({
        success: true,
        data: [{ id: "env1", name: "production", apiUrl: "http://localhost", status: "connected", enabled: true, isEdge: false }],
        pagination: { totalItems: 1, totalPages: 1, currentPage: 1, itemsPerPage: 50 },
      });
      mockClient.environments.get.mockResolvedValue({
        success: true,
        data: { id: "env1", name: "production", apiUrl: "http://localhost", status: "connected", enabled: true, isEdge: false },
      });

      const server = createServer();
      registerEnvironmentTools(server, mockClient);

      const toolHandler = (server as any).tools.get("arcane_environment_get");
      await toolHandler.handler({ environmentName: "production" });

      expect(mockClient.environments.list).toHaveBeenCalledWith({ search: "production", limit: 50 });
      expect(mockClient.environments.get).toHaveBeenCalledWith("env1");
    });

    it("returns isError: true on ArcaneApiError", async () => {
      const mockClient = createMockClient();
      mockClient.environments.list.mockRejectedValue(new ArcaneApiError(404, "Not found"));

      const server = createServer();
      registerEnvironmentTools(server, mockClient);

      const toolHandler = (server as any).tools.get("arcane_environment_list");
      const result = await toolHandler.handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toMatch(/^Error:/);
    });
  });

  describe("stack tools", () => {
    it("registers arcane_stack_list tool", () => {
      const mockClient = createMockClient();
      const server = createServer();
      const listSpy = vi.spyOn(server, "tool");

      registerStackTools(server, mockClient);

      expect(listSpy).toHaveBeenCalledWith(
        "arcane_stack_list",
        expect.any(String),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("arcane_stack_list calls client.stacks.list with correct params", async () => {
      const mockClient = createMockClient();
      mockClient.stacks.list.mockResolvedValue({
        success: true,
        data: [{ id: "stack1", name: "myapp", path: "/myapp", status: "running", serviceCount: 2, runningCount: 2, createdAt: "2024-01-01", updatedAt: "2024-01-01" }],
        pagination: { totalItems: 1, totalPages: 1, currentPage: 1, itemsPerPage: 50 },
      });

      const server = createServer();
      registerStackTools(server, mockClient);

      const toolHandler = (server as any).tools.get("arcane_stack_list");
      const result = await toolHandler.handler({ environmentId: "env1", search: "myapp" });

      expect(mockClient.stacks.list).toHaveBeenCalledWith("env1", { search: "myapp", limit: 50 });
      expect(result.content).toEqual([{ type: "text", text: expect.any(String) }]);
    });

    it("arcane_stack_start returns human-readable message", async () => {
      const mockClient = createMockClient();
      mockClient.stacks.list.mockResolvedValue({
        success: true,
        data: [{ id: "stack1", name: "myapp", path: "/myapp", status: "running", serviceCount: 2, runningCount: 2, createdAt: "2024-01-01", updatedAt: "2024-01-01" }],
        pagination: { totalItems: 1, totalPages: 1, currentPage: 1, itemsPerPage: 50 },
      });
      mockClient.stacks.start.mockResolvedValue({ success: true, message: "Started" });

      const server = createServer();
      registerStackTools(server, mockClient);

      const toolHandler = (server as any).tools.get("arcane_stack_start");
      const result = await toolHandler.handler({ environmentId: "env1", stackName: "myapp" });

      expect(result.content[0].text).toBe("Stack 'myapp' started successfully in environment 'env1'");
    });
  });

  describe("container tools", () => {
    it("registers arcane_container_list tool", () => {
      const mockClient = createMockClient();
      const server = createServer();
      const listSpy = vi.spyOn(server, "tool");

      registerContainerTools(server, mockClient);

      expect(listSpy).toHaveBeenCalledWith(
        "arcane_container_list",
        expect.any(String),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("arcane_container_list calls client.containers.list", async () => {
      const mockClient = createMockClient();
      mockClient.containers.list.mockResolvedValue({
        success: true,
        data: [],
        pagination: { totalItems: 0, totalPages: 1, currentPage: 1, itemsPerPage: 50 },
      });

      const server = createServer();
      registerContainerTools(server, mockClient);

      const toolHandler = (server as any).tools.get("arcane_container_list");
      const result = await toolHandler.handler({ environmentId: "env1" });

      expect(mockClient.containers.list).toHaveBeenCalledWith("env1");
      expect(result.content).toEqual([{ type: "text", text: expect.any(String) }]);
    });

    it("arcane_container_start returns human-readable message", async () => {
      const mockClient = createMockClient();
      mockClient.containers.list.mockResolvedValue({
        success: true,
        data: [
          {
            id: "cont1",
            names: ["/web"],
            image: "nginx:latest",
            created: 123456,
            state: "running",
            status: "Up 5 minutes",
            ports: [],
            labels: {},
            hostConfig: {},
            networkSettings: {},
            mounts: [],
          },
        ],
        pagination: { totalItems: 1, totalPages: 1, currentPage: 1, itemsPerPage: 50 },
      });
      mockClient.containers.start.mockResolvedValue({ success: true, message: "Started" });

      const server = createServer();
      registerContainerTools(server, mockClient);

      const toolHandler = (server as any).tools.get("arcane_container_start");
      const result = await toolHandler.handler({ environmentId: "env1", containerName: "web" });

      expect(result.content[0].text).toBe("Container 'web' started successfully in environment 'env1'");
    });
  });

  describe("image tools", () => {
    it("registers arcane_image_list tool", () => {
      const mockClient = createMockClient();
      const server = createServer();
      const listSpy = vi.spyOn(server, "tool");

      registerImageTools(server, mockClient);

      expect(listSpy).toHaveBeenCalledWith("arcane_image_list", expect.any(String), expect.any(Object), expect.any(Function));
    });

    it("arcane_image_list calls client.images.list", async () => {
      const mockClient = createMockClient();
      mockClient.images.list.mockResolvedValue({
        success: true,
        data: [],
        pagination: { totalItems: 0, totalPages: 1, currentPage: 1, itemsPerPage: 50 },
      });

      const server = createServer();
      registerImageTools(server, mockClient);

      const toolHandler = (server as any).tools.get("arcane_image_list");
      const result = await toolHandler.handler({ environmentId: "env1" });

      expect(mockClient.images.list).toHaveBeenCalledWith("env1");
      expect(result.content).toEqual([{ type: "text", text: expect.any(String) }]);
    });
  });

  describe("volume tools", () => {
    it("registers arcane_volume_list tool", () => {
      const mockClient = createMockClient();
      const server = createServer();
      const listSpy = vi.spyOn(server, "tool");

      registerVolumeTools(server, mockClient);

      expect(listSpy).toHaveBeenCalledWith("arcane_volume_list", expect.any(String), expect.any(Object), expect.any(Function));
    });

    it("arcane_volume_list calls client.volumes.list", async () => {
      const mockClient = createMockClient();
      mockClient.volumes.list.mockResolvedValue({
        success: true,
        data: [],
        pagination: { totalItems: 0, totalPages: 1, currentPage: 1, itemsPerPage: 50 },
      });

      const server = createServer();
      registerVolumeTools(server, mockClient);

      const toolHandler = (server as any).tools.get("arcane_volume_list");
      const result = await toolHandler.handler({ environmentId: "env1" });

      expect(mockClient.volumes.list).toHaveBeenCalledWith("env1");
      expect(result.content).toEqual([{ type: "text", text: expect.any(String) }]);
    });
  });

  describe("network tools", () => {
    it("registers arcane_network_list tool", () => {
      const mockClient = createMockClient();
      const server = createServer();
      const listSpy = vi.spyOn(server, "tool");

      registerNetworkTools(server, mockClient);

      expect(listSpy).toHaveBeenCalledWith("arcane_network_list", expect.any(String), expect.any(Object), expect.any(Function));
    });

    it("arcane_network_list calls client.networks.list", async () => {
      const mockClient = createMockClient();
      mockClient.networks.list.mockResolvedValue({
        success: true,
        data: [],
        pagination: { totalItems: 0, totalPages: 1, currentPage: 1, itemsPerPage: 50 },
      });

      const server = createServer();
      registerNetworkTools(server, mockClient);

      const toolHandler = (server as any).tools.get("arcane_network_list");
      const result = await toolHandler.handler({ environmentId: "env1" });

      expect(mockClient.networks.list).toHaveBeenCalledWith("env1");
      expect(result.content).toEqual([{ type: "text", text: expect.any(String) }]);
    });
  });

  describe("template tools", () => {
    it("registers arcane_template_list tool", () => {
      const mockClient = createMockClient();
      const server = createServer();
      const listSpy = vi.spyOn(server, "tool");

      registerTemplateTools(server, mockClient);

      expect(listSpy).toHaveBeenCalledWith("arcane_template_list", expect.any(String), expect.any(Object), expect.any(Function));
    });

    it("arcane_template_list calls client.templates.list", async () => {
      const mockClient = createMockClient();
      mockClient.templates.list.mockResolvedValue({
        success: true,
        data: [],
        pagination: { totalItems: 0, totalPages: 1, currentPage: 1, itemsPerPage: 50 },
      });

      const server = createServer();
      registerTemplateTools(server, mockClient);

      const toolHandler = (server as any).tools.get("arcane_template_list");
      const result = await toolHandler.handler({ search: "wordpress" });

      expect(mockClient.templates.list).toHaveBeenCalledWith({ search: "wordpress", limit: 50 });
      expect(result.content).toEqual([{ type: "text", text: expect.any(String) }]);
    });
  });

  describe("system tools", () => {
    it("registers arcane_version tool", () => {
      const mockClient = createMockClient();
      const server = createServer();
      const listSpy = vi.spyOn(server, "tool");

      registerSystemTools(server, mockClient);

      expect(listSpy).toHaveBeenCalledWith("arcane_version", expect.any(String), expect.any(Object), expect.any(Function));
    });

    it("arcane_version calls client.system.version", async () => {
      const mockClient = createMockClient();
      mockClient.system.version.mockResolvedValue({
        success: true,
        data: { version: "1.2.3" },
      });

      const server = createServer();
      registerSystemTools(server, mockClient);

      const toolHandler = (server as any).tools.get("arcane_version");
      const result = await toolHandler.handler({});

      expect(mockClient.system.version).toHaveBeenCalled();
      expect(result.content).toEqual([{ type: "text", text: expect.any(String) }]);
    });
  });
});
