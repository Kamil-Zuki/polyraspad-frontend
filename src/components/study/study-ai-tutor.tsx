"use client"

import { useEffect, useMemo, useState } from "react"
import { Lightbulb, X } from "lucide-react"
import type { CardStudyDto } from "@/lib/api/types"
import { noteFieldPlainString } from "@/lib/editor/card-display"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"
import { runGenerateExampleAgent } from "@/lib/editor/polyguide-agent"
import { resolvePreferredAiModelId } from "@/lib/studio/ai-model-preferences"
import { cn } from "@/lib/utils"

export interface StudyAiTutorProps {
  card: CardStudyDto
  sourceLang?: string | null
  targetLang?: string | null
  onDismiss: () => void
}

interface Tip {
  sentence: string
  translation: string
}

function extractTargetWord(card: CardStudyDto): string {
  const fv = card.content.note?.fieldValues
  const sentence = noteFieldPlainString(fv, SENTENCE_MINING.Expression)
  const wordField = noteFieldPlainString(fv, SENTENCE_MINING.Word)
  const { start, len } = card.content.targetIndex ?? {}
  if (sentence && typeof start === "number" && typeof len === "number" && len > 0) {
    return sentence.slice(start, start + len).trim()
  }
  return wordField.trim()
}

export function StudyAiTutor({ card, sourceLang, targetLang, onDismiss }: StudyAiTutorProps) {
  const [tip, setTip] = useState<Tip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const word = useMemo(() => extractTargetWord(card), [card])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(false)
    setTip(null)

    const src = sourceLang || "en"
    const tgt = targetLang || "ru"
    const model = resolvePreferredAiModelId(src)

    runGenerateExampleAgent(word, src, tgt, model)
      .then((result) => {
        if (cancelled) return
        setTip(result)
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [card, word, sourceLang, targetLang])

  // Auto-hide after 12 seconds once the content is shown
  useEffect(() => {
    if (isLoading) return
    const timer = setTimeout(() => {
      onDismiss()
    }, 12000)
    return () => clearTimeout(timer)
  }, [isLoading, onDismiss])

  if (!word) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto absolute bottom-28 left-4 z-30 w-full max-w-sm",
        "rounded-2xl border border-brand-primary/20 bg-app-surface/95 p-4 shadow-glow backdrop-blur-sm",
        "animate-in slide-in-from-bottom-4 fade-in duration-300"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-primary/15 text-brand-primary">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-white">AI Tutor</h4>

          {isLoading ? (
            <div className="mt-2 space-y-2">
              <div className="h-3 w-3/4 rounded bg-white/10 animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-white/10 animate-pulse" />
            </div>
          ) : error || !tip ? (
            <p className="mt-1 text-sm text-gray-300">
              Keep going! Reviewing this word again soon will strengthen your memory.
            </p>
          ) : (
            <div className="mt-1 space-y-1">
              <p className="text-sm text-white font-medium leading-snug">{tip.sentence}</p>
              <p className="text-xs text-gray-400 leading-snug">{tip.translation}</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg p-1.5 text-gray-500 transition hover:bg-white/10 hover:text-white"
          aria-label="Dismiss AI tutor"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
