"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import { VocabularyStats } from '@/components/analytics/vocabulary-stats';
import { EnhancedHeatmap } from '@/components/analytics/enhanced-heatmap';
import { StreakHistory } from '@/components/analytics/streak-history';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useProjectContext } from '@/contexts/project-context';
import { useVocabularyStats, useHeatmap, useDailySummary, useUserSettings } from '@/lib/react-query/queries';

export default function AnalyticsPage() {
  const router = useRouter();
  const { currentProject } = useProjectContext();
  const currentYear = new Date().getFullYear();

  // Fetch real data from API
  const { data: vocabularyData, isLoading: vocabularyLoading, error: vocabularyError } = useVocabularyStats(
    currentProject?.id || ''
  );

  const { data: heatmapData, isLoading: heatmapLoading, error: heatmapError } = useHeatmap(
    currentProject?.id,
    currentYear,
    { enabled: !!currentProject?.id }
  );

  const { data: dailySummary } = useDailySummary(currentProject?.id);
  const { data: userSettings } = useUserSettings();

  // totalDays = число дней с активностью в текущем году (ключи heatmap.activity)
  const totalDays =
    currentYear === heatmapData?.year
      ? Object.keys(heatmapData.activity || {}).length
      : 0;

  // longestStreak: userSettings.maxStreak с fallback на heatmap.longestStreak
  const longestStreak = userSettings?.maxStreak ?? heatmapData?.longestStreak ?? 0;

  const streakData = {
    currentStreak: dailySummary?.currentStreak ?? userSettings?.currentStreak ?? 0,
    longestStreak,
    totalDays,
    streakHistory: [] // пока пусто по заданию
  };

  // Среднее число повторений за последние 30 дней (сумма count / 30)
  const today = new Date();
  const cutoff30 = new Date(today);
  cutoff30.setDate(cutoff30.getDate() - 30);
  const cutoff30Str = cutoff30.toISOString().slice(0, 10);
  const last30Entries = Object.entries(heatmapData?.activity || {}).filter(
    ([date]) => date >= cutoff30Str
  );
  const sumCountLast30 = last30Entries.reduce((acc, [, v]) => acc + v.count, 0);
  const avgDailyReviewsLast30 = last30Entries.length ? sumCountLast30 / 30 : 0;

  // Retention: matureCount / totalLemmas в процентах
  const retentionPercent =
    vocabularyData && vocabularyData.totalLemmas > 0
      ? (vocabularyData.matureCount / vocabularyData.totalLemmas) * 100
      : null;

  // Время учёбы: heatmap totalTimeSpentSeconds (Xh) или dailySummary (Xm today)
  const studyTimeDisplay =
    heatmapData?.totalTimeSpentSeconds != null
      ? `${(heatmapData.totalTimeSpentSeconds / 3600).toFixed(1)}h`
      : dailySummary?.timeSpentSeconds != null
        ? `${(dailySummary.timeSpentSeconds / 60).toFixed(0)}m today`
        : "—";

  const cardsLoading = heatmapLoading || vocabularyLoading;

  return (
    <ProtectedRoute>
      <div className="flex-1 overflow-y-auto p-8 relative custom-scroll h-full">
        {/* Background Gradient Decoration */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="text-sm text-gray-400 hover:text-white transition flex items-center gap-2 mb-2"
              >
                <i className="fas fa-arrow-left" /> Back
              </button>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <i className="fas fa-chart-line text-brand-primary" />
                Detailed Analytics
              </h1>
              <p className="text-gray-400 mt-2">Comprehensive insights into your learning progress</p>
            </div>
          </div>

          {/* Vocabulary Statistics */}
          {vocabularyLoading ? (
            <div className="glass-panel p-8 rounded-2xl border border-app-border flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : vocabularyError ? (
            <div className="glass-panel p-6 rounded-2xl border border-red-500/30">
              <div className="text-red-400">Error loading vocabulary stats: {vocabularyError instanceof Error ? vocabularyError.message : 'Unknown error'}</div>
            </div>
          ) : vocabularyData ? (
            <VocabularyStats {...vocabularyData} />
          ) : !currentProject ? (
            <div className="glass-panel p-6 rounded-2xl border border-app-border">
              <div className="text-gray-400">Please select a project to view analytics</div>
            </div>
          ) : null}

          {/* Grid: Heatmap & Streaks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

          {/* Additional Stats Cards */}
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
                  avgDailyReviewsLast30
                )}
              </div>
              <div className="text-xs text-gray-500 mt-2">Last 30 days</div>
            </div>
            <div className="glass-panel p-6 rounded-2xl border border-app-border">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                Retention Rate
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
              <div className="text-xs text-gray-500 mt-2">Mature cards</div>
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
        </div>
      </div>
    </ProtectedRoute>
  );
}
