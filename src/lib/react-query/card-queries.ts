import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/index";
import { cardQueryKeys } from "./constants";
import type {
  CardResponseDto,
  CreateCardDto,
  CaptureCardDto,
  UpdateCardDto,
  BulkCreateCardsDto,
  BulkDeleteCardsDto,
  MoveCardsDto,
  ResetCardProgressDto,
  SearchCardsResponseDto,
} from "../api/types";

// Card queries and mutations
export function useCard(id: string) {
  return useQuery({
    queryKey: cardQueryKeys.card(id),
    queryFn: () => apiClient.cards.getCard(id),
    enabled: !!id,
  });
}

export function useNoteTypeForEditor(projectId: string | undefined) {
  return useQuery({
    queryKey: cardQueryKeys.noteTypeEditor(projectId ?? ""),
    queryFn: () => apiClient.cards.getNoteTypeForEditor(projectId!),
    enabled: !!projectId,
  });
}

export function useCardsByDeck(deckId: string) {
  return useQuery({
    queryKey: [...cardQueryKeys.cards, "by-deck", deckId],
    queryFn: () => apiClient.cards.searchCards("", { deckId }),
    enabled: !!deckId,
  });
}

export function useSearchCards(
  query: string,
  options?: {
    projectId?: string
    deckId?: string
    srsStatuses?: string[]
    pageNumber?: number
    pageSize?: number
  },
  enabled = true
) {
  const hasQuery = query.trim().length >= 2;
  const hasDeck = !!(options?.deckId);
  const hasProject = !!(options?.projectId);
  const hasSrs = (options?.srsStatuses?.length ?? 0) > 0;
  // No projectId = browse all of the user's cards (matches API: project filter omitted).
  const allProjects = !options?.projectId;
  const shouldFetch = enabled && (hasQuery || hasDeck || hasProject || hasSrs || allProjects);
  return useQuery({
    queryKey: cardQueryKeys.searchCards(query.trim() || "", options),
    queryFn: () => apiClient.cards.searchCards(query.trim() || "", options),
    enabled: shouldFetch,
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCardDto) => apiClient.cards.createCard(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: cardQueryKeys.cards });
      // Invalidate deck tree to update card counts
      queryClient.invalidateQueries({ queryKey: ["decks", "tree"] });
    },
  });
}

export function useCaptureCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CaptureCardDto) => apiClient.cards.captureCard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardQueryKeys.cards });
      queryClient.invalidateQueries({ queryKey: ["decks", "tree"] });
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCardDto }) =>
      apiClient.cards.updateCard(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: cardQueryKeys.card(variables.id) });
      queryClient.invalidateQueries({ queryKey: cardQueryKeys.cards });
      queryClient.invalidateQueries({ queryKey: ["decks", "tree"] });
    },
  });
}

export function useBulkCreateCards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkCreateCardsDto) => apiClient.cards.bulkCreateCards(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardQueryKeys.cards });
      queryClient.invalidateQueries({ queryKey: ["decks", "tree"] });
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.cards.deleteCard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardQueryKeys.cards });
      queryClient.invalidateQueries({ queryKey: ["decks", "tree"] });
    },
  });
}

export function useBulkDeleteCards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkDeleteCardsDto) => apiClient.cards.bulkDeleteCards(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardQueryKeys.cards });
      queryClient.invalidateQueries({ queryKey: ["decks", "tree"] });
    },
  });
}

export function useMoveCards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MoveCardsDto) => apiClient.cards.moveCards(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardQueryKeys.cards });
      queryClient.invalidateQueries({ queryKey: ["decks", "tree"] });
    },
  });
}

export function useResetCardProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ResetCardProgressDto) => apiClient.cards.resetCardProgress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardQueryKeys.cards });
      queryClient.invalidateQueries({ queryKey: ["decks", "tree"] });
    },
  });
}

export function useLeechCards(
  projectId: string | undefined,
  options?: { threshold?: number; pageNumber?: number; pageSize?: number },
  enabled = true
) {
  return useQuery({
    queryKey: [...cardQueryKeys.cards, "leeches", projectId, options],
    queryFn: () => apiClient.cards.getLeechCards(projectId!, options),
    enabled: enabled && !!projectId,
  });
}

export function useCardsMissingMedia(
  projectId: string | undefined,
  options?: { mediaType?: string; pageNumber?: number; pageSize?: number },
  enabled = true
) {
  return useQuery({
    queryKey: [...cardQueryKeys.cards, "missing-media", projectId, options],
    queryFn: () => apiClient.cards.getCardsMissingMedia(projectId!, options),
    enabled: enabled && !!projectId,
  });
}
