"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export function AiAssistant() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside className={cn(
      "bg-app-surface border-l border-app-border flex flex-col flex-shrink-0 z-10 transition-all duration-300",
      isCollapsed ? "w-12" : "w-96"
    )}>
      <div className="p-4 border-b border-app-border flex justify-between items-center overflow-hidden">
        {!isCollapsed && (
          <span className="text-sm font-bold text-gray-100 flex items-center gap-2 whitespace-nowrap">
            <i className="fas fa-robot text-brand-primary" /> AI Assistant
          </span>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-600 hover:text-white transition w-full flex justify-center"
        >
          <i className={cn("fas", isCollapsed ? "fa-chevron-left" : "fa-chevron-right")} />
        </button>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scroll animate-in fade-in duration-300">
          {/* Context Generator (SR-AI-01) */}
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Context Generator</div>
            <div className="space-y-3">
              <div className="glass-panel p-4 rounded-xl border border-app-border hover:border-brand-primary/50 cursor-pointer transition-all group">
                <p className="text-sm text-gray-100 mb-1.5 font-medium italic">"Success is <span className="text-brand-primary font-bold">inevitable</span>."</p>
                <p className="text-xs text-gray-500">Успех неизбежен.</p>
                <div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-gray-600 group-hover:text-brand-primary flex items-center gap-1.5 transition-colors">
                  <i className="fas fa-plus-circle" /> Use this example
                </div>
              </div>
              <button className="w-full py-2.5 border border-dashed border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand-primary hover:border-brand-primary/50 transition-all">
                Generate more examples
              </button>
            </div>
          </div>

          {/* Grammar Explainer (SR-AI-02) */}
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Grammar Explainer</div>
            <div className="glass-panel p-4 rounded-xl border border-app-border text-sm leading-relaxed">
              <p className="text-gray-400 mb-3">
                <strong className="text-gray-200">Inevitably</strong> is an adverb formed from the adjective <em className="text-brand-secondary">inevitable</em>. It modifies the verb to indicate that something is certain to happen.
              </p>
              <button className="text-[10px] font-bold uppercase tracking-widest text-brand-primary hover:text-white transition-colors flex items-center gap-1.5">
                <i className="fas fa-plus" /> Add to notes
              </button>
            </div>
          </div>

          {/* AI Image/Audio Suggestion */}
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Media Suggestions</div>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-app-bg border border-dashed border-white/10 rounded-xl h-24 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all group">
                <i className="fas fa-image text-lg text-gray-600 group-hover:text-brand-primary transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">Suggest Image</span>
              </div>
              <div className="bg-app-bg border border-dashed border-white/10 rounded-xl h-24 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-secondary/50 hover:bg-brand-secondary/5 transition-all group">
                <i className="fas fa-volume-up text-lg text-gray-600 group-hover:text-brand-secondary transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">Suggest Audio</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
