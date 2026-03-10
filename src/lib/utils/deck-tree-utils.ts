import type { DeckTreeItemDto } from "@/lib/api/types"

/**
 * Возвращает только листовые колоды из дерева (узлы без детей).
 * Рекурсивно обходит дерево и собирает узлы с children.length === 0.
 */
export function getLeafDecksFromTree(
  tree: DeckTreeItemDto[]
): Array<{ id: string; title: string }> {
  const result: Array<{ id: string; title: string }> = []
  for (const node of tree) {
    if (!node.children || node.children.length === 0) {
      result.push({ id: node.id, title: node.title })
    } else {
      result.push(...getLeafDecksFromTree(node.children))
    }
  }
  return result
}
