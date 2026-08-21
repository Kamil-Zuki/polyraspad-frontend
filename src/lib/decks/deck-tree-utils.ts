import type { DeckTreeItemDto } from "@/lib/api/types"

/**
 * Depth-first search for a deck whose title matches (case-insensitive, trimmed).
 * Used to resolve the system Inbox deck from GET /api/Decks/tree/{projectId}.
 */
export function findDeckIdByTitleInTree(
  items: DeckTreeItemDto[] | undefined | null,
  title: string
): string | null {
  if (!items?.length) return null;
  const want = title.trim().toLowerCase();
  for (const item of items) {
    if (item.title.trim().toLowerCase() === want) {
      return item.id;
    }
    const nested = findDeckIdByTitleInTree(item.children, title);
    if (nested) return nested;
  }
  return null;
}

export interface FlatDeckPickerOption {
  id: string;
  title: string;
  depth: number;
}

/** Depth-first flatten for deck `<select>` pickers (preserves tree order). */
export function flattenDeckTree(
  items: DeckTreeItemDto[] | undefined | null,
  depth = 0
): FlatDeckPickerOption[] {
  if (!items?.length) return [];
  const out: FlatDeckPickerOption[] = [];
  for (const item of items) {
    out.push({ id: item.id, title: item.title, depth });
    out.push(...flattenDeckTree(item.children, depth + 1));
  }
  return out;
}
