"use client"

import React, { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { useEditorCard } from "@/contexts/editor-card-context"

function PreviewImage({
  src,
  alt = "Card",
  className,
  imgClassName,
}: {
  src: string
  alt?: string
  className?: string
  imgClassName?: string
}) {
  const [error, setError] = useState(false)
  if (error) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-app-border bg-app-bg text-gray-500",
          className
        )}
      >
        <i className="fas fa-image text-2xl mb-2 opacity-50" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-center px-2">
          Could not load image
        </span>
        <span className="text-[9px] text-gray-600 mt-1 text-center px-2">
          Check URL or re-upload
        </span>
      </div>
    )
  }
  return (
    <div className={cn("rounded-xl overflow-hidden border border-app-border bg-app-bg", className)}>
      <img
        src={src}
        alt={alt}
        className={cn("w-full h-full min-h-[140px] max-h-48 object-contain", imgClassName)}
        onError={() => setError(true)}
      />
    </div>
  )
}

export function CardPreview() {
  const {
    sentence,
    targetWord,
    translation,
    imageUrl,
    audioUrl,
  } = useEditorCard()
  const [side, setSide] = useState<"FRONT" | "BACK">("FRONT")
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false)

  const closeFullScreen = useCallback(() => setIsFullScreenOpen(false), [])
  useEffect(() => {
    if (!isFullScreenOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFullScreen()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isFullScreenOpen, closeFullScreen])

  // Highlight targetWord inside sentence (purple)
  const highlightedSentence = React.useMemo(() => {
    if (!sentence.trim()) return null
    const tw = targetWord.trim()
    if (!tw) {
      return <span className="text-white/90">{sentence}</span>
    }
    const parts = sentence.split(tw)
    if (parts.length === 1) {
      return <span className="text-white/90">{sentence}</span>
    }
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
  }, [sentence, targetWord])

  const hasContent =
    sentence.trim() ||
    targetWord.trim() ||
    translation.trim() ||
    imageUrl.trim() ||
    audioUrl.trim()

  return (
    <div className="flex flex-col h-full">
      {/* Toggle FRONT / BACK + Expand */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex flex-1 rounded-lg p-0.5 bg-app-bg border border-app-border">
          <button
            type="button"
            onClick={() => setSide("FRONT")}
            className={cn(
              "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
              side === "FRONT"
                ? "bg-brand-primary text-white shadow-glow"
                : "text-gray-500 hover:text-white",
            )}
          >
            Front
          </button>
          <button
            type="button"
            onClick={() => setSide("BACK")}
            className={cn(
              "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
              side === "BACK"
                ? "bg-brand-primary text-white shadow-glow"
                : "text-gray-500 hover:text-white",
            )}
          >
            Back
          </button>
        </div>
        {hasContent && (
          <button
            type="button"
            onClick={() => setIsFullScreenOpen(true)}
            className="p-2 rounded-lg border border-app-border text-gray-500 hover:text-white hover:border-brand-primary/50 transition-all"
            title="Expand to full size"
            aria-label="Expand preview to full size"
          >
            <i className="fas fa-expand text-sm" />
          </button>
        )}
      </div>

      {/* Glass card - reduced copy of study card */}
      <div
        className={cn(
          "glass-panel flex-1 min-h-[280px] rounded-2xl p-6 flex flex-col",
          "border border-app-border shadow-glow transition-all duration-300",
          "hover:border-brand-primary/30",
        )}
      >
        {!hasContent ? (
          <div className="flex-1 flex items-center justify-center text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Fill the form to see preview
            </p>
          </div>
        ) : side === "FRONT" ? (
          <div className="flex-1 flex flex-col gap-4 items-center justify-center text-center">
            <h2 className="text-lg md:text-xl leading-relaxed font-medium text-white">
              &ldquo;{highlightedSentence ?? (sentence || "—")}&rdquo;
            </h2>
            {imageUrl.trim() && (
              <PreviewImage src={imageUrl.trim()} className="w-full min-h-[140px] max-h-48" />
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 animate-in fade-in duration-300">
            {translation.trim() && (
              <p className="text-sm text-gray-400 font-light">
                &ldquo;{translation}&rdquo;
              </p>
            )}
            {targetWord.trim() && (
              <p className="text-sm">
                <span className="text-gray-500 uppercase tracking-wider">Target: </span>
                <span className="text-brand-primary font-semibold">{targetWord}</span>
              </p>
            )}
            {imageUrl.trim() && (
              <PreviewImage src={imageUrl.trim()} className="w-full min-h-[140px] max-h-48" />
            )}
            {audioUrl.trim() && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Audio
                </span>
                <audio
                  src={audioUrl.trim()}
                  controls
                  className="w-full h-8 opacity-90"
                />
              </div>
            )}
            {side === "BACK" &&
              !translation.trim() &&
              !imageUrl.trim() &&
              !audioUrl.trim() && (
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                  Add translation or media
                </p>
              )}
          </div>
        )}
      </div>

      {/* Full-size preview modal (Anki-style) */}
      {isFullScreenOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={closeFullScreen}
        >
          <div
            className={cn(
              "glass-panel rounded-2xl border border-app-border shadow-glow w-full max-w-3xl overflow-hidden",
              "min-h-[400px] max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200",
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
                    side === "FRONT"
                      ? "bg-brand-primary text-white shadow-glow"
                      : "text-gray-500 hover:text-white",
                  )}
                >
                  Front
                </button>
                <button
                  type="button"
                  onClick={() => setSide("BACK")}
                  className={cn(
                    "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                    side === "BACK"
                      ? "bg-brand-primary text-white shadow-glow"
                      : "text-gray-500 hover:text-white",
                  )}
                >
                  Back
                </button>
              </div>
              <button
                type="button"
                onClick={closeFullScreen}
                className="p-2 text-gray-400 hover:text-white rounded-lg transition"
                aria-label="Close"
              >
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="p-8 flex-1 overflow-y-auto flex flex-col min-h-0">
              {!hasContent ? (
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center py-12">
                  Fill the form to see preview
                </p>
              ) : side === "FRONT" ? (
                <div className="flex flex-col gap-6 items-center justify-center text-center flex-1">
                  <h2 className="text-2xl md:text-3xl leading-relaxed font-medium text-white">
                    &ldquo;{highlightedSentence ?? (sentence || "—")}&rdquo;
                  </h2>
                  {imageUrl.trim() && (
                    <PreviewImage
                      src={imageUrl.trim()}
                      className="w-full min-h-[200px] max-h-80"
                      imgClassName="min-h-[200px] max-h-80"
                    />
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                  {translation.trim() && (
                    <p className="text-lg text-gray-400 font-light">
                      &ldquo;{translation}&rdquo;
                    </p>
                  )}
                  {targetWord.trim() && (
                    <p className="text-base">
                      <span className="text-gray-500 uppercase tracking-wider">Target: </span>
                      <span className="text-brand-primary font-semibold">{targetWord}</span>
                    </p>
                  )}
                  {imageUrl.trim() && (
                    <PreviewImage
                      src={imageUrl.trim()}
                      className="w-full min-h-[200px] max-h-80"
                      imgClassName="min-h-[200px] max-h-80"
                    />
                  )}
                  {audioUrl.trim() && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Audio
                      </span>
                      <audio
                        src={audioUrl.trim()}
                        controls
                        className="w-full h-10 opacity-90"
                      />
                    </div>
                  )}
                  {!translation.trim() && !imageUrl.trim() && !audioUrl.trim() && (
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                      Add translation or media
                    </p>
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
