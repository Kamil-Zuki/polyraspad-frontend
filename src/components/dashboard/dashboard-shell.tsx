"use client"

import { useProjectContext } from "@/contexts/project-context"
import { useDailySummary, useUserSettings, useVocabularyStats } from "@/lib/react-query/queries"
import { AIProactiveWidget } from "./ai-proactive-widget"
import { DailyGoals } from "./daily-goals"
import { RecentDecks } from "./recent-decks"
import { DashboardProgressSection } from "./dashboard-progress-section"
import { DashboardHero } from "./dashboard-hero"
import { AutopilotMissionsCard } from "./autopilot-missions"

export function DashboardShell() {
  const { currentProject } = useProjectContext()
  const projectId = currentProject?.id

  const { data: dailySummary } = useDailySummary(projectId)
  const { data: vocabularyData } = useVocabularyStats(projectId || "")
  const { data: userSettings } = useUserSettings()

  return (
    <div
      data-testid="dashboard-shell"
      className="max-w-7xl mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10 pb-8"
    >
      <DashboardHero />

      {process.env.NEXT_PUBLIC_FF_AI_AGENTS === "true" && (
        <AIProactiveWidget
          dailySummary={dailySummary}
          vocabularyData={vocabularyData}
          userSettings={userSettings}
        />
      )}

      {process.env.NEXT_PUBLIC_FF_AI_AGENTS === "true" && <AutopilotMissionsCard />}

      <DailyGoals />

      <RecentDecks />

      <DashboardProgressSection />
    </div>
  )
}
