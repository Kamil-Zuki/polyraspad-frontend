import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export const useAutopilotPlan = (projectId: string | null) => {
  return useQuery({
    queryKey: ['autopilot-plan', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      return apiClient.autopilot.getDailyPlan(projectId);
    },
    enabled: !!projectId,
    staleTime: 30 * 1000,       // 30 seconds — refresh quickly after activity
    refetchInterval: 60 * 1000, // poll every 60 seconds in background
  });
};
