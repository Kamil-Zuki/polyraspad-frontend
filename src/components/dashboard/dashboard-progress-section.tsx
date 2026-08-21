"use client"

import { VocabularyStats } from "@/components/analytics/vocabulary-stats"
import { EnhancedHeatmap } from "@/components/analytics/enhanced-heatmap"
import { StreakHistory } from "@/components/analytics/streak-history"
import { SkillsRadarChart } from "@/components/analytics/skills-radar-chart"
import { useProjectContext } from "@/contexts/project-context"
import { cn } from "@/lib/utils"
import {
  useVocabularyStats,
  useHeatmap,
  useDailySummary,
  useUserSettings,
} from "@/lib/react-query/queries"

export function DashboardProgressSection() {
  const { currentProject } = useProjectContext()
  const currentYear = new Date().getFullYear()

  const { data: vocabularyData, isLoading: vocabularyLoading, error: vocabularyError } =
    useVocabularyStats(currentProject?.id || "")

  const { data: heatmapData, isLoading: heatmapLoading, error: heatmapError } = useHeatmap(
    currentProject?.id,
    currentYear,
    { enabled: !!currentProject?.id },
  )

  const { data: dailySummary } = useDailySummary(currentProject?.id)
  const { data: userSettings } = useUserSettings()

  const totalDays =
    currentYear === heatmapData?.year
      ? Object.keys(heatmapData.activity || {}).length
      : 0

  const longestStreak = userSettings?.maxStreak ?? heatmapData?.longestStreak ?? 0

  const streakData = {
    currentStreak: dailySummary?.currentStreak ?? userSettings?.currentStreak ?? 0,
    longestStreak,
    totalDays,
    streakHistory: [],
  }

  const today = new Date()
  const cutoff30 = new Date(today)
  cutoff30.setDate(cutoff30.getDate() - 30)
  const cutoff30Str = cutoff30.toISOString().slice(0, 10)
  const last30Entries = Object.entries(heatmapData?.activity || {}).filter(
    ([date]) => date >= cutoff30Str,
  )
  const sumCountLast30 = last30Entries.reduce((acc, [, v]) => acc + v.count, 0)
  const avgDailyReviewsLast30 = last30Entries.length ? sumCountLast30 / 30 : 0

  const statusTotal =
    (vocabularyData?.matureCount ?? 0) +
    (vocabularyData?.learningCount ?? 0) +
    (vocabularyData?.newCount ?? 0)
  const chartTotal =
    vocabularyData && vocabularyData.totalTerms > 0
      ? vocabularyData.totalTerms
      : statusTotal

  const retentionPercent =
    vocabularyData && chartTotal > 0
      ? (vocabularyData.matureCount / chartTotal) * 100
      : null

  const studyTimeDisplay =
    heatmapData?.totalTimeSpentSeconds != null
      ? `${(heatmapData.totalTimeSpentSeconds / 3600).toFixed(1)}h`
      : dailySummary?.timeSpentSeconds != null
        ? `${(dailySummary.timeSpentSeconds / 60).toFixed(0)}m today`
        : "—"

  const cardsLoading = heatmapLoading || vocabularyLoading

  return (
    <section id="progress" className="scroll-mt-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <i className="fas fa-chart-line text-brand-primary" />
          Progress
        </h2>
        <p className="text-gray-400 mt-1 text-sm">
          Vocabulary growth, activity, and study metrics
        </p>
      </div>

      {vocabularyLoading ? (
        <div className="glass-panel p-8 rounded-2xl border border-app-border flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : vocabularyError ? (
        <div className="glass-panel p-6 rounded-2xl border border-red-500/30">
          <div className="text-red-400">
            Error loading vocabulary stats:{" "}
            {vocabularyError instanceof Error ? vocabularyError.message : "Unknown error"}
          </div>
        </div>
      ) : vocabularyData ? (
        <VocabularyStats {...vocabularyData} />
      ) : !currentProject ? (
        <div className="glass-panel p-6 rounded-2xl border border-app-border">
          <div className="text-gray-400">Please select a project to view progress</div>
        </div>
      ) : null}

      <div className={cn("grid gap-8", process.env.NEXT_PUBLIC_FF_ADVANCED_MODULES === "true" ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1 lg:grid-cols-2")}>
        {process.env.NEXT_PUBLIC_FF_ADVANCED_MODULES === "true" && <SkillsRadarChart />}
        {heatmapLoading ? (
          <div className="glass-panel p-8 rounded-2xl border border-app-border flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : heatmapError ? (
          <div className="glass-panel p-6 rounded-2xl border border-red-500/30">
            <div className="text-red-400">Error loading heatmap</div>
          </div>
        ) : heatmapData ? (
          <EnhancedHeatmap {...heatmapData} />
        ) : null}
        <StreakHistory {...streakData} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-app-border">
          <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
            Average Daily Reviews
          </div>
          <div className="text-3xl font-bold text-white">
            {cardsLoading ? (
              <span className="inline-block w-12 h-8 bg-app-border/50 rounded animate-pulse" />
            ) : !currentProject ? (
              "—"
            ) : (
              avgDailyReviewsLast30.toFixed(1)
            )}
          </div>
          <div className="text-xs text-gray-500 mt-2">Last 30 days</div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-app-border">
          <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
            Mastery Rate
          </div>
          <div className="text-3xl font-bold text-status-success">
            {cardsLoading ? (
              <span className="inline-block w-12 h-8 bg-app-border/50 rounded animate-pulse" />
            ) : !currentProject || retentionPercent === null ? (
              "—"
            ) : (
              `${retentionPercent.toFixed(0)}%`
            )}
          </div>
          <div className="text-xs text-gray-500 mt-2">Known terms</div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-app-border">
          <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
            Study Time
          </div>
          <div className="text-3xl font-bold text-brand-secondary">
            {cardsLoading ? (
              <span className="inline-block w-12 h-8 bg-app-border/50 rounded animate-pulse" />
            ) : !currentProject ? (
              "—"
            ) : (
              studyTimeDisplay
            )}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {heatmapData?.totalTimeSpentSeconds != null
              ? "Total this year"
              : dailySummary?.timeSpentSeconds != null
                ? "Today"
                : "—"}
          </div>
        </div>
      </div>
    </section>
  )
}
