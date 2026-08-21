import React from 'react';

interface StreakHistoryProps {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  streakHistory: Array<{
    startDate: string;
    endDate: string;
    days: number;
  }>;
}

export function StreakHistory({
  currentStreak,
  longestStreak,
  totalDays,
  streakHistory
}: StreakHistoryProps) {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-app-border">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <i className="fas fa-fire text-orange-400" /> Streak History
      </h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
            Current Streak
          </div>
          <div className="text-3xl font-bold text-orange-400 flex items-center justify-center gap-2">
            <i className="fas fa-fire text-sm animate-pulse" />
            {currentStreak}
          </div>
          <div className="text-xs text-gray-500 mt-1">days</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
            Longest Streak
          </div>
          <div className="text-3xl font-bold text-white">
            {longestStreak}
          </div>
          <div className="text-xs text-gray-500 mt-1">days</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
            Total Days
          </div>
          <div className="text-3xl font-bold text-brand-primary">
            {totalDays}
          </div>
          <div className="text-xs text-gray-500 mt-1">active</div>
        </div>
      </div>

      {/* Streak Timeline */}
      <div className="mt-6 pt-6 border-t border-app-border">
        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-4">
          Recent Streaks
        </div>
        {!streakHistory || streakHistory.length === 0 ? (
          <div className="p-4 rounded-xl bg-app-bg/40 border border-app-border/60 text-center">
            <p className="text-xs text-gray-400">No past streak records yet.</p>
            <p className="text-[11px] text-gray-500 mt-1">Study consecutive days to build up your streak history!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {streakHistory.slice(0, 5).map((streak, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-app-bg/50 rounded-lg border border-app-border hover:border-brand-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                    {streak.days}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      {streak.days} day{streak.days !== 1 ? 's' : ''} streak
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(streak.startDate).toLocaleDateString()} - {new Date(streak.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {index === 0 && (
                  <span className="px-2 py-1 rounded bg-brand-primary/20 text-brand-primary text-[10px] font-bold uppercase">
                    Active
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
