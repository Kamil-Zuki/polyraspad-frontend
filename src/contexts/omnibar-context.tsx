"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import { usePathname } from "next/navigation"

interface OmnibarContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const OmnibarContext = createContext<OmnibarContextValue | undefined>(undefined)

export function OmnibarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isModifier = event.metaKey || event.ctrlKey
      if (isModifier && (event.key === "k" || event.key === "K")) {
        // Avoid opening on the auth page or other public pages where it is not useful.
        if (pathname === "/auth") return
        event.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [pathname])

  // Close palette automatically when the route changes.
  useEffect(() => {
    if (isOpen) setIsOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <OmnibarContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </OmnibarContext.Provider>
  )
}

export function useOmnibar() {
  const context = useContext(OmnibarContext)
  if (context === undefined) {
    throw new Error("useOmnibar must be used within an OmnibarProvider")
  }
  return context
}
