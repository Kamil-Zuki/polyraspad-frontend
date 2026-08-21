"use client"

import { useRouter } from "next/navigation"

interface ProjectStatsBannerProps {
  totalTerms?: number
  knownTerms?: number
  learningTerms?: number
  isLoading?: boolean
}

export function ProjectStatsBanner({
  totalTerms,
  knownTerms,
  learningTerms,
  isLoading = false,
}: ProjectStatsBannerProps) {
  const router = useRouter();
  const showStats =
    !isLoading &&
    (totalTerms !== undefined || knownTerms !== undefined || learningTerms !== undefined)
  const displayTotal = totalTerms ?? 0
  const displayMature = knownTerms ?? 0
  const displayLearning = learningTerms ?? 0

  return (
    <div className="mb-8 flex w-full flex-col gap-6 overflow-hidden rounded-2xl border border-app-border bg-gradient-to-r from-app-surface to-app-bg p-5 relative sm:flex-row sm:items-center sm:justify-between md:p-8 md:mb-10">
      {/* Decorative Glow */}
      <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-brand-primary/10 to-transparent pointer-events-none" />

      <div className="z-10 flex flex-wrap items-center gap-6 sm:gap-8 md:gap-12">
        <div>
          <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">Total Terms</div>
          <div className={`text-3xl font-bold text-white tabular-nums tracking-tight ${isLoading ? "animate-pulse bg-white/10 rounded w-20 h-9" : ""}`}>
            {isLoading ? "\u00A0" : displayTotal.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">Known</div>
          <div className="flex items-baseline gap-2">
            <div className={`text-3xl font-bold text-status-success tabular-nums tracking-tight ${isLoading ? "animate-pulse bg-white/10 rounded w-20 h-9" : ""}`}>
              {isLoading ? "\u00A0" : displayMature.toLocaleString()}
            </div>
          </div>
        </div>
        <div>
          <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">Saved</div>
          <div className={`text-3xl font-bold text-brand-secondary tabular-nums tracking-tight ${isLoading ? "animate-pulse bg-white/10 rounded w-16 h-9" : ""}`}>
            {isLoading ? "\u00A0" : displayLearning.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="z-10">
        <button
          onClick={() => router.push("/dashboard#progress")}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg py-2 px-3 transition-colors"
        >
          <i className="fas fa-chart-line" /> View progress
        </button>
      </div>
    </div>
  )
}
