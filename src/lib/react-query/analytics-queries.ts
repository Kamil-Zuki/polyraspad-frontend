import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/index";
import { analyticsQueryKeys } from "./constants";
import type {
  VocabularyStatsDto,
  HeatmapDto,
  DailySummaryDto,
} from "../api/types";

// Analytics queries
export function useVocabularyStats(projectId: string) {
  return useQuery({
    queryKey: analyticsQueryKeys.vocabularyStats(projectId),
    queryFn: () => apiClient.analytics.getVocabularyStats(projectId),
    enabled: !!projectId,
  });
}

export function useHeatmap(projectId?: string, year?: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: analyticsQueryKeys.heatmap(projectId, year),
    queryFn: () => apiClient.analytics.getHeatmap(projectId, year),
    enabled: options?.enabled !== false,
  });
}

export function useDailySummary(projectId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: analyticsQueryKeys.dailySummary(projectId),
    queryFn: () => apiClient.analytics.getDailySummary(projectId),
    enabled: options?.enabled !== false,
  });
}