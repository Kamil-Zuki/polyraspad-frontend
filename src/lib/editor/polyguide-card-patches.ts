import type { CardFieldPatch } from "@/lib/editor/card-field-patch"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"

export function buildExampleFieldPatch(
  sourceLang: string,
  targetLang: string,
  example: { sentence: string; translation: string },
): CardFieldPatch {
  const srcTag = sourceLang.toUpperCase().slice(0, 2)
  const tgtTag = targetLang.toUpperCase().slice(0, 2)
  return {
    [SENTENCE_MINING.Expression]: example.sentence,
    [SENTENCE_MINING.Translation]: example.translation,
    [SENTENCE_MINING.Example]: `${srcTag}: ${example.sentence}\n${tgtTag}: ${example.translation}`,
  }
}

export function appendNotesValue(existingNotes: string, addition: string): string {
  const trimmed = addition.trim()
  if (!trimmed) return existingNotes
  const current = existingNotes.trim()
  return current ? `${current}\n\n${trimmed}` : trimmed
}

export function buildPlaceholderImageUrl(word: string, query: string): string {
  const seed = encodeURIComponent(`${word.trim()}:${query.trim()}`.slice(0, 120))
  return `https://picsum.photos/seed/${seed}/880/495`
}
