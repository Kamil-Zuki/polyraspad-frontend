import React from 'react';

interface HeatmapData {
  date: string;
  count: number;
  level: number; // 0-4 intensity
}

interface EnhancedHeatmapProps {
  year: number;
  totalReviews: number;
  activity: Record<string, { count: number; level: number }>;
}

export function EnhancedHeatmap({ year, totalReviews, activity }: EnhancedHeatmapProps) {
  // Generate all days of the year
  const generateYearDays = () => {
    const days: { date: Date; dateStr: string }[] = [];
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      days.push({ date: new Date(d), dateStr });
    }
    return days;
  };

  const days = generateYearDays();
  const weeks: { date: Date; dateStr: string }[][] = [];
  
  // Group days into weeks
  let currentWeek: { date: Date; dateStr: string }[] = [];
  days.forEach((day, index) => {
    if (day.date.getDay() === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [day];
    } else {
      currentWeek.push(day);
    }
    if (index === days.length - 1 && currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
  });

  const getIntensityClass = (level: number) => {
    const classes = [
      'bg-app-hover', // level 0
      'bg-brand-primary/20', // level 1
      'bg-brand-primary/50', // level 2
      'bg-brand-primary/80', // level 3
      'bg-brand-primary shadow-[0_0_4px_rgba(139,92,246,0.5)]', // level 4
    ];
    return classes[level] || classes[0];
  };

  const getDayData = (dateStr: string) => {
    return activity[dateStr] || { count: 0, level: 0 };
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

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => {
                const dayData = getDayData(day.dateStr);
                const isToday = day.dateStr === new Date().toISOString().split('T')[0];
                
                return (
                  <div
                    key={day.dateStr}
                    className={`w-3 h-3 rounded-sm transition-all hover:scale-125 hover:z-10 relative ${
                      getIntensityClass(dayData.level)
                    } ${isToday ? 'ring-2 ring-brand-primary ring-offset-2 ring-offset-app-bg' : ''}`}
                    title={`${day.dateStr}: ${dayData.count} reviews`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
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
