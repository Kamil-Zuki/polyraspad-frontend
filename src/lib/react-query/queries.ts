import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../api/client"
import type {
  ProjectResponseDto,
  CreateProjectDto,
  UpdateProjectDto,
  UserInfoDto,
  DeckTreeItemDto,
  CreateDeckDto,
  UpdateDeckDto,
  UserSettingsResponseDto,
  UpdateUserSettingsDto,
  VocabularyStatsDto,
  HeatmapDto,
  DailySummaryDto,
} from "../api/types"

// Query keys
export const queryKeys = {
  projects: ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
  userInfo: ["userInfo"] as const,
  deckTree: (projectId: string) => ["decks", "tree", projectId] as const,
  userSettings: ["userSettings"] as const,
  vocabularyStats: (projectId: string) => ["analytics", "vocabulary", projectId] as const,
  heatmap: (projectId?: string, year?: number) => ["analytics", "heatmap", projectId, year] as const,
  dailySummary: (projectId?: string) => ["analytics", "daily", projectId] as const,
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

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectDto }) =>
      apiClient.updateProject(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.project(variables.id) })
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

// Deck queries
export function useDeckTree(projectId: string) {
  return useQuery({
    queryKey: queryKeys.deckTree(projectId),
    queryFn: () => apiClient.getDeckTree(projectId),
    enabled: !!projectId,
  })
}

export function useCreateDeck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateDeckDto) => apiClient.createDeck(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deckTree(variables.projectId) })
    },
  })
}

export function useUpdateDeck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDeckDto }) =>
      apiClient.updateDeck(id, data),
    onSuccess: () => {
      // Invalidate all deck trees to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["decks", "tree"] })
    },
  })
}

export function useDeleteDeck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteDeck(id),
    onSuccess: () => {
      // Invalidate all deck trees to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["decks", "tree"] })
    },
  })
}

// User Settings queries
export function useUserSettings() {
  return useQuery({
    queryKey: queryKeys.userSettings,
    queryFn: () => apiClient.getUserSettings(),
  })
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateUserSettingsDto) => apiClient.updateUserSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userSettings })
    },
  })
}

// Analytics queries
export function useVocabularyStats(projectId: string) {
  return useQuery({
    queryKey: queryKeys.vocabularyStats(projectId),
    queryFn: () => apiClient.getVocabularyStats(projectId),
    enabled: !!projectId,
  })
}

export function useHeatmap(projectId?: string, year?: number) {
  return useQuery({
    queryKey: queryKeys.heatmap(projectId, year),
    queryFn: () => apiClient.getHeatmap(projectId, year),
  })
}

export function useDailySummary(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.dailySummary(projectId),
    queryFn: () => apiClient.getDailySummary(projectId),
  })
}
