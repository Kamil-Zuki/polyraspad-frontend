"use client"

import type { ReactNode } from "react"

/**
 * Library workspace chrome (scroll + backdrop). Mirrors ReaderWorkspaceScroll.
 */
export function LibraryWorkspaceScroll({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex-1 overflow-y-auto px-4 py-5 md:px-6 xl:px-8 custom-scroll">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-brand-primary/10 via-brand-secondary/5 to-transparent" />
      {children}
    </div>
  )
}
