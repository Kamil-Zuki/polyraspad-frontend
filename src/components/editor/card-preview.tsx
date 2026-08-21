"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { useEditorCard } from "@/contexts/editor-card-context"
import { resolvePublicApiBaseUrl } from "@/lib/api/public-api-url"
import { resolveCardImagePreview } from "@/lib/utils/media-preview-url"
import { sentenceMiningEditorBackSections } from "@/lib/editor/sentence-mining-display"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"
import { sanitizeSourceUrl } from "@/app/reader/reader-utils"

const API_BASE_URL = resolvePublicApiBaseUrl()

export function PreviewImage({
  src,
  alt = "Card",
  className,
  imgClassName,
  fallbackSrc,
}: {
  src: string
  alt?: string
  className?: string
  imgClassName?: string
  fallbackSrc?: string
}) {
  const [error, setError] = useState(false)
  const [resolvedSrc, setResolvedSrc] = useState(() =>
    src && !src.includes("/api/Media/serve-image") ? src : ""
  )
  const objectUrlRef = React.useRef<string | null>(null)
  const triedFallbackRef = React.useRef(false)

  useEffect(() => {
    if (!src) {
      setResolvedSrc("")
      setError(false)
      triedFallbackRef.current = false
      return
    }
    setError(false)
    triedFallbackRef.current = false
    if (src.includes("/api/Media/serve-image")) {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
      fetch(src, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((r) => {
          if (!r.ok) throw new Error()
          return r.blob()
        })
        .then((blob) => {
          if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
          objectUrlRef.current = URL.createObjectURL(blob)
          setResolvedSrc(objectUrlRef.current)
        })
        .catch(() => {
          if (fallbackSrc?.trim()) {
            triedFallbackRef.current = true
            setResolvedSrc(fallbackSrc.trim())
            setError(false)
          } else {
            setError(true)
          }
        })
      return () => {
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current)
          objectUrlRef.current = null
        }
      }
    } else {
      setResolvedSrc(src)
    }
  }, [src, fallbackSrc])

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
      </div>
    )
  }
  const isLoading = src && src.includes("/api/Media/serve-image") && !resolvedSrc
  if (isLoading) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-app-border bg-app-bg min-h-[140px] max-h-48",
          className
        )}
      >
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!resolvedSrc) return null
  return (
    <div className={cn("rounded-xl overflow-hidden border border-app-border bg-app-bg", className)}>
      <img
        src={resolvedSrc}
        alt={alt}
        className={cn("w-full h-full min-h-[140px] max-h-48 object-contain", imgClassName)}
        onError={() => {
          const fallback = fallbackSrc?.trim()
          if (fallback && resolvedSrc !== fallback && !triedFallbackRef.current) {
            triedFallbackRef.current = true
            setResolvedSrc(fallback)
            setError(false)
            return
          }
          setError(true)
        }}
      />
    </div>
  )
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

function BackSections({ sections }: { sections: ReturnType<typeof sentenceMiningEditorBackSections> }) {
  if (sections.length === 0) {
    return (
      <p className="text-center text-sm text-gray-500">No back fields filled yet.</p>
    )
  }
  return (
    <div className="rounded-2xl border border-white/10 bg-app-bg/55 px-5 py-4">
      <dl className="space-y-4">
        {sections.map((row) => (
          <div
            key={`${row.key}-${row.label}`}
            className="border-b border-white/5 pb-4 last:border-b-0 last:pb-0"
          >
            <dt className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
              {row.label}
            </dt>
            <dd className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-200">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function SourceChip({ title, url }: { title: string; url?: string | null }) {
  if (!title.trim()) return null
  const cleanUrl = sanitizeSourceUrl(url)
  const content = (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] font-medium text-gray-400 max-w-full">
      <i className="fas fa-link text-brand-primary/70 shrink-0" />
      <span className="truncate">{title}</span>
      {cleanUrl && <i className="fas fa-external-link-alt text-[9px] text-gray-500 shrink-0" />}
    </span>
  )
  if (cleanUrl) {
    return (
      <a
        href={cleanUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-block hover:text-white transition"
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </a>
    )
  }
  return content
}

function FrontContent({
  expression,
  targetWord,
  imagePreview,
  sourceTitle,
  sourceUrl,
  large = false,
}: {
  expression: string
  targetWord: string
  imagePreview: ReturnType<typeof resolveCardImagePreview>
  sourceTitle?: string
  sourceUrl?: string
  large?: boolean
}) {
  return (
    <div className={cn("flex flex-col gap-4 items-stretch", large ? "gap-6" : "")}>
      {sourceTitle && <SourceChip title={sourceTitle} url={sourceUrl} />}
      {imagePreview.hasImage && imagePreview.previewSrc && (
        <PreviewImage
          src={imagePreview.previewSrc}
          fallbackSrc={imagePreview.fallbackSrc}
          className={cn("w-full shrink-0", large ? "min-h-[200px] max-h-80" : "min-h-[140px] max-h-48")}
          imgClassName={large ? "min-h-[200px] max-h-80" : undefined}
        />
      )}
      <p
        className={cn(
          "leading-relaxed font-medium text-white",
          large ? "text-2xl md:text-3xl" : "text-lg md:text-xl"
        )}
      >
        &ldquo;{highlightTarget(expression, targetWord)}&rdquo;
      </p>
    </div>
  )
}

function BackContent({
  sections,
  audioUrl,
}: {
  sections: ReturnType<typeof sentenceMiningEditorBackSections>
  audioUrl: string
}) {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      <BackSections sections={sections} />
      {audioUrl.trim() && (
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Audio
          </span>
          <audio src={audioUrl.trim()} controls className="w-full h-8 opacity-90" />
        </div>
      )}
    </div>
  )
}

export function CardPreview() {
  const { fieldValues, imageId } = useEditorCard()
  const fv = fieldValues as Record<string, string>
  const imagePreview = resolveCardImagePreview({
    imageId: imageId?.trim() || undefined,
    imageFieldValue: fv[SENTENCE_MINING.Image],
    apiBaseUrl: API_BASE_URL,
  })
  const [side, setSide] = useState<"FRONT" | "BACK">("FRONT")
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false)

  const expression = fv[SENTENCE_MINING.Expression]?.trim() ?? ""
  const targetWord = fv[SENTENCE_MINING.Word]?.trim() ?? ""
  const sourceTitle = fv[SENTENCE_MINING.SourceTitle]?.trim() ?? ""
  const sourceUrl = sanitizeSourceUrl(fv[SENTENCE_MINING.SourceUrl])
  const backSections = useMemo(() => sentenceMiningEditorBackSections(fv), [fv])

  const closeFullScreen = useCallback(() => setIsFullScreenOpen(false), [])
  useEffect(() => {
    if (!isFullScreenOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFullScreen()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isFullScreenOpen, closeFullScreen])

  const hasContent = useMemo(() => {
    if (Object.values(fv).some((v) => (v ?? "").trim().length > 0)) return true
    return !!(imagePreview.hasImage || fv[SENTENCE_MINING.Audio]?.trim())
  }, [fv, imagePreview.hasImage])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex flex-1 rounded-lg p-0.5 bg-app-bg border border-app-border">
          <button
            type="button"
            onClick={() => setSide("FRONT")}
            className={cn(
              "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
              side === "FRONT"
                ? "bg-brand-primary text-white shadow-glow"
                : "text-gray-500 hover:text-white"
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
                : "text-gray-500 hover:text-white"
            )}
          >
            Back
          </button>
        </div>
        {hasContent && (
          <button
            type="button"
            onClick={() => setIsFullScreenOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-app-border text-brand-primary hover:text-white hover:bg-brand-primary/20 hover:border-brand-primary/50 transition-all"
            title="Expand to full size"
            aria-label="Expand preview to full size"
          >
            <i className="fas fa-expand text-base" />
            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
              Full size
            </span>
          </button>
        )}
      </div>

      <div
        className={cn(
          "glass-panel flex-1 min-h-[280px] rounded-2xl p-6 flex flex-col",
          "border border-app-border shadow-glow transition-all duration-300",
          "hover:border-brand-primary/30"
        )}
      >
        {!hasContent ? (
          <div className="flex-1 flex items-center justify-center text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Fill the form to see preview
            </p>
          </div>
        ) : side === "FRONT" ? (
          <div className="flex-1 flex flex-col justify-start overflow-y-auto">
            <FrontContent
              expression={expression}
              targetWord={targetWord}
              imagePreview={imagePreview}
              sourceTitle={sourceTitle}
              sourceUrl={sourceUrl}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-start overflow-y-auto">
            <BackContent
              sections={backSections}
              audioUrl={fv[SENTENCE_MINING.Audio] ?? ""}
            />
          </div>
        )}
      </div>

      {isFullScreenOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={closeFullScreen}
        >
          <div
            className={cn(
              "glass-panel rounded-2xl border border-app-border shadow-glow w-full max-w-3xl overflow-hidden",
              "min-h-[400px] max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
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
                      : "text-gray-500 hover:text-white"
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
                      : "text-gray-500 hover:text-white"
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
                <FrontContent
                  expression={expression}
                  targetWord={targetWord}
                  imagePreview={imagePreview}
                  sourceTitle={sourceTitle}
                  sourceUrl={sourceUrl}
                  large
                />
              ) : (
                <BackContent
                  sections={backSections}
                  audioUrl={fv[SENTENCE_MINING.Audio] ?? ""}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
