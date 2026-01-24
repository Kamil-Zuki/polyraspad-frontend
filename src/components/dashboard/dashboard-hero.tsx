"use client"

import { useAuth } from "@/contexts/auth-context"

export function DashboardHero() {
  const { user } = useAuth()
  const userName = user?.userName || user?.email?.split('@')[0] || "Kamil"

  return (
    <section className="flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2 leading-tight">
          Good Evening, {userName}
        </h1>
        <p className="text-gray-500 text-sm font-medium">
          You're on a <span className="text-brand-primary font-bold">12-day streak</span>! Keep the momentum going.
        </p>
      </div>
      
      <div className="flex gap-4">
        {/* Quick Stats from IA */}
        <div className="px-6 py-4 bg-app-surface/60 backdrop-blur-md border border-white/5 rounded-2xl flex flex-col items-center min-w-[140px] shadow-xl">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Vocabulary Size</span>
          <strong className="text-white text-2xl font-bold">2,540</strong>
        </div>
        <div className="px-6 py-4 bg-app-surface/60 backdrop-blur-md border border-white/5 rounded-2xl flex flex-col items-center min-w-[140px] shadow-xl">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Retention</span>
          <strong className="text-status-success text-2xl font-bold">94%</strong>
        </div>
      </div>
    </section>
  )
}
