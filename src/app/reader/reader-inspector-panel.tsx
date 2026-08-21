"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { StudyLanguageSelectors } from "@/lib/languages/study-language-selectors"
import type { StudyLanguagePair } from "@/lib/languages/study-language-preferences"
import type { SearchTermDuplicatesResponseDto, TextTokenDto } from "@/lib/api/types"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"
import { sanitizeSourceUrl } from "@/app/reader/reader-utils"

export interface ReaderInspectorPanelProps {
  minedWord: {
    word: string
    termText?: string
    sentence: string
    termType: "WORD" | "PHRASE"
  } | null
  projectId: string
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
  advancedCardFields: ReactNode
  aiSection: ReactNode
  vocabularyHref?: string | null
  resolvedTokens?: TextTokenDto[]
}

export function ReaderInspectorPanel({
  minedWord,
  projectId,
  studyLangPair,
  onStudyLangPairChange,
  studyLangConflictMessage,
  translation,
  onTranslationChange,
  translationError,
  duplicateInfo,
  duplicatePending,
  termActionPending,
  termActionError,
  onSaveTerm,
  onKnownTerm,
  onIgnoreTerm,
  onGenerateAudio,
  isGeneratingAudio,
  audioError,
  onCreateCard,
  createCardPending,
  createCardDisabled,
  captureError,
  readerCaptureDeckId,
  onDeckChange,
  flatDecks,
  sourceUrl,
  onClear,
  advancedCardFields,
  aiSection,
  vocabularyHref,
  resolvedTokens,
}: ReaderInspectorPanelProps) {
  return (
    <section className="border-0 bg-transparent p-0 shadow-none">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        {vocabularyHref ? (
          <Link
            href={vocabularyHref}
            className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15"
          >
            Vocabulary
          </Link>
        ) : null}
        {minedWord ? (
          <button
            type="button"
            onClick={onClear}
            className="ml-auto rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <StudyLanguageSelectors
          idPrefix="reader-session"
          pair={studyLangPair}
          onChange={onStudyLangPairChange}
          showSameLangWarning={Boolean(studyLangConflictMessage)}
        />
      </div>

      {minedWord ? (
        <>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Context</p>
            <p className="mt-2 font-reader text-sm leading-6 text-gray-200">&ldquo;{minedWord.sentence}&rdquo;</p>
            <p className="mt-3 text-sm text-gray-400">
              {minedWord.termType === "PHRASE" ? "Phrase" : "Term"}:
              <strong className="ml-1 text-white">
                {duplicateInfo?.normalizedText?.trim() || minedWord.termText || minedWord.word}
              </strong>
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/75">Learning actions</p>
            <p className="mt-2 text-xs leading-5 text-emerald-100/70">
              Save term marks the word yellow in your vocabulary. Create card adds an SRS card to the deck below.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onSaveTerm}
                disabled={!projectId || termActionPending}
                title="Save term to vocabulary (yellow highlight). Does not create a card."
                className="rounded-xl border border-amber-400/50 bg-amber-500/20 px-4 py-2.5 text-sm font-semibold text-amber-50 hover:bg-amber-500/30 disabled:opacity-50"
              >
                Save term
              </button>
              <button type="button" onClick={onKnownTerm} disabled={!projectId || termActionPending} className="rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-emerald-500/25 disabled:opacity-50">
                Known
              </button>
              <button type="button" onClick={onIgnoreTerm} disabled={!projectId || termActionPending} className="rounded-xl border border-gray-500/40 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-100 hover:bg-white/10 disabled:opacity-50">
                Ignore
              </button>
              <button type="button" onClick={onCreateCard} disabled={createCardDisabled} className="rounded-xl border border-brand-primary/50 bg-brand-primary/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary/30 disabled:opacity-50">
                {createCardPending ? "Saving card…" : "Create card"}
              </button>
              <button type="button" onClick={onGenerateAudio} disabled={isGeneratingAudio} className="rounded-xl border border-brand-secondary/45 bg-brand-secondary/15 px-4 py-2.5 text-sm font-semibold text-brand-secondary hover:bg-brand-secondary/25 disabled:opacity-50">
                {isGeneratingAudio ? "Audio…" : "Audio"}
              </button>
            </div>
            {audioError ? <p className="mt-2 text-xs text-rose-300">{audioError}</p> : null}
            {termActionError ? (
              <p className="mt-2 text-xs text-rose-400">
                {termActionError instanceof Error ? termActionError.message : "Term update failed."}
              </p>
            ) : null}
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-gray-300">Meaning (optional for Save term)</label>
            <input
              type="text"
              value={translation}
              onChange={(e) => onTranslationChange(e.target.value)}
              placeholder="Add your meaning"
              className="w-full rounded-2xl border border-white/10 bg-[#0c1017] px-4 py-3 text-white placeholder-gray-500 focus:border-brand-primary focus:outline-none"
            />
            {translationError ? (
              <p className="mt-2 text-xs text-amber-300">Auto-translation failed. You can still type a meaning.</p>
            ) : null}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Related cards</p>
              {duplicatePending ? (
                <span className="text-xs text-gray-500">
                  <i className="fas fa-spinner fa-spin mr-1.5" />
                  Checking
                </span>
              ) : null}
            </div>
            {duplicateInfo?.isDuplicate ? (
              <p className="mt-3 text-sm font-medium text-amber-300">
                {duplicateInfo.existingCards.length} card(s) use this term.
              </p>
            ) : duplicateInfo ? (
              <p className="mt-3 text-sm text-emerald-300">No matching cards yet.</p>
            ) : (
              <p className="mt-3 text-sm text-gray-500">Duplicate check unavailable.</p>
            )}
          </div>

          <details className="group mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.05] px-4 py-3 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-cyan-100">
              <span>AI drafting & lookups</span>
              <span className="text-xs text-cyan-200/70 group-open:hidden">Expand</span>
            </summary>
            <div className="mt-3 border-t border-white/10 pt-3">{aiSection}</div>
          </details>

          <details className="group mt-3 rounded-2xl border border-white/10 bg-[#111722]/95 px-4 py-3 [&_summary::-webkit-details-marker]:hidden">
            <summary className="cursor-pointer text-sm font-medium text-gray-300">
              Extra card fields ({SENTENCE_MINING.Expression}, …)
            </summary>
            <div className="mt-4">{advancedCardFields}</div>
          </details>

          {flatDecks.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-[#0c1017]/50 px-4 py-3">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-gray-500">Card deck</label>
              <select
                aria-label="Save card deck"
                value={readerCaptureDeckId}
                onChange={(e) => onDeckChange(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0c1017] px-3 py-2 text-sm text-white"
              >
                {flatDecks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {"— ".repeat(d.depth)}
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {(() => {
            const cleanUrl = sanitizeSourceUrl(sourceUrl)
            return cleanUrl ? <p className="mt-3 truncate text-xs text-gray-500">Source: {cleanUrl}</p> : null
          })()}

          {captureError ? (
            <p className="mt-3 text-sm text-rose-400">
              {captureError instanceof Error ? captureError.message : "Failed to create card."}
            </p>
          ) : null}

          <p className="mt-4 text-[11px] leading-5 text-gray-500">
            <kbd className="rounded border border-white/15 px-1">Shift</kbd>+click two words to select a phrase. Save term is separate from Create card.
          </p>
        </>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm leading-6 text-gray-400">
              Click a word or <span className="text-cyan-400">Shift+click</span> start and end words for a phrase.
            </p>
          </div>
          
          {resolvedTokens && resolvedTokens.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-3">Page Summary</p>
              
              <div className="flex gap-4 mb-4">
                <div className="flex-1 rounded-xl bg-black/20 p-3 text-center">
                  <p className="text-xl font-bold text-white">
                    {resolvedTokens.filter(t => t.type === 'WORD').length}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Words</p>
                </div>
                <div className="flex-1 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                  <p className="text-xl font-bold text-amber-400">
                    {new Set(resolvedTokens.filter(t => t.status === 'LEARNING' || t.status === 'NEW').map(t => t.termText || t.text.toLowerCase())).size}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-amber-500/70 mt-1">Learning</p>
                </div>
              </div>

              {resolvedTokens.some(t => t.status === 'LEARNING' || t.status === 'NEW') ? (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Terms on this page:</p>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {Array.from(new Set(
                      resolvedTokens
                        .filter(t => t.status === 'LEARNING' || t.status === 'NEW')
                        .map(t => t.termText || t.text.toLowerCase())
                    )).map(term => (
                      <span key={term} className="rounded-md bg-amber-500/20 border border-amber-500/30 px-2 py-1 text-xs text-amber-100">
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center italic py-2">No active terms on this page</p>
              )}
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}
