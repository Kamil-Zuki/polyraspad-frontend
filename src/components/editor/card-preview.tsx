"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { useEditorCard } from "@/contexts/editor-card-context"

export function CardPreview() {
  const {
    sentence,
    targetWord,
    translation,
    imageUrl,
    audioUrl,
  } = useEditorCard()
  const [side, setSide] = useState<"FRONT" | "BACK">("FRONT")

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
      {/* Toggle FRONT / BACK */}
      <div className="flex rounded-lg p-0.5 bg-app-bg border border-app-border mb-4">
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
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h2 className="text-lg md:text-xl leading-relaxed font-medium text-white">
              &ldquo;{highlightedSentence ?? (sentence || "—")}&rdquo;
            </h2>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 animate-in fade-in duration-300">
            {translation.trim() && (
              <p className="text-sm text-gray-400 font-light">
                &ldquo;{translation}&rdquo;
              </p>
            )}
            {imageUrl.trim() && (
              <div className="rounded-xl overflow-hidden border border-app-border bg-app-bg">
                <img
                  src={imageUrl.trim()}
                  alt="Card"
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              </div>
            )}
            {audioUrl.trim() && (
              <audio
                src={audioUrl.trim()}
                controls
                className="w-full h-8 opacity-90"
              />
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
    </div>
  )
}
