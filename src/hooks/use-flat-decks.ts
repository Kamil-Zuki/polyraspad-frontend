import { useMemo } from "react";
import { useDeckTree } from "@/lib/react-query/deck-queries";
import { flattenDeckTree } from "@/lib/decks/deck-tree-utils";

export function useFlatDecks(projectId: string) {
  const { data: deckTree = [], isLoading } = useDeckTree(projectId);
  const flatDecks = useMemo(() => flattenDeckTree(deckTree), [deckTree]);
  return { decks: flatDecks, isLoading };
}
