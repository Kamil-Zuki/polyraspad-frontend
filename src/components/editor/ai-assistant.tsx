"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { useEditorCard } from "@/contexts/editor-card-context"
import { useEditorLanguage } from "@/contexts/editor-language-context"
import { StudyLanguageSelectors } from "@/lib/languages/study-language-selectors"
import { buildCardStatus } from "@/lib/editor/card-field-patch"
import { presetLabelForCode } from "@/lib/languages/study-language-preferences"
import { POLYGUIDE_BRAND, POLYGUIDE_EDITOR_TAGLINE } from "@/lib/agent/polyguide-brand"

interface AiAssistantProps {
  mode?: "sidebar" | "floating"
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">{children}</div>
  )
}

function AssistantMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-3">
      <p className="text-xs text-gray-300 leading-relaxed">{children}</p>
    </div>
  )
}

function getAssistantAdvice(
  hasSentence: boolean,
  hasWord: boolean,
  requiredMissing: number,
): string {
  if (!hasSentence) {
    return "Paste a sentence to get started."
  }
  if (!hasWord) {
    return "Great sentence! Highlight or double-click a word to set the target."
  }
  if (requiredMissing > 0) {
    return "Use the ✨ Auto-Fill button to generate translation, definition, example and audio."
  }
  return "Card looks ready. Review and hit Save."
}

export function AiAssistant({ mode = "floating" }: AiAssistantProps) {
  const isSidebar = mode === "sidebar"
  const [isOpen, setIsOpen] = useState(true)
  const { studyLangPair, setStudyLangPair, sourceLang, targetLang, studyLangConflictMessage } =
    useEditorLanguage()
  const { fieldValues, sentence, targetWord } = useEditorCard()

  const cardStatus = useMemo(() => buildCardStatus(fieldValues), [fieldValues])

  const hasSentence = Boolean(sentence.trim())
  const hasWord = Boolean(targetWord.trim())
  const studyLabel = presetLabelForCode(sourceLang)
  const explainLabel = presetLabelForCode(targetLang)

  const advice = getAssistantAdvice(
    hasSentence,
    hasWord,
    cardStatus.requiredMissing.length,
  )

  const content = (
    <div className="space-y-6">
      <section>
        <SectionTitle>Languages</SectionTitle>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <StudyLanguageSelectors
            idPrefix="polyguide"
            compact
            pair={studyLangPair}
            onChange={setStudyLangPair}
            showSameLangWarning={Boolean(studyLangConflictMessage)}
          />
        </div>
      </section>

      <section>
        <AssistantMessage>{advice}</AssistantMessage>
      </section>

      <section>
        <SectionTitle>Card status</SectionTitle>
        <div className="glass-panel p-3 rounded-xl border border-app-border space-y-2">
          {cardStatus.requiredMissing.length > 0 ? (
            <p className="text-xs text-amber-400/90">
              Missing required: {cardStatus.requiredMissing.map((r) => r.label).join(", ")}
            </p>
          ) : (
            <p className="text-xs text-emerald-400/90">Required fields filled.</p>
          )}
          {cardStatus.optionalMissing.length > 0 ? (
            <p className="text-[10px] text-gray-500">
              Optional gaps: {cardStatus.optionalMissing.map((r) => r.label).join(", ")}
            </p>
          ) : null}
        </div>
      </section>

      <section>
        <div className="text-[10px] text-gray-600 leading-relaxed">
          <span className="text-brand-primary font-bold">{POLYGUIDE_BRAND}</span> · {POLYGUIDE_EDITOR_TAGLINE}
          <br />
          {studyLabel} study · {explainLabel} help
        </div>
      </section>
    </div>
  )

  if (isSidebar) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-app-border flex items-center justify-between shrink-0">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-gray-100 flex items-center gap-2 whitespace-nowrap">
              <i className="fas fa-graduation-cap text-brand-primary" /> {POLYGUIDE_BRAND}
            </span>
            <span className="text-[10px] text-gray-500 truncate">{POLYGUIDE_EDITOR_TAGLINE}</span>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-4">{content}</div>
      </div>
    )
  }

  return (
    <div
      data-testid="polyguide-panel"
      className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-3"
    >
      {isOpen && (
        <div className="w-[min(20rem,calc(100vw-2rem))] max-h-[70vh] bg-app-surface border border-app-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="p-4 border-b border-app-border flex justify-between items-center overflow-hidden">
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-gray-100 flex items-center gap-2 whitespace-nowrap">
                <i className="fas fa-graduation-cap text-brand-primary" /> {POLYGUIDE_BRAND}
              </span>
              <span className="text-[10px] text-gray-500 truncate">{POLYGUIDE_EDITOR_TAGLINE}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-600 hover:text-white transition p-2"
              type="button"
              aria-label="Close PolyGuide"
            >
              <i className="fas fa-times" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scroll">{content}</div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "shadow-xl flex items-center justify-center transition-all duration-200",
          isOpen
            ? "bg-app-surface text-white border border-app-border px-4 py-2.5 rounded-full text-sm font-medium gap-2 hover:border-white/20 hover:bg-white/5"
            : "h-14 w-14 rounded-full bg-brand-primary text-white hover:shadow-glow hover:scale-105 text-xl",
        )}
        type="button"
        aria-label={isOpen ? "Hide PolyGuide" : "Open PolyGuide"}
      >
        {isOpen ? (
          <>
            <i className="fas fa-chevron-down" />
            <span>Hide assistant</span>
          </>
        ) : (
          <i className="fas fa-graduation-cap" />
        )}
      </button>
    </div>
  )
}
