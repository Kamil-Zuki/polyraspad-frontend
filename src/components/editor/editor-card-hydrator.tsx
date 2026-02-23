"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useCard } from "@/lib/react-query/queries"
import { useEditorCard } from "@/contexts/editor-card-context"

/**
 * When editor is opened with ?cardId=..., loads the card and fills editor context
 * so the form and Preview show existing card data (including media URLs when API returns them).
 */
export function EditorCardHydrator() {
  const searchParams = useSearchParams()
  const cardId = searchParams.get("cardId") ?? ""
  const { data: card, isSuccess } = useCard(cardId)
  const setCardState = useEditorCard().setCardState
  const hydratedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!cardId || !isSuccess || !card) return
    if (hydratedRef.current === cardId) return
    hydratedRef.current = cardId
    setCardState({
      sentence: card.sentence ?? "",
      targetWord: card.targetWord ?? "",
      translation: card.translation ?? "",
      imageUrl: card.media?.imageUrl ?? "",
      imageId: card.media?.imageId ?? "",
      audioUrl: card.media?.audioUrl ?? "",
    })
  }, [cardId, isSuccess, card, setCardState])

  return null
}
