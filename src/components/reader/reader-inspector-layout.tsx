"use client"

import type { ReactNode } from "react"
import { useLayoutEffect, useState } from "react"
import { ReaderInspectorDrawer } from "@/app/reader/reader-inspector-drawer"
import { cn } from "@/lib/utils"

interface ReaderInspectorLayoutProps {
  drawerOpen: boolean
  onDrawerClose: () => void
  subtitle?: string
  showDesktopPanel: boolean
  children: ReactNode
}

function useDesktopInspectorLayout() {
  const [isDesktop, setIsDesktop] = useState(false)

  useLayoutEffect(() => {
    if (typeof window.matchMedia !== "function") {
      setIsDesktop(false)
      return
    }
    const media = window.matchMedia("(min-width: 1280px)")
    const update = () => setIsDesktop(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return isDesktop
}

/**
 * Desktop: fixed-height sticky column with internal scroll. Mobile/tablet: slide-over drawer.
 */
export function ReaderInspectorLayout({
  drawerOpen,
  onDrawerClose,
  subtitle,
  showDesktopPanel,
  children,
}: ReaderInspectorLayoutProps) {
  const isDesktop = useDesktopInspectorLayout()

  if (isDesktop) {
    return (
      <aside
        className={cn(
          "sticky top-4 flex max-h-[calc(100dvh-5rem)] min-h-0 shrink-0 flex-col self-start overflow-hidden rounded-[28px] border border-white/10 bg-[#111723]/95 shadow-[0_24px_60px_rgba(0,0,0,0.28)]",
          showDesktopPanel ? "w-[min(380px,32vw)]" : "w-0 border-0 p-0 opacity-0 pointer-events-none",
        )}
        aria-hidden={!showDesktopPanel}
      >
        {showDesktopPanel ? (
          <>
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 pb-3 pt-4">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.28em] text-gray-500">Inspector</p>
                <p className="truncate text-sm font-medium text-white">{subtitle ?? "Select a word"}</p>
              </div>
              <button
                type="button"
                onClick={onDrawerClose}
                className="shrink-0 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/15"
                aria-label="Close inspector"
              >
                Close
              </button>
            </div>
            <div className="custom-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
          </>
        ) : null}
      </aside>
    )
  }

  return (
    <ReaderInspectorDrawer open={drawerOpen} onClose={onDrawerClose} subtitle={subtitle}>
      {children}
    </ReaderInspectorDrawer>
  )
}
