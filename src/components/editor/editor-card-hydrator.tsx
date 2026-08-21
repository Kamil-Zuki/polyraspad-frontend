"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useCard } from "@/lib/react-query/queries"
import { useEditorCard } from "@/contexts/editor-card-context"
import { notePayloadToFieldStrings } from "@/lib/editor/note-field-api"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"

/**
 * When editor is opened with ?cardId=..., loads the card and fills editor context
 * so the form and Preview show existing note field data.
 */
export function EditorCardHydrator() {
  const searchParams = useSearchParams()
  const cardId = searchParams.get("cardId") ?? ""
  const { data: card, isSuccess } = useCard(cardId)
  const { setCardState, mergeFieldValues, setActiveCardTemplate } = useEditorCard()
  const hydratedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!cardId || !isSuccess || !card) return
    if (hydratedRef.current === cardId) return
    hydratedRef.current = cardId

    const fromNote = notePayloadToFieldStrings(card.note)
    mergeFieldValues(fromNote)

    const rawImage = (fromNote[SENTENCE_MINING.Image] ?? "").trim()
    const isUuid = /^[0-9a-f-]{36}$/i.test(rawImage)

    setCardState({
      synonymsText: fromNote[SENTENCE_MINING.Synonyms] ?? "",
      imageId: isUuid ? rawImage : "",
    })

    setActiveCardTemplate(card.activeCardTemplate ?? null)
  }, [cardId, isSuccess, card, setCardState, mergeFieldValues, setActiveCardTemplate])

  return null
}
