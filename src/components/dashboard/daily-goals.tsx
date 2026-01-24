"use client"

import { cn } from "@/lib/utils"

export function DailyGoals() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Goal: Reviews */}
      <div className="glass-panel p-6 rounded-2xl border-app-border relative overflow-hidden group hover:border-brand-secondary/30 transition-all duration-300">
        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
          <i className="fas fa-sync-alt text-7xl text-brand-secondary" />
        </div>
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <div className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest mb-1">Reviews</div>
            <div className="text-3xl font-bold text-white">45 <span className="text-sm text-gray-500 font-normal">/ 100</span></div>
          </div>
        </div>
        <div className="w-full bg-app-bg h-1.5 rounded-full overflow-hidden relative z-10">
          <div 
            className="bg-brand-secondary h-full w-[45%] shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-700" 
          />
        </div>
        <div className="mt-4 text-xs text-gray-500 relative z-10">
          55 cards remaining to maintain memory.
        </div>
      </div>

      {/* Goal: New Words */}
      <div className="glass-panel p-6 rounded-2xl border-app-border relative overflow-hidden group hover:border-brand-primary/30 transition-all duration-300">
        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
          <i className="fas fa-plus-circle text-7xl text-brand-primary" />
        </div>
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <div className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1">New Words</div>
            <div className="text-3xl font-bold text-white">13 <span className="text-sm text-gray-500 font-normal">/ 20</span></div>
          </div>
          <div className="w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center border border-brand-primary/30">
            <i className="fas fa-check text-xs" />
          </div>
        </div>
        <div className="w-full bg-app-bg h-1.5 rounded-full overflow-hidden relative z-10">
          <div 
            className="bg-brand-primary h-full w-[65%] shadow-[0_0_10px_rgba(139,92,246,0.5)] transition-all duration-700" 
          />
        </div>
        <div className="mt-4 text-xs text-gray-500 relative z-10">
          Great pace! 7 more to reach daily target.
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-app-border group cursor-pointer shadow-lg hover:shadow-brand-primary/10 transition-all duration-500">
        <img 
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition duration-700"
          alt="Study Background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-app-bg/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-6 w-full">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 bg-brand-pink/20 text-brand-pink text-[10px] font-bold rounded uppercase backdrop-blur-md border border-brand-pink/30 tracking-widest">
              Continue
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">English Idioms</h3>
          <p className="text-xs text-gray-400 mb-5">You stopped at card #142</p>
          <button className="bg-white text-app-bg px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all active:scale-95 shadow-xl">
            Resume Session
          </button>
        </div>
      </div>
    </section>
  )
}
