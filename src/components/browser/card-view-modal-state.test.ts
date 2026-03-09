import { expect, test } from "vitest"
import type { CardResponseDto } from "@/lib/api/types"
import { resolveCardViewModalCard } from "./card-view-modal-state"

function createCard(overrides?: Partial<CardResponseDto>): CardResponseDto {
  return {
    id: "card-1",
    deckId: "deck-1",
    creatorId: "user-1",
    sentence: "Sentence",
    translation: "Translation",
    targetWord: "word",
    targetIndex: null,
    sourceMeta: null,
    media: null,
    lemmaId: null,
    srsStatus: "New",
    createdAt: "2026-03-08T00:00:00Z",
    ...overrides,
  }
}

test("should prefer fetched card when initial card has no media", () => {
  const initialCard = createCard({ media: null })
  const fetchedCard = createCard({
    media: {
      imageId: "image-1",
      imageUrl: "http://localhost:5206/api/Media/serve-image?id=image-1",
      audioId: null,
      audioUrl: null,
    },
  })

  const result = resolveCardViewModalCard(fetchedCard, initialCard)

  expect(result?.media?.imageId).toBe("image-1")
  expect(result?.media?.imageUrl).toBe(
    "http://localhost:5206/api/Media/serve-image?id=image-1",
  )
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
