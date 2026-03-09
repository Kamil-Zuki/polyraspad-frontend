import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/index";
import { deckQueryKeys } from "./constants";
import type {
  DeckTreeItemDto,
  DeckResponseDto,
  CreateDeckDto,
  UpdateDeckDto,
} from "../api/types";
import type { LibraryFilter } from "../api/deck-client";

const toApiFilter = (v: string | undefined): LibraryFilter | undefined => {
  if (!v) return undefined;
  const lower = v.toLowerCase();
  if (lower === "mine") return "Mine";
  if (lower === "downloaded") return "Downloaded";
  if (lower === "public") return "Public";
  return undefined;
};

// Deck queries
export function useDeckTree(projectId: string, libraryFilter?: LibraryFilter | string) {
  const apiFilter = toApiFilter(libraryFilter);
  return useQuery({
    queryKey: deckQueryKeys.deckTree(projectId, apiFilter ?? undefined),
    queryFn: () =>
      apiClient.decks.getDeckTree(projectId, apiFilter ? { libraryFilter: apiFilter } : undefined),
    enabled: !!projectId,
  });
}

export function useCreateDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDeckDto) => apiClient.decks.createDeck(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["decks", "tree", variables.projectId] });
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