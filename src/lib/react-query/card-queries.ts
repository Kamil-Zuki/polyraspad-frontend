import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/index";
import { cardQueryKeys } from "./constants";
import type {
  CardResponseDto,
  CreateCardDto,
  CaptureCardDto,
  UpdateCardDto,
  BulkCreateCardsDto,
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
  return useQuery({
    queryKey: cardQueryKeys.searchCards(query, options),
    queryFn: () => apiClient.cards.searchCards(query, options),
    enabled: enabled && !!query,
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