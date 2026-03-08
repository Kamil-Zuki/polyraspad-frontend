import test from "node:test"
import assert from "node:assert/strict"

import type { CardResponseDto } from "@/lib/api/types"
import { resolveCardViewModalCard } from "./card-view-modal-state.ts"

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

test("should_prefer_fetched_card_when_initial_card_has_no_media", () => {
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

  assert.equal(result?.media?.imageId, "image-1")
  assert.equal(result?.media?.imageUrl, "http://localhost:5206/api/Media/serve-image?id=image-1")
})

test("should_fall_back_to_initial_card_when_fetched_card_is_missing", () => {
  const initialCard = createCard({ id: "card-2" })

  const result = resolveCardViewModalCard(null, initialCard)

  assert.equal(result?.id, "card-2")
})

test("should_return_null_when_no_card_data_is_available", () => {
  const result = resolveCardViewModalCard(null, null)

  assert.equal(result, null)
})
