"use client"

import { useEffect } from "react"
import { useEditorCard } from "@/contexts/editor-card-context"
import { consumeAgentEditorDraft } from "@/lib/agent/agent-editor-draft"

/** Applies dashboard agent card drafts when opening /editor. */
export function AgentEditorDraftHydrator() {
  const { mergeFieldValues } = useEditorCard()

  useEffect(() => {
    const draft = consumeAgentEditorDraft()
    if (draft) mergeFieldValues(draft)
  }, [mergeFieldValues])

  return null
}
