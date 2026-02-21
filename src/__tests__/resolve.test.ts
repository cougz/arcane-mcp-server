import { describe, it, expect, vi } from "vitest";
import type { ArcaneClient } from "../arcane-client";
import { resolveEnvironmentId, resolveStackId, resolveContainerId } from "../tools/resolve";

describe("resolve helpers", () => {
  describe("resolveEnvironmentId", () => {
    it("returns envId immediately if provided (no API call)", async () => {
      const mockClient = {
        environments: { list: vi.fn() },
      } as unknown as ArcaneClient;

      const result = await resolveEnvironmentId(mockClient, "env123", undefined);
      expect(result).toBe("env123");
      expect(mockClient.environments.list).not.toHaveBeenCalled();
    });

    it("calls client.environments.list() if only envName given, returns matched ID", async () => {
      const mockClient = {
        environments: {
          list: vi.fn().mockResolvedValue({
            success: true,
            data: [
              { id: "env123", name: "production" },
              { id: "env456", name: "staging" },
            ],
            pagination: { totalItems: 2, totalPages: 1, currentPage: 1, itemsPerPage: 50 },
          }),
        },
      } as unknown as ArcaneClient;

      const result = await resolveEnvironmentId(mockClient, undefined, "production");
      expect(result).toBe("env123");
      expect(mockClient.environments.list).toHaveBeenCalledWith({ search: "production", limit: 50 });
    });

    it("throws with list of available names if no match found", async () => {
      const mockClient = {
        environments: {
          list: vi.fn().mockResolvedValue({
            success: true,
            data: [
              { id: "env123", name: "production" },
              { id: "env456", name: "staging" },
            ],
            pagination: { totalItems: 2, totalPages: 1, currentPage: 1, itemsPerPage: 50 },
          }),
        },
      } as unknown as ArcaneClient;

      await expect(resolveEnvironmentId(mockClient, undefined, "dev")).rejects.toThrow(
        "No environment found with name 'dev'. Available environments: production, staging"
      );
    });

    it("throws with instruction to use ID if multiple matches found", async () => {
      const mockClient = {
        environments: {
          list: vi.fn().mockResolvedValue({
            success: true,
            data: [
              { id: "env123", name: "app" },
              { id: "env456", name: "app" },
            ],
            pagination: { totalItems: 2, totalPages: 1, currentPage: 1, itemsPerPage: 50 },
          }),
        },
      } as unknown as ArcaneClient;

      await expect(resolveEnvironmentId(mockClient, undefined, "app")).rejects.toThrow(
        "Multiple environments found with name 'app'. Please use the environment ID instead. Matching IDs: env123, env456"
      );
    });

    it("throws if neither envId nor envName provided", async () => {
      const mockClient = {} as unknown as ArcaneClient;

      await expect(resolveEnvironmentId(mockClient, undefined, undefined)).rejects.toThrow(
        "Either environmentId or environmentName must be provided"
      );
    });
  });

  describe("resolveStackId", () => {
    it("returns stackId immediately if provided (no API call)", async () => {
      const mockClient = {
        stacks: { list: vi.fn() },
      } as unknown as ArcaneClient;

      const result = await resolveStackId(mockClient, "env123", "stack456", undefined);
      expect(result).toBe("stack456");
      expect(mockClient.stacks.list).not.toHaveBeenCalled();
    });

    it("calls client.stacks.list() if only stackName given, returns matched ID", async () => {
      const mockClient = {
        stacks: {
          list: vi.fn().mockResolvedValue({
            success: true,
            data: [
              { id: "stack456", name: "myapp" },
              { id: "stack789", name: "db" },
            ],
            pagination: { totalItems: 2, totalPages: 1, currentPage: 1, itemsPerPage: 50 },
          }),
        },
      } as unknown as ArcaneClient;

      const result = await resolveStackId(mockClient, "env123", undefined, "myapp");
      expect(result).toBe("stack456");
      expect(mockClient.stacks.list).toHaveBeenCalledWith("env123", { search: "myapp", limit: 50 });
    });

    it("throws with list of available names if no match found", async () => {
      const mockClient = {
        stacks: {
          list: vi.fn().mockResolvedValue({
            success: true,
            data: [
              { id: "stack456", name: "myapp" },
              { id: "stack789", name: "db" },
            ],
            pagination: { totalItems: 2, totalPages: 1, currentPage: 1, itemsPerPage: 50 },
          }),
        },
      } as unknown as ArcaneClient;

      await expect(resolveStackId(mockClient, "env123", undefined, "redis")).rejects.toThrow(
        "No stack found with name 'redis' in environment 'env123'. Available stacks: myapp, db"
      );
    });

    it("throws with instruction to use ID if multiple matches found", async () => {
      const mockClient = {
        stacks: {
          list: vi.fn().mockResolvedValue({
            success: true,
            data: [
              { id: "stack456", name: "web" },
              { id: "stack789", name: "web" },
            ],
            pagination: { totalItems: 2, totalPages: 1, currentPage: 1, itemsPerPage: 50 },
          }),
        },
      } as unknown as ArcaneClient;

      await expect(resolveStackId(mockClient, "env123", undefined, "web")).rejects.toThrow(
        "Multiple stacks found with name 'web' in environment 'env123'. Please use the stack ID instead. Matching IDs: stack456, stack789"
      );
    });

    it("throws if neither stackId nor stackName provided", async () => {
      const mockClient = {} as unknown as ArcaneClient;

      await expect(resolveStackId(mockClient, "env123", undefined, undefined)).rejects.toThrow(
        "Either stackId or stackName must be provided"
      );
    });
  });

  describe("resolveContainerId", () => {
    it("returns containerId immediately if provided (no API call)", async () => {
      const mockClient = {
        containers: { list: vi.fn() },
      } as unknown as ArcaneClient;

      const result = await resolveContainerId(mockClient, "env123", "cont456", undefined);
      expect(result).toBe("cont456");
      expect(mockClient.containers.list).not.toHaveBeenCalled();
    });

    it("calls client.containers.list() if only containerName given, returns matched ID", async () => {
      const mockClient = {
        containers: {
          list: vi.fn().mockResolvedValue({
            success: true,
            data: [
              { id: "cont456", names: ["/myapp"], image: "nginx:latest", created: 123456, state: "running", status: "Up 5 minutes", ports: [], labels: {}, hostConfig: {}, networkSettings: {}, mounts: [] },
              { id: "cont789", names: ["/db"], image: "postgres:14", created: 123457, state: "running", status: "Up 10 minutes", ports: [], labels: {}, hostConfig: {}, networkSettings: {}, mounts: [] },
            ],
            pagination: { totalItems: 2, totalPages: 1, currentPage: 1, itemsPerPage: 50 },
          }),
        },
      } as unknown as ArcaneClient;

      const result = await resolveContainerId(mockClient, "env123", undefined, "myapp");
      expect(result).toBe("cont456");
      expect(mockClient.containers.list).toHaveBeenCalledWith("env123");
    });

    it("throws with list of available names if no match found", async () => {
      const mockClient = {
        containers: {
          list: vi.fn().mockResolvedValue({
            success: true,
            data: [
              { id: "cont456", names: ["/myapp"], image: "nginx:latest", created: 123456, state: "running", status: "Up 5 minutes", ports: [], labels: {}, hostConfig: {}, networkSettings: {}, mounts: [] },
            ],
            pagination: { totalItems: 1, totalPages: 1, currentPage: 1, itemsPerPage: 50 },
          }),
        },
      } as unknown as ArcaneClient;

      await expect(resolveContainerId(mockClient, "env123", undefined, "redis")).rejects.toThrow(
        "No container found with name 'redis' in environment 'env123'. Available containers: myapp"
      );
    });

    it("throws with instruction to use ID if multiple matches found", async () => {
      const mockClient = {
        containers: {
          list: vi.fn().mockResolvedValue({
            success: true,
            data: [
              { id: "cont456", names: ["/web"], image: "nginx:latest", created: 123456, state: "running", status: "Up 5 minutes", ports: [], labels: {}, hostConfig: {}, networkSettings: {}, mounts: [] },
              { id: "cont789", names: ["/web"], image: "nginx:latest", created: 123457, state: "running", status: "Up 3 minutes", ports: [], labels: {}, hostConfig: {}, networkSettings: {}, mounts: [] },
            ],
            pagination: { totalItems: 2, totalPages: 1, currentPage: 1, itemsPerPage: 50 },
          }),
        },
      } as unknown as ArcaneClient;

      await expect(resolveContainerId(mockClient, "env123", undefined, "web")).rejects.toThrow(
        "Multiple containers found with name 'web' in environment 'env123'. Please use the container ID instead. Matching IDs: cont456, cont789"
      );
    });

    it("throws if neither containerId nor containerName provided", async () => {
      const mockClient = {} as unknown as ArcaneClient;

      await expect(resolveContainerId(mockClient, "env123", undefined, undefined)).rejects.toThrow(
        "Either containerId or containerName must be provided"
      );
    });
  });
});
