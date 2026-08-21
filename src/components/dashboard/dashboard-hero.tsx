"use client";

import { useAuth } from "@/contexts/auth-context";
import { useUserSettings } from "@/lib/react-query/queries";
import { useTranslations } from "next-intl";

function getTimeGreetingKey(): "goodMorning" | "goodAfternoon" | "goodEvening" {
  const hour = new Date().getHours();
  if (hour < 12) return "goodMorning";
  if (hour < 18) return "goodAfternoon";
  return "goodEvening";
}

export function DashboardHero() {
  const t = useTranslations("dashboard");
  const { user } = useAuth();
  const { data: userSettings, isLoading: settingsLoading } = useUserSettings();

  const userName = user?.userName || user?.email?.split("@")[0] || "User";
  const greetingKey = getTimeGreetingKey();
  const greeting = t(greetingKey);
  const streak = userSettings?.currentStreak ?? 0;

  if (settingsLoading) {
    return (
      <section className="relative z-10 space-y-2">
        <div className="h-10 w-64 bg-app-surface/60 rounded-xl animate-pulse" />
        <div className="h-5 w-48 bg-app-surface/40 rounded-lg animate-pulse" />
      </section>
    );
  }

  return (
    <section className="relative z-10">
      <h1 className="text-4xl font-bold text-white mb-2 leading-tight">
        {greeting}, {userName}
      </h1>
      <p className="text-gray-500 text-sm font-medium">
        {streak > 0 ? (
          <>
            {t.rich("streakText", {
              count: streak,
              span: (chunks) => <span className="text-brand-primary font-bold">{chunks}</span>
            })}
          </>
        ) : (
          <>
            {t.rich("startStreak", {
              span: (chunks) => <span className="text-brand-primary font-bold">{chunks}</span>
            })}
          </>
        )}
      </p>
    </section>
  );
}

