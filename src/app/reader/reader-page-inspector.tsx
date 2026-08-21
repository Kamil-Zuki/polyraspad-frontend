"use client"

import type { ReactNode } from "react"
import { ReaderInspectorPanel } from "@/app/reader/reader-inspector-panel"
import type { StudyLanguagePair } from "@/lib/languages/study-language-preferences"
import type { SearchTermDuplicatesResponseDto, TextTokenDto } from "@/lib/api/types"
import { cn } from "@/lib/utils"

export interface ReaderPageInspectorProps {
  isCollapsed: boolean
  onToggleCollapsed: () => void
  resolvedTokens?: TextTokenDto[]
  minedWord: {
    word: string
    termText?: string
    sentence: string
    termType: "WORD" | "PHRASE"
  } | null
  projectId: string
  vocabularyHref: string | null
  studyLangPair: StudyLanguagePair
  onStudyLangPairChange: (pair: StudyLanguagePair) => void
  studyLangConflictMessage: string | null
  translation: string
  onTranslationChange: (value: string) => void
  translationError: string | null
  duplicateInfo: SearchTermDuplicatesResponseDto | null
  duplicatePending: boolean
  termActionPending: boolean
  termActionError: Error | null
  onSaveTerm: () => void
  onKnownTerm: () => void
  onIgnoreTerm: () => void
  onGenerateAudio: () => void
  isGeneratingAudio: boolean
  audioError: string | null
  onCreateCard: () => void
  createCardPending: boolean
  createCardDisabled: boolean
  captureError: Error | null
  readerCaptureDeckId: string
  onDeckChange: (deckId: string) => void
  flatDecks: { id: string; title: string; depth: number }[]
  sourceUrl?: string
  onClear: () => void
  aiSection: ReactNode
  advancedCardFields: ReactNode
}

export function ReaderPageInspector({
  isCollapsed,
  onToggleCollapsed,
  ...panel
}: ReaderPageInspectorProps) {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15"
          aria-label={isCollapsed ? "Expand inspector" : "Collapse inspector"}
        >
          <span aria-hidden="true">{isCollapsed ? "+" : "-"}</span>
          {isCollapsed ? "Expand" : "Collapse"}
        </button>
      </div>
      {!isCollapsed ? (
        <ReaderInspectorPanel {...panel} />
      ) : (
        <p className={cn("text-xs text-gray-500", panel.minedWord ? "mt-2" : "mt-4")}>
          Inspector collapsed — expand to save terms or create cards.
        </p>
      )}
    </>
  )
}
