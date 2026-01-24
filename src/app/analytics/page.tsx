"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import { VocabularyStats } from '@/components/analytics/vocabulary-stats';
import { EnhancedHeatmap } from '@/components/analytics/enhanced-heatmap';
import { StreakHistory } from '@/components/analytics/streak-history';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function AnalyticsPage() {
  const router = useRouter();

  // Mock data - в реальном приложении будет загружаться через API
  const vocabularyData = {
    totalLemmas: 5000,
    matureCount: 2100,
    learningCount: 450,
    newCount: 150,
    cefrLevel: {
      code: 'B1',
      title: 'Intermediate',
      progressPercent: 5
    },
    estimatedFluency: 65
  };

  const heatmapData = {
    year: 2025,
    totalReviews: 15000,
    activity: {
      '2025-01-15': { count: 50, level: 3 },
      '2025-01-16': { count: 80, level: 4 },
      '2025-01-17': { count: 30, level: 2 },
      '2025-01-18': { count: 100, level: 4 },
      '2025-01-19': { count: 20, level: 1 },
      '2025-01-20': { count: 60, level: 3 },
      '2025-01-21': { count: 40, level: 2 },
    }
  };

  const streakData = {
    currentStreak: 12,
    longestStreak: 45,
    totalDays: 180,
    streakHistory: [
      {
        startDate: '2025-01-10',
        endDate: new Date().toISOString().split('T')[0],
        days: 12
      },
      {
        startDate: '2024-11-01',
        endDate: '2024-12-20',
        days: 50
      },
      {
        startDate: '2024-09-15',
        endDate: '2024-10-05',
        days: 21
      }
    ]
  };

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
          <VocabularyStats {...vocabularyData} />

          {/* Grid: Heatmap & Streaks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <EnhancedHeatmap {...heatmapData} />
            <StreakHistory {...streakData} />
          </div>

          {/* Additional Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-app-border">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                Average Daily Reviews
              </div>
              <div className="text-3xl font-bold text-white">42</div>
              <div className="text-xs text-gray-500 mt-2">Last 30 days</div>
            </div>
            <div className="glass-panel p-6 rounded-2xl border border-app-border">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                Retention Rate
              </div>
              <div className="text-3xl font-bold text-status-success">94%</div>
              <div className="text-xs text-gray-500 mt-2">Mature cards</div>
            </div>
            <div className="glass-panel p-6 rounded-2xl border border-app-border">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                Study Time
              </div>
              <div className="text-3xl font-bold text-brand-secondary">127h</div>
              <div className="text-xs text-gray-500 mt-2">Total this year</div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
