"use client"

import type { RefObject } from "react"
import type { PdfTextLayerSpan } from "@/app/reader/pdf-reader"
import { cn } from "@/lib/utils"

interface PdfTextOverlayProps {
  canvasRef: RefObject<HTMLCanvasElement | null>
  spans: PdfTextLayerSpan[]
  onSpanClick: (span: PdfTextLayerSpan) => void
  className?: string
}

/**
 * Invisible clickable text layer over PDF canvas (word bounding boxes from pdf.js).
 */
export function PdfTextOverlay({ canvasRef, spans, onSpanClick, className }: PdfTextOverlayProps) {
  return (
    <div className={cn("relative mx-auto inline-block max-w-full", className)}>
      <canvas ref={canvasRef} className="block max-h-[min(820px,78vh)] max-w-full rounded-lg bg-white shadow-[0_18px_48px_rgba(0,0,0,0.16)]" />
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {spans.map((span, index) => {
          const trimmed = span.text.trim()
          if (!trimmed || !/\w/.test(trimmed)) return null
          return (
            <button
              key={`${span.charStart}-${index}`}
              type="button"
              style={{
                position: "absolute",
                left: `${span.leftPct}%`,
                top: `${span.topPct}%`,
                width: `${Math.max(span.widthPct, 0.5)}%`,
                height: `${Math.max(span.heightPct, 1.2)}%`,
              }}
              className="pointer-events-auto cursor-pointer rounded-sm border border-transparent bg-sky-500/0 transition hover:bg-sky-500/20 hover:border-sky-500/30 focus:bg-sky-500/25 focus:outline-none"
              onClick={() => onSpanClick(span)}
              title={trimmed}
              aria-label={trimmed}
            />
          )
        })}
      </div>
    </div>
  )
}
