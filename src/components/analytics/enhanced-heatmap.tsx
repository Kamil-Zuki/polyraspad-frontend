"use client";

import React, { useMemo, useState } from "react";

interface EnhancedHeatmapProps {
  year: number;
  totalReviews: number;
  activity: Record<string, { count: number; level: number }>;
}

function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTooltipDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatReviewCount(count: number) {
  return count === 0
    ? "No reviews"
    : `${count} review${count === 1 ? "" : "s"}`;
}

export function EnhancedHeatmap({ year, totalReviews, activity }: EnhancedHeatmapProps) {
  const todayKey = formatLocalDateKey(new Date());
  const defaultDateStr = year === new Date().getFullYear() ? todayKey : `${year}-01-01`;
  const [hoveredDateStr, setHoveredDateStr] = useState<string | null>(null);

  const days = useMemo(() => {
    const result: { date: Date; dateStr: string }[] = [];
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      result.push({ date: new Date(d), dateStr: formatLocalDateKey(d) });
    }
    return result;
  }, [year]);

  const weeks = useMemo(() => {
    const grouped: { date: Date; dateStr: string }[][] = [];
    let currentWeek: { date: Date; dateStr: string }[] = [];
    days.forEach((day, index) => {
      if (day.date.getDay() === 0 && currentWeek.length > 0) {
        grouped.push(currentWeek);
        currentWeek = [day];
      } else {
        currentWeek.push(day);
      }
      if (index === days.length - 1 && currentWeek.length > 0) {
        grouped.push(currentWeek);
      }
    });
    return grouped;
  }, [days]);

  const getDayData = (dateStr: string) => activity[dateStr] || { count: 0, level: 0 };

  const activeDateStr = hoveredDateStr ?? defaultDateStr;
  const activeDayData = getDayData(activeDateStr);

  const getIntensityClass = (level: number) => {
    const classes = [
      "bg-app-hover",
      "bg-brand-primary/20",
      "bg-brand-primary/50",
      "bg-brand-primary/80",
      "bg-brand-primary shadow-[0_0_4px_rgba(139,92,246,0.5)]",
    ];
    return classes[level] || classes[0];
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-app-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <i className="fas fa-calendar-alt text-brand-secondary" /> Activity Heatmap {year}
        </h3>
        <div className="text-sm text-gray-400">
          <span className="text-white font-bold">{totalReviews.toLocaleString()}</span> total reviews
        </div>
      </div>

      <div
        className="mb-3 min-h-[1.25rem] text-sm text-gray-300"
        aria-live="polite"
      >
        <span className="font-medium text-white">{formatTooltipDate(activeDateStr)}</span>
        {" — "}
        {formatReviewCount(activeDayData.count)}
      </div>

      <div
        className="overflow-x-auto pb-4"
        onMouseLeave={() => setHoveredDateStr(null)}
      >
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day) => {
                const dayData = getDayData(day.dateStr);
                const isToday = day.dateStr === todayKey;

                return (
                  <div
                    key={day.dateStr}
                    role="img"
                    aria-label={`${formatTooltipDate(day.dateStr)}: ${dayData.count} reviews`}
                    className={`w-3 h-3 rounded-sm transition-all hover:scale-125 hover:z-10 relative cursor-default ${getIntensityClass(
                      dayData.level
                    )} ${isToday ? "ring-2 ring-brand-primary ring-offset-2 ring-offset-app-bg" : ""}`}
                    onMouseEnter={() => setHoveredDateStr(day.dateStr)}
                    onFocus={() => setHoveredDateStr(day.dateStr)}
                    onBlur={() => setHoveredDateStr(null)}
                    tabIndex={0}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-app-border">
        <div className="text-xs text-gray-500">Less</div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-app-hover" />
          <div className="w-3 h-3 rounded-sm bg-brand-primary/20" />
          <div className="w-3 h-3 rounded-sm bg-brand-primary/50" />
          <div className="w-3 h-3 rounded-sm bg-brand-primary/80" />
          <div className="w-3 h-3 rounded-sm bg-brand-primary shadow-[0_0_4px_rgba(139,92,246,0.5)]" />
        </div>
        <div className="text-xs text-gray-500">More</div>
      </div>
    </div>
  );
}
