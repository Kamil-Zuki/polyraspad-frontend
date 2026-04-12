"use client"

import React, { useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useCard } from "@/lib/react-query/queries"
import type { CardResponseDto } from "@/lib/api/types"
import Link from "next/link"
import { resolvePublicApiBaseUrl } from "@/lib/api/public-api-url"
import { getPreviewImageSrc } from "@/lib/utils/media-preview-url"
import { PreviewImage } from "@/components/editor/card-preview"
import { resolveCardViewModalCard } from "@/components/browser/card-view-modal-state"

const API_BASE_URL = resolvePublicApiBaseUrl()

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
  const [isFullSize, setIsFullSize] = useState(false)
  const { data: card, isLoading, error } = useCard(cardId)

  const closeFullSize = useCallback(() => setIsFullSize(false), [])
  useEffect(() => {
    if (!isFullSize) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFullSize()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isFullSize, closeFullSize])

  const c = resolveCardViewModalCard(card, initialCard)
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
            {hasContent && (
              <button
                type="button"
                onClick={() => setIsFullSize(true)}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-app-border text-brand-primary hover:text-white hover:bg-brand-primary/20 hover:border-brand-primary/50 transition-all"
                title="Expand to full size"
                aria-label="Expand to full size"
              >
                <i className="fas fa-expand text-base" />
                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Full size</span>
              </button>
            )}
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
                    fallbackSrc={imageUrl || undefined}
                    alt="Card"
                    imgClassName="w-full max-h-48 object-contain"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200 flex flex-col items-center text-center">
              {c.translation?.trim() && (
                <p className="text-gray-300">&ldquo;{c.translation}&rdquo;</p>
              )}
              {c.targetWord?.trim() && (
                <p className="text-sm">
                  <span className="text-gray-500 uppercase tracking-wider">Target: </span>
                  <span className="text-brand-primary font-semibold">{c.targetWord}</span>
                </p>
              )}
              {previewImageSrc && (
                <div className="rounded-xl overflow-hidden border border-app-border bg-app-bg w-full max-w-sm">
                  <PreviewImage
                    src={previewImageSrc}
                    fallbackSrc={imageUrl || undefined}
                    alt="Card"
                    imgClassName="w-full max-h-48 object-contain"
                  />
                </div>
              )}
              {audioUrl && (
                <audio src={audioUrl} controls className="w-full h-8 opacity-90 max-w-xs" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full-size card overlay */}
      {isFullSize && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeFullSize}
        >
          <div
            className={cn(
              "glass-panel rounded-2xl border border-app-border shadow-glow w-full max-w-4xl overflow-hidden",
              "min-h-[500px] max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-app-border flex items-center justify-between shrink-0">
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
                  onClick={closeFullSize}
                  className="p-2 text-gray-400 hover:text-white rounded-lg transition"
                  aria-label="Close full size"
                  title="Close full size"
                >
                  <i className="fas fa-compress text-base" />
                </button>
              </div>
            </div>

            <div className="p-8 flex-1 overflow-y-auto flex flex-col min-h-0">
              {side === "FRONT" ? (
                <div className="space-y-6 flex flex-col items-center justify-center flex-1">
                  <p className="text-2xl md:text-3xl leading-relaxed text-white text-center">
                    &ldquo;{highlightTarget(c.sentence ?? "", c.targetWord ?? "")}&rdquo;
                  </p>
                  {previewImageSrc && (
                    <div className="rounded-xl overflow-hidden border border-app-border bg-app-bg w-full">
                      <PreviewImage
                        src={previewImageSrc}
                        fallbackSrc={imageUrl || undefined}
                        alt="Card"
                        imgClassName="w-full min-h-[200px] max-h-80 object-contain"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-200 flex flex-col items-center justify-center text-center flex-1">
                  {c.translation?.trim() && (
                    <p className="text-xl text-gray-300 max-w-2xl">&ldquo;{c.translation}&rdquo;</p>
                  )}
                  {c.targetWord?.trim() && (
                    <p className="text-base">
                      <span className="text-gray-500 uppercase tracking-wider">Target: </span>
                      <span className="text-brand-primary font-semibold">{c.targetWord}</span>
                    </p>
                  )}
                  {previewImageSrc && (
                    <div className="rounded-xl overflow-hidden border border-app-border bg-app-bg w-full max-w-xl">
                      <PreviewImage
                        src={previewImageSrc}
                        fallbackSrc={imageUrl || undefined}
                        alt="Card"
                        imgClassName="w-full min-h-[200px] max-h-80 object-contain"
                      />
                    </div>
                  )}
                  {audioUrl && (
                    <audio src={audioUrl} controls className="w-full h-10 opacity-90 max-w-md" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
