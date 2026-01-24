"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface ProjectStatsBannerProps {
  totalLemmas?: number
  matureLemmas?: number
  learningLemmas?: number
}

export function ProjectStatsBanner({
  totalLemmas = 2543,
  matureLemmas = 1850,
  learningLemmas = 350,
}: ProjectStatsBannerProps) {
  const router = useRouter();

  return (
    <div className="w-full bg-gradient-to-r from-app-surface to-app-bg border border-app-border rounded-2xl p-8 mb-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-xl">
      {/* Decorative Glow */}
      <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-brand-primary/10 to-transparent pointer-events-none" />
      
      <div className="flex flex-wrap gap-8 md:gap-16 z-10">
        <div>
          <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">Total Lemmas</div>
          <div className="text-3xl font-bold text-white tabular-nums tracking-tight">{totalLemmas.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">Mature (Known)</div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-status-success tabular-nums tracking-tight">{matureLemmas.toLocaleString()}</div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest opacity-60">/ B1</span>
          </div>
        </div>
        <div>
          <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">Learning</div>
          <div className="text-3xl font-bold text-brand-secondary tabular-nums tracking-tight">{learningLemmas.toLocaleString()}</div>
        </div>
      </div>

      <div className="z-10 mt-6 md:mt-0">
        <button 
          onClick={() => router.push('/analytics')}
          className="btn-secondary flex items-center gap-2.5 text-xs py-2.5"
        >
          <i className="fas fa-chart-pie text-brand-primary" /> View Detailed Analytics
        </button>
      </div>
    </div>
  )
}
