import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/index";
import { automationQueryKeys, cardQueryKeys } from "./constants";
import type { CreateAutomationJobDto } from "../api/types";

export function useAutomationJob(jobId: string | undefined, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: automationQueryKeys.job(jobId ?? ""),
    queryFn: () => apiClient.automation.getJob(jobId!),
    enabled: !!jobId,
    refetchInterval: options?.refetchInterval ?? ((query) => {
      const data = query.state.data;
      if (!data) return 1000;
      if (data.status === "QUEUED") return 1000;
      if (data.status === "RUNNING") return 1000;
      return false;
    }),
  });
}

export function useCreateAutomationJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAutomationJobDto) => apiClient.automation.createJob(data),
    onSuccess: (job) => {
      queryClient.setQueryData(automationQueryKeys.job(job.id), job);
    },
  });
}

export function useRetryAutomationJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => apiClient.automation.retryJob(jobId),
    onSuccess: (job) => {
      queryClient.setQueryData(automationQueryKeys.job(job.id), job);
      queryClient.invalidateQueries({ queryKey: cardQueryKeys.cards });
    },
  });
}

export function useResumeAutomationJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => apiClient.automation.resumeJob(jobId),
    onSuccess: (job) => {
      queryClient.setQueryData(automationQueryKeys.job(job.id), job);
    },
  });
}
