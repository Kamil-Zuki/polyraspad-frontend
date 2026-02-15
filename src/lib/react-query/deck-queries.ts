import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/index";
import { deckQueryKeys } from "./constants";
import type {
  DeckTreeItemDto,
  DeckResponseDto,
  CreateDeckDto,
  UpdateDeckDto,
} from "../api/types";

// Deck queries
export function useDeckTree(projectId: string) {
  return useQuery({
    queryKey: deckQueryKeys.deckTree(projectId),
    queryFn: () => apiClient.decks.getDeckTree(projectId),
    enabled: !!projectId,
  });
}

export function useCreateDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDeckDto) => apiClient.decks.createDeck(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: deckQueryKeys.deckTree(variables.projectId) });
    },
  });
}

export function useUpdateDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDeckDto }) =>
      apiClient.decks.updateDeck(id, data),
    onSuccess: () => {
      // Invalidate all deck trees to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["decks", "tree"] });
    },
  });
}

export function useDeck(id: string) {
  return useQuery({
    queryKey: deckQueryKeys.deck(id),
    queryFn: () => apiClient.decks.getDeck(id),
    enabled: !!id,
  });
}

export function useDeleteDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.decks.deleteDeck(id),
    onSuccess: () => {
      // Invalidate all deck trees to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["decks", "tree"] });
    },
  });
}