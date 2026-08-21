"use client"

import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Volume2, Loader2, Mic } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ReaderWordPopoverAnchor {
  x: number
  y: number
}

interface ReaderWordPopoverProps {
  open: boolean
  anchor: ReaderWordPopoverAnchor | null
  word: string
  translation: string
  transcription?: string
  isTranslationLoading?: boolean
  pending?: boolean
  onSave: () => void
  onKnown: () => void
  onIgnore: () => void
  onOpenDetails: () => void
  onListen: () => void
  onShadowSentence?: () => void
  isListenLoading?: boolean
  listenError?: string | null
  onClose: () => void
}

export function ReaderWordPopover({
  open,
  anchor,
  word,
  translation,
  transcription,
  isTranslationLoading,
  pending,
  onSave,
  onKnown,
  onIgnore,
  onOpenDetails,
  onListen,
  onShadowSentence,
  isListenLoading = false,
  listenError = null,
  onClose,
}: ReaderWordPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === "1") {
        e.preventDefault()
        onSave()
      }
      if (e.key === "2") {
        e.preventDefault()
        onKnown()
      }
      if (e.key === "3") {
        e.preventDefault()
        onIgnore()
      }
      if (e.key === "4") {
        e.preventDefault()
        onListen()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, onIgnore, onKnown, onListen, onSave, open])

  if (!open || !anchor || typeof document === "undefined") return null

  const panelWidth = 320
  const left = Math.min(Math.max(12, anchor.x - panelWidth / 2), window.innerWidth - panelWidth - 12)
  const top = Math.min(Math.max(12, anchor.y - 12), window.innerHeight - 280)

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close word popover"
        className="fixed inset-0 z-[45] bg-black/20"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-label={`Quick actions for ${word}`}
        className="fixed z-[46] w-[min(320px,calc(100vw-24px))] rounded-2xl border border-white/15 bg-[#111723]/98 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-md"
        style={{ left, top: top - 8, transform: "translateY(-100%)" }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500">Selected</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="truncate text-lg font-semibold text-white">{word}</p>
            </div>
          </div>
        </div>
        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Translation</p>
          <p className={cn("mt-1 text-sm leading-6", translation ? "text-gray-100" : "text-gray-500")}>
            {isTranslationLoading ? "Translating…" : translation || "—"}
          </p>
          {transcription ? (
            <p className="mt-2 text-xs text-gray-400">
              <span className="text-gray-500">IPA: </span>
              {transcription}
            </p>
          ) : null}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={onSave}
            title="Save term to vocabulary (yellow highlight). Hotkey: 1"
            className="rounded-xl bg-amber-500/90 px-2 py-2.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
          >
            Save term <span className="opacity-70">1</span>
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onKnown}
            title="Known (2)"
            className="rounded-xl border border-white/15 bg-white/10 px-2 py-2.5 text-xs font-semibold text-white hover:bg-white/15 disabled:opacity-50"
          >
            Known <span className="opacity-70">2</span>
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onIgnore}
            title="Ignore (3)"
            className="rounded-xl border border-white/15 bg-white/5 px-2 py-2.5 text-xs font-semibold text-gray-300 hover:bg-white/10 disabled:opacity-50"
          >
            Ignore <span className="opacity-70">3</span>
          </button>
        </div>
        <button
          type="button"
          disabled={pending || isListenLoading}
          onClick={onListen}
          title="Listen with TTS (4)"
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-secondary/45 bg-brand-secondary/15 px-3 py-2.5 text-xs font-semibold text-brand-secondary hover:bg-brand-secondary/25 disabled:opacity-50"
        >
          {isListenLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
          {isListenLoading ? "Generating audio…" : "Listen"}
          <span className="opacity-70">4</span>
        </button>
        {listenError ? <p className="mt-2 text-xs text-rose-300">{listenError}</p> : null}
        <button
          type="button"
          onClick={onOpenDetails}
          className="mt-2 w-full rounded-xl border border-brand-primary/30 bg-brand-primary/15 px-3 py-2.5 text-xs font-semibold text-brand-primary hover:bg-brand-primary/25"
        >
          More details & card →
        </button>
        {onShadowSentence && process.env.NEXT_PUBLIC_FF_ADVANCED_MODULES === "true" && (
          <button
            type="button"
            onClick={onShadowSentence}
            className="mt-2 w-full rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-2.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 flex items-center justify-center"
          >
            <Mic className="w-3.5 h-3.5 mr-2" />
            Shadow this sentence
          </button>
        )}
        <p className="mt-2 text-center text-[10px] text-gray-500">
          Esc close · 1–4 actions · drag words for phrases
        </p>
      </div>
    </>,
    document.body,
  )
}
