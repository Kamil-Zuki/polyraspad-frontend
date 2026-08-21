import { expect, test } from "vitest"
import type { CardResponseDto } from "@/lib/api/types"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"
import { resolveCardViewModalCard } from "./card-view-modal-state"

function defaultNote(fieldValues: Record<string, { stringValue?: string | null }>) {
  return {
    id: "note-1",
    noteTypeId: "note-type-1",
    fieldValues,
  }
}

function createCard(overrides?: Partial<CardResponseDto>): CardResponseDto {
  return {
    id: "card-1",
    deckId: "deck-1",
    creatorId: "user-1",
    srsStatus: "New",
    createdAt: "2026-03-08T00:00:00Z",
    note: defaultNote({
      [SENTENCE_MINING.Expression]: { stringValue: "Sentence" },
      [SENTENCE_MINING.Word]: { stringValue: "word" },
      [SENTENCE_MINING.Translation]: { stringValue: "Translation" },
    }),
    ...overrides,
  }
}

test("should prefer fetched card when initial card has no image in note fields", () => {
  const initialCard = createCard({
    note: defaultNote({
      [SENTENCE_MINING.Expression]: { stringValue: "Only expression" },
    }),
  })
  const fetchedCard = createCard({
    note: defaultNote({
      [SENTENCE_MINING.Expression]: { stringValue: "Fetched" },
      [SENTENCE_MINING.Image]: { stringValue: "image-1" },
    }),
  })

  const result = resolveCardViewModalCard(fetchedCard, initialCard)

  expect(result?.note?.fieldValues[SENTENCE_MINING.Image]?.stringValue).toBe("image-1")
  expect(result?.note?.fieldValues[SENTENCE_MINING.Expression]?.stringValue).toBe("Fetched")
})

test("should fall back to initial card when fetched card is missing", () => {
  const initialCard = createCard({ id: "card-2" })

  const result = resolveCardViewModalCard(null, initialCard)

  expect(result?.id).toBe("card-2")
})

test("should return null when no card data is available", () => {
  const result = resolveCardViewModalCard(null, null)

  expect(result).toBeNull()
})
