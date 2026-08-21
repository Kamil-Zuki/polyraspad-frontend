"use client"

import { useRouter } from "next/navigation"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuotaBarProps {
  /** Human-readable label (e.g. "Vocabulary Cards"). */
  label: string
  /** Current usage count. */
  current: number
  /** Maximum allowed. -1 means unlimited. */
  max: number
  /** Percentage (0-1) at which the bar turns warning color. Default 0.8. */
  warningThreshold?: number
  /** Optional CTA shown when approaching the limit. */
  upgradeHint?: string
  /** Additional CSS class. */
  className?: string
}

export function QuotaBar({
  label,
  current,
  max,
  warningThreshold = 0.8,
  upgradeHint,
  className,
}: QuotaBarProps) {
  const router = useRouter()

  // Unlimited entitlement — no bar needed
  if (max === -1) {
    return (
      <div className={cn("flex items-center justify-between text-xs text-gray-400", className)}>
        <span>{label}</span>
        <span className="text-emerald-400 font-medium">Unlimited</span>
      </div>
    )
  }

  const ratio = max > 0 ? current / max : 0
  const percent = Math.min(ratio * 100, 100)
  const isWarning = ratio >= warningThreshold && ratio < 1
  const isExceeded = ratio >= 1

  const barColor = isExceeded
    ? "bg-red-500"
    : isWarning
      ? "bg-amber-500"
      : "bg-violet-500"

  const textColor = isExceeded
    ? "text-red-400"
    : isWarning
      ? "text-amber-400"
      : "text-gray-400"

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className={cn("font-medium tabular-nums", textColor)}>
          {current.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            barColor
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      {isExceeded && upgradeHint && (
        <button
          type="button"
          onClick={() => router.push("/billing")}
          className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
        >
          <ArrowUpRight className="h-3 w-3" />
          {upgradeHint}
        </button>
      )}
    </div>
  )
}
