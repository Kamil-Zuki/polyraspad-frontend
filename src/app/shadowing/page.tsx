"use client"

import { useEffect, useMemo, useState, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { generateAudio } from "@/lib/api/media-client"
import { useProjectContext } from "@/contexts/project-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PaywallGate } from "@/components/billing/paywall-gate"
import { ShadowingRecorder } from "@/components/shadowing/shadowing-recorder"
import { ShadowingRating, type ShadowingRating as ShadowingRatingValue } from "@/components/shadowing/shadowing-rating"
import {
  saveShadowingAttempt,
  getShadowingAttempts,
  type ShadowingAttempt,
} from "@/lib/shadowing/shadowing-storage"
import { noteFieldPlainString } from "@/lib/editor/card-display"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"
import { cn } from "@/lib/utils"
import type { RecordingResult } from "@/lib/shadowing/shadowing-audio"

type ShadowingSourceType = "card" | "book" | "reader"

interface ShadowingSession {
  sentence: string
  cardId?: string | null
  sourceType: ShadowingSourceType
  sourceId?: string | null
  sourceTitle?: string | null
  returnTo?: string | null
}

function useShadowingSession(): ShadowingSession | null {
  const searchParams = useSearchParams()

  return useMemo(() => {
    const sentence = searchParams.get("sentence")?.trim()
    const cardId = searchParams.get("cardId")?.trim()
    const sourceType = (searchParams.get("sourceType")?.trim() as ShadowingSourceType) || "reader"
    const sourceId = searchParams.get("sourceId")?.trim()
    const sourceTitle = searchParams.get("sourceTitle")?.trim()
    const returnTo = searchParams.get("returnTo")?.trim()

    if (!sentence && !cardId) return null

    return {
      sentence: sentence || "",
      cardId: cardId || null,
      sourceType,
      sourceId: sourceId || null,
      sourceTitle: sourceTitle || null,
      returnTo: returnTo || null,
    }
  }, [searchParams])
}

function ShadowingPageContent() {
  const router = useRouter()
  const { currentProject } = useProjectContext()
  const session = useShadowingSession()

  const { data: card, isLoading: isCardLoading } = useQuery({
    queryKey: ["card", session?.cardId],
    queryFn: () => (session?.cardId ? apiClient.cards.getCard(session.cardId) : null),
    enabled: Boolean(session?.cardId),
  })

  const [sentence, setSentence] = useState(session?.sentence || "")
  const [ttsUrl, setTtsUrl] = useState<string | null>(null)
  const [isGeneratingTts, setIsGeneratingTts] = useState(false)
  const [ttsError, setTtsError] = useState<string | null>(null)
  const [recording, setRecording] = useState<RecordingResult | null>(null)
  const [rating, setRating] = useState<ShadowingRatingValue | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedAttempt, setSavedAttempt] = useState<ShadowingAttempt | null>(null)
  const [history, setHistory] = useState<ShadowingAttempt[]>([])

  useEffect(() => {
    if (card?.note?.fieldValues) {
      const expr = noteFieldPlainString(card.note.fieldValues, SENTENCE_MINING.Expression)
      if (expr && !session?.sentence) {
        setSentence(expr)
      }
    }
  }, [card, session?.sentence])

  useEffect(() => {
    if (!sentence) return
    const existing = getShadowingAttempts({ sentence })
    setHistory(existing)
  }, [sentence])

  useEffect(() => {
    if (!sentence || !currentProject) return

    let cancelled = false
    setIsGeneratingTts(true)
    setTtsError(null)

    generateAudio({
      text: sentence,
      language: currentProject.sourceLang || "en",
      voice: null,
      speed: null,
    })
      .then((res) => {
        if (cancelled) return
        setTtsUrl(res.url)
      })
      .catch((err) => {
        if (cancelled) return
        setTtsError(err instanceof Error ? err.message : "Could not generate audio.")
      })
      .finally(() => {
        if (!cancelled) setIsGeneratingTts(false)
      })

    return () => {
      cancelled = true
    }
  }, [sentence, currentProject])

  const handleSave = useCallback(() => {
    if (!sentence || !rating) return
    setIsSaving(true)
    const attempt = saveShadowingAttempt({
      cardId: session?.cardId || card?.id,
      sentence,
      sourceType: session?.sourceType || "reader",
      sourceId: session?.sourceId,
      sourceTitle: session?.sourceTitle,
      rating,
    })
    setSavedAttempt(attempt)
    setHistory(getShadowingAttempts({ sentence }))
    setIsSaving(false)
  }, [sentence, rating, session, card])

  const handleNext = useCallback(() => {
    setRecording(null)
    setRating(null)
    setSavedAttempt(null)
    setTtsUrl(null)
    // For MVP, going "next" just clears state so the user can paste a new sentence
    // or navigate back to study/reader. Future: queue next card from deck.
    router.push("/shadowing")
  }, [router])

  if (!session) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-app-surface p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-microphone-alt text-2xl text-brand-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Shadowing Practice</h1>
          <p className="text-gray-400 text-sm mb-6">
            Listen to a native sentence, record yourself, and compare.
          </p>
          <p className="text-gray-500 text-xs mb-6">
            Open this page from a study card or reader sentence to get a sentence.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-primary text-white font-medium hover:opacity-90 transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const isReady = Boolean(sentence)
  const isSaved = Boolean(savedAttempt)
  const returnHref = session.returnTo || "/dashboard"

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Shadowing Practice</h1>
            {session.sourceTitle && (
              <p className="mt-1 text-sm text-gray-500 truncate max-w-md">
                From: <span className="text-gray-300">{session.sourceTitle}</span>
              </p>
            )}
          </div>
          <Link
            href={returnHref}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition text-sm font-medium self-start"
          >
            <i className="fas fa-arrow-left" /> Back
          </Link>
        </div>

        {/* Sentence card */}
        <div className="rounded-3xl border border-white/10 bg-app-surface p-6 md:p-10 mb-8 shadow-xl">
          {isCardLoading ? (
            <div className="h-24 rounded-xl bg-white/5 animate-pulse" />
          ) : (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-400/90 mb-4">
                Sentence
              </p>
              <p className="text-2xl md:text-3xl lg:text-4xl font-medium text-white leading-tight">
                &ldquo;{sentence || "No sentence"}&rdquo;
              </p>
              {ttsError && (
                <p className="mt-4 text-sm text-rose-400">{ttsError}</p>
              )}
              {isGeneratingTts && !ttsUrl && !ttsError && (
                <p className="mt-4 text-sm text-gray-500">
                  <i className="fas fa-spinner fa-spin mr-2" />
                  Generating native audio…
                </p>
              )}
            </>
          )}
        </div>

        {/* Recorder */}
        <div className="rounded-3xl border border-white/10 bg-app-surface p-6 md:p-8 mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-400/90 mb-5">
            Listen & Record
          </p>
          <ShadowingRecorder
            ttsUrl={ttsUrl}
            onRecordingChange={setRecording}
            disabled={!isReady}
          />
        </div>

        {/* Rating */}
        <div className="rounded-3xl border border-white/10 bg-app-surface p-6 md:p-8 mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-400/90 mb-5">
            How did it feel?
          </p>
          <ShadowingRating
            value={rating}
            onChange={setRating}
            disabled={!isReady || !recording}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={!rating || isSaving || isSaved}
            className={cn(
              "px-8 py-4 rounded-2xl font-bold transition flex items-center gap-2",
              isSaved
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-brand-primary text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
            )}
          >
            {isSaved ? (
              <>
                <i className="fas fa-check" /> Saved
              </>
            ) : isSaving ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Saving…
              </>
            ) : (
              <>
                <i className="fas fa-save" /> Save attempt
              </>
            )}
          </button>

          {isSaved && (
            <button
              type="button"
              onClick={handleNext}
              className="px-8 py-4 rounded-2xl font-bold bg-app-surface border border-white/10 text-white hover:bg-white/5 transition"
            >
              Practice another
            </button>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-12 rounded-3xl border border-white/10 bg-app-surface p-6 md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-400/90 mb-5">
              Recent attempts
            </p>
            <div className="space-y-3">
              {history.slice(0, 5).map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
                >
                  <span className="text-sm text-gray-300">
                    {new Date(attempt.createdAt).toLocaleString()}
                  </span>
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold uppercase",
                      attempt.rating === 3 && "bg-emerald-500/20 text-emerald-400",
                      attempt.rating === 2 && "bg-amber-500/20 text-amber-400",
                      attempt.rating === 1 && "bg-rose-500/20 text-rose-400"
                    )}
                  >
                    {attempt.rating === 3 ? "Good" : attempt.rating === 2 ? "Okay" : "Bad"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ShadowingPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="min-h-screen bg-app-bg flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <PaywallGate gate="canUseSpeaking" mode="replace">
          <ShadowingPageContent />
        </PaywallGate>
      </Suspense>
    </ProtectedRoute>
  )
}
