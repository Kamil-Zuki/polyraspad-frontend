import { BaseApiClient } from "./base-api-client";
import { API_ENDPOINTS } from "../constants";
import {
  ProjectResponseDto,
  CreateProjectDto,
  UpdateProjectDto,
} from "./types";

export class ProjectClient extends BaseApiClient {
  async getProjects(includeArchived = false): Promise<ProjectResponseDto[]> {
    return this.request<ProjectResponseDto[]>(
      `${API_ENDPOINTS.PROJECTS.LIST}?includeArchived=${includeArchived}`
    );
  }

  async getProject(id: string): Promise<ProjectResponseDto> {
    return this.request<ProjectResponseDto>(API_ENDPOINTS.PROJECTS.DETAIL(id));
  }

  async createProject(data: CreateProjectDto): Promise<ProjectResponseDto> {
    return this.request<ProjectResponseDto>(API_ENDPOINTS.PROJECTS.CREATE, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: UpdateProjectDto): Promise<ProjectResponseDto> {
    return this.request<ProjectResponseDto>(API_ENDPOINTS.PROJECTS.UPDATE(id), {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
}