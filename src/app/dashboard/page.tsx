"use client"

import { DashboardHero } from "@/components/dashboard/dashboard-hero"
import { DailyGoals } from "@/components/dashboard/daily-goals"
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap"
import { RecentDecks } from "@/components/dashboard/recent-decks"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="flex-1 overflow-y-auto p-8 relative custom-scroll h-full">
        {/* Background Gradient Decoration from IA */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-12 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <DashboardHero />
          
          <DailyGoals />
          
          <ActivityHeatmap />
          
          <RecentDecks />
        </div>
      </div>
    </ProtectedRoute>
  )
}
