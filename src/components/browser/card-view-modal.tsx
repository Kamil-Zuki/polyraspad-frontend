"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { useCard } from "@/lib/react-query/queries"
import type { CardResponseDto } from "@/lib/api/types"
import Link from "next/link"
import { getPreviewImageSrc } from "@/lib/utils/media-preview-url"
import { PreviewImage } from "@/components/editor/card-preview"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

type CardViewModalProps = {
  cardId: string
  onClose: () => void
  /** Optional: use when card is already loaded from list to avoid extra fetch */
  initialCard?: CardResponseDto | null
}

function highlightTarget(sentence: string, targetWord: string) {
  if (!sentence?.trim()) return <span className="text-white/90">—</span>
  const tw = (targetWord || "").trim()
  if (!tw) return <span className="text-white/90">{sentence}</span>
  const parts = sentence.split(tw)
  if (parts.length === 1) return <span className="text-white/90">{sentence}</span>
  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          <span className="text-white/90">{part}</span>
          {i < parts.length - 1 && (
            <span className="text-brand-primary font-semibold border-b-2 border-brand-primary/50 pb-0.5">
              {tw}
            </span>
          )}
        </React.Fragment>
      ))}
    </>
  )
}

export function CardViewModal({ cardId, onClose, initialCard }: CardViewModalProps) {
  const [side, setSide] = useState<"FRONT" | "BACK">("FRONT")
  const { data: card, isLoading, error } = useCard(cardId)

  const c = initialCard ?? card
  const imageUrl = c?.media?.imageUrl ?? ""
  const audioUrl = c?.media?.audioUrl ?? ""
  const previewImageSrc = getPreviewImageSrc({
    imageId: c?.media?.imageId ?? undefined,
    imageUrl: imageUrl || undefined,
    apiBaseUrl: API_BASE_URL,
  })

  if (!c && isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !c) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="glass-panel rounded-xl p-8 max-w-md text-center" onClick={(e) => e.stopPropagation()}>
          <p className="text-red-400 mb-4">{error instanceof Error ? error.message : "Card not found"}</p>
          <button type="button" onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    )
  }

  const hasContent = c.sentence?.trim() || c.translation?.trim() || c.targetWord?.trim() || previewImageSrc || imageUrl || audioUrl

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn(
          "glass-panel rounded-2xl border border-app-border shadow-glow w-full max-w-lg overflow-hidden",
          "animate-in fade-in zoom-in-95 duration-200",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-app-border flex items-center justify-between">
          <div className="flex rounded-lg p-0.5 bg-app-bg border border-app-border">
            <button
              type="button"
              onClick={() => setSide("FRONT")}
              className={cn(
                "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                side === "FRONT" ? "bg-brand-primary text-white shadow-glow" : "text-gray-500 hover:text-white",
              )}
            >
              Front
            </button>
            <button
              type="button"
              onClick={() => setSide("BACK")}
              className={cn(
                "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                side === "BACK" ? "bg-brand-primary text-white shadow-glow" : "text-gray-500 hover:text-white",
              )}
            >
              Back
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/editor?cardId=${c.id}`}
              className="text-xs text-gray-400 hover:text-brand-primary transition"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition"
              aria-label="Close"
            >
              <i className="fas fa-times" />
            </button>
          </div>
        </div>

        <div className="p-6 min-h-[280px]">
          {!hasContent ? (
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center py-8">
              No content
            </p>
          ) : side === "FRONT" ? (
            <div className="space-y-4">
              <p className="text-lg leading-relaxed text-white">
                &ldquo;{highlightTarget(c.sentence ?? "", c.targetWord ?? "")}&rdquo;
              </p>
              {previewImageSrc && (
                <div className="rounded-xl overflow-hidden border border-app-border bg-app-bg">
                  <PreviewImage
                    src={previewImageSrc}
                    alt="Card"
                    imgClassName="w-full max-h-48 object-contain"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              {c.translation?.trim() && (
                <p className="text-gray-300">&ldquo;{c.translation}&rdquo;</p>
              )}
              {c.targetWord?.trim() && (
                <p className="text-sm">
                  <span className="text-gray-500 uppercase tracking-wider">Target: </span>
                  <span className="text-brand-primary font-semibold">{c.targetWord}</span>
                </p>
              )}
              {audioUrl && (
                <audio src={audioUrl} controls className="w-full h-8 opacity-90" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
