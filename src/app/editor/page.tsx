"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { EditorHeader } from "@/components/editor/editor-header"
import { EditorForm } from "@/components/editor/editor-form"
import { CardPreview } from "@/components/editor/card-preview"
import { EditorCardHydrator } from "@/components/editor/editor-card-hydrator"
import { AiAssistant } from "@/components/editor/ai-assistant"
import { AgentEditorDraftHydrator } from "@/components/editor/agent-editor-draft-hydrator"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { EditorCardProvider } from "@/contexts/editor-card-context"
import { EditorLanguageProvider } from "@/contexts/editor-language-context"
import { useProjectContext } from "@/contexts/project-context"
import { useDeckTree, useCard } from "@/lib/react-query/queries"

function findFirstDeckId(tree: { id: string; children?: unknown[] }[]): string | null {
  for (const node of tree) {
    if (!node.children?.length) return node.id
    const found = findFirstDeckId(node.children as { id: string; children?: unknown[] }[])
    if (found) return found
  }
  return null
}

export default function EditorPage() {
  const searchParams = useSearchParams()
  const editingCardId = searchParams.get("cardId")?.trim() ?? ""
  const isEditMode = editingCardId.length > 0
  const { data: cardForDeckSync } = useCard(editingCardId)

  const [selectedDeckId, setSelectedDeckId] = useState("")
  const { currentProject } = useProjectContext()
  const { data: deckTree } = useDeckTree(currentProject?.id ?? "")

  // При открытии /editor?cardId=… подставляем колоду карточки (перенос колоды через API не поддержан)
  useEffect(() => {
    if (cardForDeckSync?.deckId) setSelectedDeckId(cardForDeckSync.deckId)
  }, [cardForDeckSync?.deckId])

  useEffect(() => {
    if (isEditMode || selectedDeckId || !deckTree?.length) return
    const first = findFirstDeckId(deckTree)
    if (first) setSelectedDeckId(first)
  }, [deckTree, selectedDeckId, isEditMode])

  return (
    <ProtectedRoute>
      <EditorCardProvider>
        <EditorLanguageProvider>
        {process.env.NEXT_PUBLIC_FF_AI_AGENTS === "true" && <AgentEditorDraftHydrator />}
        <EditorCardHydrator />
        <div className="flex flex-col h-screen overflow-hidden bg-app-bg">
          <EditorHeader
            selectedDeckId={selectedDeckId}
            onSelectedDeckIdChange={setSelectedDeckId}
            isEditMode={isEditMode}
            deckSelectDisabled={isEditMode}
          />
          <div className="flex-1 flex overflow-hidden">
            {/* Desktop: PolyGuide sidebar */}
            {process.env.NEXT_PUBLIC_FF_AI_AGENTS === "true" && (
              <aside className="hidden md:flex flex-col overflow-hidden border-r border-app-border bg-app-surface/80 shrink-0 w-[280px]">
                <div className="w-[280px] flex flex-col h-full overflow-hidden min-w-0">
                  <AiAssistant mode="sidebar" />
                </div>
              </aside>
            )}

            {/* Main Area: form + optional preview (split on desktop, stack on mobile) */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-w-0">
              <div className="flex-1 overflow-y-auto relative custom-scroll min-w-0 flex flex-col">
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <EditorForm
            selectedDeckId={selectedDeckId}
            onSelectedDeckIdChange={setSelectedDeckId}
          />
                  {/* Mobile: preview below form */}
                  <div className="md:hidden px-6 pb-8">
                    <div className="mt-8 pt-6 border-t border-app-border">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                        Card Preview
                      </div>
                      <div className="max-w-sm mx-auto">
                        <CardPreview />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop: preview panel on the right */}
              <aside className="hidden md:flex flex-col overflow-hidden border-l border-app-border bg-app-surface/80 shrink-0 w-[320px]">
                <div className="w-[320px] flex flex-col h-full p-4 overflow-hidden min-w-0">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span>Card Preview</span>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto custom-scroll">
                    <CardPreview />
                  </div>
                </div>
              </aside>
            </div>
          </div>

          {/* Mobile: floating PolyGuide */}
          {process.env.NEXT_PUBLIC_FF_AI_AGENTS === "true" && (
            <div className="md:hidden">
              <AiAssistant mode="floating" />
            </div>
          )}
        </div>
        </EditorLanguageProvider>
      </EditorCardProvider>
    </ProtectedRoute>
  )
}
