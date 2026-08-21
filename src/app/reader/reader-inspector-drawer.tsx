"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ReaderInspectorDrawerProps {
  open: boolean
  onClose: () => void
  /** Heading shown when no word selected */
  subtitle?: string
  children: ReactNode
}

/**
 * Slide-over panel for word inspector (Reader). Does not include inner form logic — pass as children.
 */
export function ReaderInspectorDrawer({ open, onClose, subtitle, children }: ReaderInspectorDrawerProps) {
  return (
    <>
      <button
        type="button"
        aria-label={open ? "Dismiss inspector backdrop" : undefined}
        tabIndex={open ? 0 : -1}
        className={cn(
          "fixed inset-0 z-[38] bg-black/55 backdrop-blur-[2px] transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal={open}
        aria-hidden={!open}
        className={cn(
          "fixed inset-y-0 right-0 z-[39] flex w-full max-w-md flex-col border-l border-white/10 bg-[#111723]/98 shadow-[0_0_48px_rgba(0,0,0,0.45)] transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.28em] text-gray-500">Inspector</p>
            <p className="truncate text-sm font-medium text-white">{subtitle ?? "Select a word"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/15"
            aria-label="Close inspector"
          >
            Close
          </button>
        </div>
        <div className="custom-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">{open ? children : null}</div>
      </aside>
    </>
  )
}
