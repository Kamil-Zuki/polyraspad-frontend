"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ReaderResizableSplitProps {
  left: ReactNode
  right: ReactNode
  /** Initial left column fraction (0.45–0.72) */
  initialRatio?: number
  storageKey?: string
  className?: string
  minRatio?: number
  maxRatio?: number
}

export function ReaderResizableSplit({
  left,
  right,
  initialRatio = 0.55,
  storageKey,
  className,
  minRatio = 0.45,
  maxRatio = 0.72,
}: ReaderResizableSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ratio, setRatio] = useState(() => {
    if (typeof window === "undefined" || !storageKey) return initialRatio
    const stored = Number.parseFloat(window.localStorage.getItem(storageKey) ?? "")
    if (Number.isFinite(stored) && stored >= minRatio && stored <= maxRatio) return stored
    return initialRatio
  })
  const draggingRef = useRef(false)

  const persistRatio = useCallback(
    (value: number) => {
      const clamped = Math.min(maxRatio, Math.max(minRatio, value))
      setRatio(clamped)
      if (storageKey && typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, String(clamped))
      }
    },
    [maxRatio, minRatio, storageKey],
  )

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (!draggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const next = (event.clientX - rect.left) / rect.width
      persistRatio(next)
    }
    const onUp = () => {
      draggingRef.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [persistRatio])

  const startDrag = () => {
    draggingRef.current = true
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex min-h-[min(520px,70vh)] w-full flex-col gap-4 lg:min-h-[min(640px,78vh)] lg:flex-row lg:items-stretch",
        className,
      )}
    >
      <div
        className="flex min-h-[min(320px,45vh)] min-w-0 flex-col lg:min-h-0 lg:shrink-0"
        style={{ flex: `1 1 ${Math.round(ratio * 100)}%` }}
      >
        {left}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(ratio * 100)}
        tabIndex={0}
        onMouseDown={startDrag}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") persistRatio(ratio - 0.05)
          if (e.key === "ArrowRight") persistRatio(ratio + 0.05)
        }}
        className="relative z-10 hidden shrink-0 cursor-col-resize items-center justify-center lg:flex lg:w-3"
      >
        <div className="h-16 w-1 rounded-full bg-[#8b6c47]/35" />
      </div>
      <div
        className="flex min-h-[min(280px,40vh)] min-w-0 flex-1 flex-col lg:min-h-0"
        style={{ flex: `1 1 ${Math.round((1 - ratio) * 100)}%` }}
      >
        {right}
      </div>
    </div>
  )
}
