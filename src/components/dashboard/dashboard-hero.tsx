"use client";

import { useAuth } from "@/contexts/auth-context";
import { useProjectContext } from "@/contexts/project-context";
import { useUserSettings, useVocabularyStats } from "@/lib/react-query/queries";

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export function DashboardHero() {
  const { user } = useAuth();
  const { currentProject } = useProjectContext();
  const { data: userSettings, isLoading: settingsLoading } = useUserSettings();
  const { data: vocabularyStats, isLoading: statsLoading } = useVocabularyStats(
    currentProject?.id ?? "",
  );

  const userName = user?.userName || user?.email?.split("@")[0] || "User";
  const greeting = getTimeGreeting();
  const streak = userSettings?.currentStreak ?? 0;
  const vocabularySize = vocabularyStats?.totalLemmas ?? 0;
  const retention = vocabularyStats?.estimatedFluency ?? 0;
  const isLoading = settingsLoading || (!!currentProject?.id && statsLoading);

  if (isLoading) {
    return (
      <section className="flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
        <div className="space-y-2">
          <div className="h-10 w-64 bg-app-surface/60 rounded-xl animate-pulse" />
          <div className="h-5 w-48 bg-app-surface/40 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-4">
          <div className="px-6 py-4 bg-app-surface/60 border border-white/5 rounded-2xl min-w-[140px] h-[72px] animate-pulse" />
          <div className="px-6 py-4 bg-app-surface/60 border border-white/5 rounded-2xl min-w-[140px] h-[72px] animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2 leading-tight">
          {greeting}, {userName}
        </h1>
        <p className="text-gray-500 text-sm font-medium">
          {streak > 0 ? (
            <>
              You're on a{" "}
              <span className="text-brand-primary font-bold">
                {streak}-day streak
              </span>
              ! Keep the momentum going.
            </>
          ) : (
            <>
              <span className="text-brand-primary font-bold">Start your streak</span> today — study to keep it going!
            </>
          )}
        </p>
      </div>

      <div className="flex gap-4">
        <div className="px-6 py-4 bg-app-surface/60 backdrop-blur-md border border-white/5 rounded-2xl flex flex-col items-center min-w-[140px] shadow-xl">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
            Vocabulary Size
          </span>
          <strong className="text-white text-2xl font-bold">
            {currentProject ? vocabularySize : "—"}
          </strong>
        </div>
        <div className="px-6 py-4 bg-app-surface/60 backdrop-blur-md border border-white/5 rounded-2xl flex flex-col items-center min-w-[140px] shadow-xl">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
            Retention
          </span>
          <strong className="text-status-success text-2xl font-bold">
            {currentProject ? `${Math.round(retention)}%` : "—"}
          </strong>
        </div>
      </div>
    </section>
  );
}
