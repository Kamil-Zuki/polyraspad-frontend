"use client"

import { cn } from "@/lib/utils"

interface ReaderPageTurnZonesProps {
  enabled: boolean
  onPrevious: () => void
  onNext: () => void
  /** Offset from right when desktop inspector is open */
  inspectorOpen?: boolean
}

/** Invisible left/right click targets for page navigation while reading. */
export function ReaderPageTurnZones({
  enabled,
  onPrevious,
  onNext,
  inspectorOpen = false,
}: ReaderPageTurnZonesProps) {
  if (!enabled) return null

  return (
    <>
      <button
        type="button"
        aria-label="Previous page"
        className="pointer-events-auto fixed left-0 top-20 z-[30] hidden h-[calc(100vh-5rem)] w-[min(56px,6vw)] cursor-default bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary/40 md:block"
        onClick={onPrevious}
      />
      <button
        type="button"
        aria-label="Next page"
        className={cn(
          "pointer-events-auto fixed top-20 z-[30] hidden h-[calc(100vh-5rem)] w-[min(56px,6vw)] cursor-default bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary/40 md:block",
          inspectorOpen ? "right-[min(380px,32vw)]" : "right-0",
        )}
        onClick={onNext}
      />
    </>
  )
}
