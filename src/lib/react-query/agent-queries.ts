import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/index";
import { agentQueryKeys } from "./constants";
import type {
  AgentMessageListDto,
  AgentThreadListItemDto,
  CreateAgentRunRequestDto,
  CreateAgentRunResponseDto,
  CreateAgentThreadRequestDto,
  ExecuteAgentRunRequestDto,
  AgentThreadDto,
} from "../api/types";

export function useAgentThreads(
  projectId: string,
  options?: { enabled?: boolean; agentId?: string },
) {
  return useQuery({
    queryKey: agentQueryKeys.threads(projectId, options?.agentId),
    queryFn: () => apiClient.agent.listThreads(projectId, options?.agentId),
    enabled: !!projectId && options?.enabled !== false,
  });
}

export function useAgentMessages(
  threadId: string | null | undefined,
  options?: { enabled?: boolean; limit?: number },
) {
  return useQuery({
    queryKey: agentQueryKeys.messages(threadId ?? ""),
    queryFn: () => apiClient.agent.listMessages(threadId!, options?.limit ?? 100),
    enabled: !!threadId && options?.enabled !== false,
  });
}

export function useCreateAgentThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateAgentThreadRequestDto) =>
      apiClient.agent.createThread(request),
    onSuccess: (thread: AgentThreadDto) => {
      queryClient.invalidateQueries({ queryKey: agentQueryKeys.threadsBase(thread.projectId) });
    },
  });
}

export function useCreateAgentRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      threadId,
      request,
    }: {
      threadId: string;
      request: ExecuteAgentRunRequestDto;
    }) => apiClient.agent.createRun(threadId, request),
    onSuccess: (_response: CreateAgentRunResponseDto, variables) => {
      queryClient.invalidateQueries({
        queryKey: agentQueryKeys.threadsBase(variables.request.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: agentQueryKeys.messages(variables.threadId),
      });
    },
  });
}

export function usePersistAgentRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      threadId,
      request,
    }: {
      threadId: string;
      request: CreateAgentRunRequestDto;
    }) => apiClient.agent.persistRun(threadId, request),
    onSuccess: (_response: CreateAgentRunResponseDto, variables) => {
      queryClient.invalidateQueries({
        queryKey: agentQueryKeys.threadsBase(variables.request.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: agentQueryKeys.messages(variables.threadId),
      });
    },
  });
}

export function useArchiveAgentThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      threadId,
      projectId,
    }: {
      threadId: string;
      projectId: string;
    }) => apiClient.agent.archiveThread(threadId).then(() => projectId),
    onSuccess: (projectId: string) => {
      queryClient.invalidateQueries({ queryKey: agentQueryKeys.threadsBase(projectId) });
    },
  });
}

export type { AgentThreadListItemDto, AgentMessageListDto };
