"use client"

import { cn } from "@/lib/utils"

export type ShadowingRating = 1 | 2 | 3

interface ShadowingRatingProps {
  value?: ShadowingRating | null
  onChange: (value: ShadowingRating) => void
  disabled?: boolean
}

const OPTIONS: { value: ShadowingRating; label: string; description: string; className: string }[] = [
  {
    value: 1,
    label: "Bad",
    description: "Hard to pronounce, need more practice",
    className: "border-rose-500/30 text-rose-200 hover:bg-rose-500/20 data-[selected]:bg-rose-500 data-[selected]:text-white",
  },
  {
    value: 2,
    label: "Okay",
    description: "Mostly right, a bit shaky",
    className: "border-amber-500/30 text-amber-200 hover:bg-amber-500/20 data-[selected]:bg-amber-500 data-[selected]:text-white",
  },
  {
    value: 3,
    label: "Good",
    description: "Comfortable and clear",
    className: "border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/20 data-[selected]:bg-emerald-500 data-[selected]:text-white",
  },
]

export function ShadowingRating({ value, onChange, disabled }: ShadowingRatingProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-3", disabled && "opacity-60 pointer-events-none")}>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          aria-disabled={disabled}
          onClick={() => onChange(option.value)}
          data-selected={value === option.value ? "1" : undefined}
          className={cn(
            "flex flex-col items-center rounded-2xl border px-4 py-4 text-center transition disabled:opacity-50 disabled:pointer-events-none",
            option.className
          )}
        >
          <span className="text-lg font-bold">{option.label}</span>
          <span className="mt-1 text-xs opacity-80">{option.description}</span>
        </button>
      ))}
    </div>
  )
}
