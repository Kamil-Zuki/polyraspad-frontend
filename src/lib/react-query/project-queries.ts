import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/index";
import { projectQueryKeys } from "./constants";
import type {
  ProjectResponseDto,
  CreateProjectDto,
  UpdateProjectDto,
} from "../api/types";

// Projects queries
export function useProjects(includeArchived = false) {
  return useQuery({
    queryKey: [...projectQueryKeys.projects, includeArchived],
    queryFn: () => apiClient.projects.getProjects(includeArchived),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectQueryKeys.project(id),
    queryFn: () => apiClient.projects.getProject(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectDto) => apiClient.projects.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.projects });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectDto }) =>
      apiClient.projects.updateProject(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.project(variables.id) });
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.projects });
    },
  });
}