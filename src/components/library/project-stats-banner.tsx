"use client"

import { useRouter } from "next/navigation"

interface ProjectStatsBannerProps {
  totalLemmas?: number
  matureLemmas?: number
  learningLemmas?: number
  isLoading?: boolean
}

export function ProjectStatsBanner({
  totalLemmas,
  matureLemmas,
  learningLemmas,
  isLoading = false,
}: ProjectStatsBannerProps) {
  const router = useRouter();
  const showStats = !isLoading && (totalLemmas !== undefined || matureLemmas !== undefined || learningLemmas !== undefined);
  const displayTotal = showStats ? (totalLemmas ?? 0) : 2543;
  const displayMature = showStats ? (matureLemmas ?? 0) : 1850;
  const displayLearning = showStats ? (learningLemmas ?? 0) : 350;

  return (
    <div className="w-full bg-gradient-to-r from-app-surface to-app-bg border border-app-border rounded-2xl p-8 mb-10 relative overflow-hidden flex flex-row items-center justify-between">
      {/* Decorative Glow */}
      <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-brand-primary/10 to-transparent pointer-events-none" />

      <div className="flex flex-row items-center gap-8 md:gap-12 z-10">
        <div>
          <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">Total Lemmas</div>
          <div className={`text-3xl font-bold text-white tabular-nums tracking-tight ${isLoading ? "animate-pulse bg-white/10 rounded w-20 h-9" : ""}`}>
            {isLoading ? "\u00A0" : displayTotal.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">Mature (Known)</div>
          <div className="flex items-baseline gap-2">
            <div className={`text-3xl font-bold text-status-success tabular-nums tracking-tight ${isLoading ? "animate-pulse bg-white/10 rounded w-20 h-9" : ""}`}>
              {isLoading ? "\u00A0" : displayMature.toLocaleString()}
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest opacity-60">/ B1</span>
          </div>
        </div>
        <div>
          <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">Learning</div>
          <div className={`text-3xl font-bold text-brand-secondary tabular-nums tracking-tight ${isLoading ? "animate-pulse bg-white/10 rounded w-16 h-9" : ""}`}>
            {isLoading ? "\u00A0" : displayLearning.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="z-10">
        <button
          onClick={() => router.push("/analytics")}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg py-2 px-3 transition-colors"
        >
          <i className="fas fa-chart-line" /> View Analytics
        </button>
      </div>
    </div>
  )
}
