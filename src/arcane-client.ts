export class ArcaneApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ArcaneApiError";
  }
}

export interface Environment {
  id: string;
  name: string;
  apiUrl: string;
  status: string;
  enabled: boolean;
  isEdge: boolean;
  apiKey?: string;
}

export interface EnvironmentCreate {
  apiUrl: string;
  name?: string;
  accessToken?: string;
  bootstrapToken?: string;
  enabled?: boolean;
  isEdge?: boolean;
  useApiKey?: boolean;
}

export interface EnvironmentUpdate {
  name?: string;
  apiUrl?: string;
  accessToken?: string;
  bootstrapToken?: string;
  enabled?: boolean;
  regenerateApiKey?: boolean;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  status: string;
  serviceCount: number;
  runningCount: number;
  createdAt: string;
  updatedAt: string;
  composeContent?: string;
  envContent?: string;
  dirName?: string;
  gitRepositoryURL?: string;
  gitOpsManagedBy?: string;
  iconUrl?: string;
  lastSyncCommit?: string;
  statusReason?: string;
  urls?: string[] | null;
}

export interface ProjectCreate {
  name: string;
  composeContent: string;
  envContent?: string;
}

export interface ProjectUpdate {
  name?: string;
  composeContent?: string;
  envContent?: string;
}

export interface ContainerSummary {
  id: string;
  names: string[] | null;
  image: string;
  imageId: string;
  command: string;
  created: number;
  state: string;
  status: string;
  ports: any[] | null;
  labels: Record<string, string>;
  hostConfig: any;
  networkSettings: any;
  mounts: any[] | null;
  updateInfo?: any;
}

export interface ContainerDetails {
  id: string;
  name: string;
  image: string;
  imageId: string;
  created: string;
  state: any;
  config: any;
  hostConfig: any;
  networkSettings: any;
  ports: any[] | null;
  mounts: any[] | null;
  labels: Record<string, string>;
}

export interface ImageSummary {
  id: string;
  repoTags: string[] | null;
  repoDigests: string[] | null;
  created: number;
  size: number;
  virtualSize: number;
  labels: Record<string, any>;
  inUse: boolean;
  repo: string;
  tag: string;
  updateInfo?: any;
}

export interface ImagePullOptions {
  imageName: string;
}

export interface ImagePruneReport {
  imagesDeleted: number;
  spaceReclaimed: number;
}

export interface Volume {
  name: string;
  driver: string;
  mountpoint: string;
  createdAt?: string;
  size?: number;
  usageData?: any;
}

export interface VolumePruneReport {
  volumesDeleted: number;
  spaceReclaimed: number;
}

export interface NetworkSummary {
  id: string;
  name: string;
  driver: string;
  scope: string;
  created?: string;
  internal: boolean;
  attachable: boolean;
  ingress: boolean;
  ipam?: any;
}

export interface NetworkInspect {
  id: string;
  name: string;
  driver: string;
  scope: string;
  internal: boolean;
  attachable: boolean;
  ingress: boolean;
  ipam: any;
  containers: any;
  options: any;
  labels: Record<string, string>;
  created?: string;
}

export interface NetworkPruneReport {
  networksDeleted: number;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  composeContent?: string;
  envContent?: string;
  category?: string;
  tags?: string[];
  iconUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateCreate {
  name: string;
  composeContent: string;
  envContent?: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface TemplateUpdate {
  name?: string;
  composeContent?: string;
  envContent?: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface Pagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  grandTotalItems?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[] | null;
  pagination: Pagination;
}

export interface ActionResponse {
  success: boolean;
  message: string;
}

export interface ListOptions {
  search?: string;
  limit?: number;
}

class EnvironmentsMethods {
  constructor(private client: ArcaneClient) {}

  async list(opts?: ListOptions): Promise<PaginatedResponse<Environment>> {
    const params = new URLSearchParams();
    if (opts?.search) params.set("search", opts.search);
    if (opts?.limit) params.set("limit", String(opts.limit));
    const query = params.toString();
    return this.client.request<PaginatedResponse<Environment>>(
      "GET",
      `/environments${query ? `?${query}` : ""}`
    );
  }

  async get(id: string): Promise<{ success: boolean; data: Environment }> {
    return this.client.request<{ success: boolean; data: Environment }>("GET", `/environments/${id}`);
  }

  async create(dto: EnvironmentCreate): Promise<{ success: boolean; data: Environment }> {
    return this.client.request<{ success: boolean; data: Environment }>("POST", "/environments", dto);
  }

  async update(id: string, dto: EnvironmentUpdate): Promise<{ success: boolean; data: Environment }> {
    return this.client.request<{ success: boolean; data: Environment }>("PUT", `/environments/${id}`, dto);
  }

  async delete(id: string): Promise<ActionResponse> {
    return this.client.request<ActionResponse>("DELETE", `/environments/${id}`);
  }
}

class StacksMethods {
  constructor(private client: ArcaneClient) {}

  async list(envId: string, opts?: ListOptions): Promise<PaginatedResponse<Project>> {
    const params = new URLSearchParams();
    if (opts?.search) params.set("search", opts.search);
    const query = params.toString();
    return this.client.request<PaginatedResponse<Project>>(
      "GET",
      `/environments/${envId}/projects${query ? `?${query}` : ""}`
    );
  }

  async get(envId: string, stackId: string): Promise<{ success: boolean; data: Project }> {
    return this.client.request<{ success: boolean; data: Project }>("GET", `/environments/${envId}/projects/${stackId}`);
  }

  async deploy(envId: string, dto: ProjectCreate): Promise<ActionResponse> {
    return this.client.request<ActionResponse>("POST", `/environments/${envId}/projects`, dto);
  }

  async update(envId: string, stackId: string, dto: ProjectUpdate): Promise<{ success: boolean; data: Project }> {
    return this.client.request<{ success: boolean; data: Project }>("PUT", `/environments/${envId}/projects/${stackId}`, dto);
  }

  async delete(envId: string, stackId: string): Promise<ActionResponse> {
    return this.client.request<ActionResponse>("DELETE", `/environments/${envId}/projects/${stackId}/destroy`);
  }

  async start(envId: string, stackId: string): Promise<ActionResponse> {
    return this.client.request<ActionResponse>("POST", `/environments/${envId}/projects/${stackId}/up`);
  }

  async stop(envId: string, stackId: string): Promise<ActionResponse> {
    return this.client.request<ActionResponse>("POST", `/environments/${envId}/projects/${stackId}/down`);
  }

  async restart(envId: string, stackId: string): Promise<ActionResponse> {
    return this.client.request<ActionResponse>("POST", `/environments/${envId}/projects/${stackId}/restart`);
  }

  async pull(envId: string, stackId: string): Promise<ActionResponse> {
    return this.client.request<ActionResponse>("POST", `/environments/${envId}/projects/${stackId}/pull-project-images`);
  }
}

class ContainersMethods {
  constructor(private client: ArcaneClient) {}

  async list(envId: string): Promise<PaginatedResponse<ContainerSummary>> {
    return this.client.request<PaginatedResponse<ContainerSummary>>("GET", `/environments/${envId}/containers`);
  }

  async get(envId: string, containerId: string): Promise<{ success: boolean; data: ContainerDetails }> {
    return this.client.request<{ success: boolean; data: ContainerDetails }>(
      "GET",
      `/environments/${envId}/containers/${containerId}`
    );
  }

  async start(envId: string, containerId: string): Promise<ActionResponse> {
    return this.client.request<ActionResponse>("POST", `/environments/${envId}/containers/${containerId}/start`);
  }

  async stop(envId: string, containerId: string): Promise<ActionResponse> {
    return this.client.request<ActionResponse>("POST", `/environments/${envId}/containers/${containerId}/stop`);
  }

  async restart(envId: string, containerId: string): Promise<ActionResponse> {
    return this.client.request<ActionResponse>("POST", `/environments/${envId}/containers/${containerId}/restart`);
  }

  async kill(envId: string, containerId: string): Promise<ActionResponse> {
    return this.client.request<ActionResponse>("POST", `/environments/${envId}/containers/${containerId}/update`, { action: "kill" });
  }
}

class ImagesMethods {
  constructor(private client: ArcaneClient) {}

  async list(envId: string): Promise<PaginatedResponse<ImageSummary>> {
    return this.client.request<PaginatedResponse<ImageSummary>>("GET", `/environments/${envId}/images`);
  }

  async pull(envId: string, dto: ImagePullOptions): Promise<ActionResponse> {
    return this.client.request<ActionResponse>("POST", `/environments/${envId}/images/pull`, dto);
  }

  async remove(envId: string, imageId: string): Promise<ActionResponse> {
    return this.client.request<ActionResponse>("DELETE", `/environments/${envId}/images/${imageId}`);
  }

  async prune(envId: string): Promise<{ success: boolean; data: ImagePruneReport }> {
    return this.client.request<{ success: boolean; data: ImagePruneReport }>("POST", `/environments/${envId}/images/prune`);
  }
}

class VolumesMethods {
  constructor(private client: ArcaneClient) {}

  async list(envId: string): Promise<PaginatedResponse<Volume>> {
    return this.client.request<PaginatedResponse<Volume>>("GET", `/environments/${envId}/volumes`);
  }

  async inspect(envId: string, name: string): Promise<{ success: boolean; data: Volume }> {
    return this.client.request<{ success: boolean; data: Volume }>("GET", `/environments/${envId}/volumes/${name}`);
  }

  async remove(envId: string, name: string): Promise<ActionResponse> {
    return this.client.request<ActionResponse>("DELETE", `/environments/${envId}/volumes/${name}`);
  }

  async prune(envId: string): Promise<{ success: boolean; data: VolumePruneReport }> {
    return this.client.request<{ success: boolean; data: VolumePruneReport }>("POST", `/environments/${envId}/volumes/prune`);
  }
}

class NetworksMethods {
  constructor(private client: ArcaneClient) {}

  async list(envId: string): Promise<PaginatedResponse<NetworkSummary>> {
    return this.client.request<PaginatedResponse<NetworkSummary>>("GET", `/environments/${envId}/networks`);
  }

  async inspect(envId: string, networkId: string): Promise<{ success: boolean; data: NetworkInspect }> {
    return this.client.request<{ success: boolean; data: NetworkInspect }>(
      "GET",
      `/environments/${envId}/networks/${networkId}`
    );
  }

  async remove(envId: string, networkId: string): Promise<ActionResponse> {
    return this.client.request<ActionResponse>("DELETE", `/environments/${envId}/networks/${networkId}`);
  }

  async prune(envId: string): Promise<{ success: boolean; data: NetworkPruneReport }> {
    return this.client.request<{ success: boolean; data: NetworkPruneReport }>("POST", `/environments/${envId}/networks/prune`);
  }
}

class TemplatesMethods {
  constructor(private client: ArcaneClient) {}

  async list(opts?: ListOptions): Promise<PaginatedResponse<Template>> {
    const params = new URLSearchParams();
    if (opts?.search) params.set("search", opts.search);
    const query = params.toString();
    return this.client.request<PaginatedResponse<Template>>(`GET`, `/templates${query ? `?${query}` : ""}`);
  }

  async get(id: string): Promise<{ success: boolean; data: Template }> {
    return this.client.request<{ success: boolean; data: Template }>("GET", `/templates/${id}`);
  }

  async create(dto: TemplateCreate): Promise<{ success: boolean; data: Template }> {
    return this.client.request<{ success: boolean; data: Template }>("POST", "/templates", dto);
  }

  async update(id: string, dto: TemplateUpdate): Promise<{ success: boolean; data: Template }> {
    return this.client.request<{ success: boolean; data: Template }>("PUT", `/templates/${id}`, dto);
  }

  async delete(id: string): Promise<ActionResponse> {
    return this.client.request<ActionResponse>("DELETE", `/templates/${id}`);
  }
}

class SystemMethods {
  constructor(private client: ArcaneClient) {}

  async version(): Promise<{ success: boolean; data: { version: string } }> {
    return this.client.request<{ success: boolean; data: { version: string } }>("GET", "/version");
  }
}

export class ArcaneClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  readonly environments: EnvironmentsMethods;
  readonly stacks: StacksMethods;
  readonly containers: ContainersMethods;
  readonly images: ImagesMethods;
  readonly volumes: VolumesMethods;
  readonly networks: NetworksMethods;
  readonly templates: TemplatesMethods;
  readonly system: SystemMethods;

  constructor(host: string, apiKey: string) {
    this.baseUrl = host.replace(/\/+$/, "") + "/api";
    this.apiKey = apiKey;
    this.environments = new EnvironmentsMethods(this);
    this.stacks = new StacksMethods(this);
    this.containers = new ContainersMethods(this);
    this.images = new ImagesMethods(this);
    this.volumes = new VolumesMethods(this);
    this.networks = new NetworksMethods(this);
    this.templates = new TemplatesMethods(this);
    this.system = new SystemMethods(this);
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        "X-API-Key": this.apiKey,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      let message = response.statusText;
      try {
        const err = (await response.json()) as { detail?: string };
        if (err.detail) message = err.detail;
      } catch {}
      throw new ArcaneApiError(response.status, message);
    }

    return response.json() as Promise<T>;
  }
}
