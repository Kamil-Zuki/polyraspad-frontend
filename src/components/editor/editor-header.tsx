"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

export function EditorHeader() {
  return (
    <header className="h-16 glass sticky top-0 z-20 border-b border-app-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
        >
          <i className="fas fa-arrow-left" />
        </Link>
        <div className="h-6 w-px bg-app-border mx-1" />
        <h1 className="text-lg font-bold text-white tracking-tight">Create Card</h1>
        <div className="h-6 w-px bg-app-border mx-1" />
        
        {/* Deck Selector */}
        <div className="relative group">
          <button className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white bg-app-bg px-4 py-2 rounded-xl border border-white/5 hover:border-brand-primary/30 transition-all">
            <i className="fas fa-folder text-brand-primary" />
            <span>English Vocabulary</span>
            <i className="fas fa-chevron-down text-[10px] ml-1 opacity-50" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-status-success shadow-[0_0_8px_#10B981]" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Autosaved</span>
        </div>
        <button className="btn-primary px-8 py-2.5 text-sm shadow-glow shadow-brand-primary/20">
          Save Card
        </button>
      </div>
    </header>
  )
}
