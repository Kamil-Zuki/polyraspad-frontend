import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { GetLessonsResponse, GetLessonResponse, StartLessonResponse } from '@/lib/api/types';

export const lessonsKeys = {
  all: ['lessons'] as const,
  lists: () => [...lessonsKeys.all, 'list'] as const,
  list: (projectId: string) => [...lessonsKeys.lists(), projectId] as const,
  details: () => [...lessonsKeys.all, 'detail'] as const,
  detail: (projectId: string, lessonId: string) => [...lessonsKeys.details(), projectId, lessonId] as const,
};

export function useLessons(projectId: string | undefined) {
  return useQuery({
    queryKey: lessonsKeys.list(projectId ?? ''),
    queryFn: async (): Promise<GetLessonsResponse> => {
      return apiClient.lessons.getLessons(projectId!);
    },
    enabled: !!projectId,
  });
}

export function useLesson(projectId: string | undefined, lessonId: string | undefined) {
  return useQuery({
    queryKey: lessonsKeys.detail(projectId ?? '', lessonId ?? ''),
    queryFn: async (): Promise<GetLessonResponse> => {
      return apiClient.lessons.getLesson(projectId!, lessonId!);
    },
    enabled: !!projectId && !!lessonId,
  });
}

export function useStartLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, lessonId }: { projectId: string; lessonId: string }): Promise<StartLessonResponse> => {
      return apiClient.lessons.startLesson(projectId, lessonId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: lessonsKeys.detail(variables.projectId, variables.lessonId) });
      queryClient.invalidateQueries({ queryKey: lessonsKeys.list(variables.projectId) });
    },
  });
}

export function useCompleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, lessonId }: { projectId: string; lessonId: string }): Promise<void> => {
      return apiClient.lessons.completeLesson(projectId, lessonId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: lessonsKeys.detail(variables.projectId, variables.lessonId) });
      queryClient.invalidateQueries({ queryKey: lessonsKeys.list(variables.projectId) });
    },
  });
}

export function useRestartLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, lessonId }: { projectId: string; lessonId: string }): Promise<StartLessonResponse> => {
      return apiClient.lessons.restartLesson(projectId, lessonId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: lessonsKeys.detail(variables.projectId, variables.lessonId) });
      queryClient.invalidateQueries({ queryKey: lessonsKeys.list(variables.projectId) });
    },
  });
}
