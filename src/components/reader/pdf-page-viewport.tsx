"use client"

import type { RefObject } from "react"
import { useMemo } from "react"
import type { PdfTextLayerSpan } from "@/app/reader/pdf-reader"
import { expandSpansToWordHitBoxes, type PdfWordHitBox } from "@/app/reader/pdf-overlay-utils"
import { cn } from "@/lib/utils"

interface PdfPageViewportProps {
  canvasRef: RefObject<HTMLCanvasElement | null>
  pageNumber: number
  spans: PdfTextLayerSpan[]
  showOverlayLayer: boolean
  onWordClick?: (box: PdfWordHitBox) => void
  zoom?: number
  className?: string
}

/**
 * Single mounted PDF canvas shared across Split / Page / Overlay modes.
 * Overlay hit targets are siblings so switching tabs does not unmount the canvas.
 */
export function PdfPageViewport({
  canvasRef,
  pageNumber,
  spans,
  showOverlayLayer,
  onWordClick,
  zoom,
  className,
}: PdfPageViewportProps) {
  const wordBoxes = useMemo(() => expandSpansToWordHitBoxes(spans), [spans])

  return (
    <div
      className={cn(
        "flex min-h-[min(320px,45vh)] flex-1 flex-col overflow-auto rounded-[22px] border border-[#cfb796]/50 bg-[#f7efe1]/80 p-3 shadow-inner md:min-h-[min(400px,55vh)] md:p-4",
        className,
      )}
    >
      <div className="relative mx-auto inline-block">
        <canvas
          ref={canvasRef}
          className="block rounded-lg bg-white shadow-[0_18px_48px_rgba(0,0,0,0.16)]"
          aria-label={`PDF page ${pageNumber || 1}`}
        />
        {showOverlayLayer && wordBoxes.length > 0 && onWordClick ? (
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {wordBoxes.map((box, index) => (
              <button
                key={`${box.charStart}-${index}`}
                type="button"
                style={{
                  position: "absolute",
                  left: `${box.leftPct}%`,
                  top: `${box.topPct}%`,
                  width: `${Math.max(box.widthPct, 0.35)}%`,
                  height: `${Math.max(box.heightPct, 1.1)}%`,
                }}
                className="pointer-events-auto cursor-pointer rounded-sm border border-transparent bg-sky-500/0 transition hover:bg-sky-500/20 hover:border-sky-500/30 focus:bg-sky-500/25 focus:outline-none"
                onClick={() => onWordClick(box)}
                title={box.text}
                aria-label={box.text}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
