"use client"

import { cn } from "@/lib/utils"

export function ActivityHeatmap() {
  // Generating fake intensity levels for the heatmap
  const cells = Array.from({ length: 300 }, () => 
    Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0
  )

  return (
    <section className="glass-panel p-6 rounded-2xl border-app-border relative overflow-hidden">
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Activity Log</h3>
        <div className="flex gap-3 text-[10px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-app-hover" />
            <span className="text-gray-500">Less</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-brand-primary shadow-[0_0_8px_rgba(139,92,246,0.4)]" />
            <span className="text-gray-500">More</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-2 custom-scroll relative z-10">
        <div className="grid grid-rows-7 grid-flow-col gap-1 min-w-[600px]">
          {cells.map((intensity, i) => (
            <div
              key={i}
              className={cn(
                "w-[10px] h-[10px] rounded-[2px] transition-all duration-300 hover:scale-125 cursor-pointer",
                intensity === 0 && "bg-app-hover",
                intensity === 1 && "bg-brand-primary/20",
                intensity === 2 && "bg-brand-primary/50",
                intensity === 3 && "bg-brand-primary/80",
                intensity === 4 && "bg-brand-primary shadow-[0_0_5px_#8B5CF6]"
              )}
              title={`Activity: ${intensity}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
