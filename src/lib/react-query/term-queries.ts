import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { apiClient } from "../api/index";

export const termListQueryKeys = {
  list: (projectId: string, status: string, type: string, q: string, pageNumber: number) =>
    ["terms", "list", projectId, status, type, q, pageNumber] as const,
};

export function useProjectTerms(params: {
  projectId: string | undefined;
  status: string;
  type: string;
  q: string;
  pageNumber: number;
  pageSize?: number;
}) {
  const { projectId, status, type, q, pageNumber, pageSize } = params;

  return useQuery({
    queryKey: termListQueryKeys.list(projectId ?? "", status, type, q, pageNumber),
    enabled: !!projectId,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      return apiClient.terms.listProjectTerms({
        projectId: projectId!,
        status: status || undefined,
        type: type || undefined,
        q: q || undefined,
        pageNumber,
        pageSize: pageSize ?? 50,
      });
    },
  });
}
