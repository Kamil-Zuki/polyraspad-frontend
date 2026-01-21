import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../api/client"
import type {
  ProjectResponseDto,
  CreateProjectDto,
  UserInfoDto,
} from "../api/types"

// Query keys
export const queryKeys = {
  projects: ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
  userInfo: ["userInfo"] as const,
}

// Projects queries
export function useProjects(includeArchived = false) {
  return useQuery({
    queryKey: [...queryKeys.projects, includeArchived],
    queryFn: () => apiClient.getProjects(includeArchived),
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => apiClient.getProject(id),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProjectDto) => apiClient.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
  })
}

// User queries
export function useUserInfo() {
  return useQuery({
    queryKey: queryKeys.userInfo,
    queryFn: () => apiClient.getUserInfo(),
    retry: false,
  })
}
