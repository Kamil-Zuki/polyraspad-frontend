"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export function EditorForm() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 relative z-10 py-12 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. Sentence (Front) */}
      <section className="glass-panel p-8 rounded-3xl border-app-border">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Front (Sentence)</label>
        <div className="relative group">
          <textarea 
            className="input-dark w-full p-5 rounded-2xl text-xl min-h-[140px] resize-none leading-relaxed" 
            placeholder="Type or paste your sentence here..."
          />
          <div className="absolute bottom-4 right-4 text-[10px] font-bold uppercase tracking-widest text-gray-600 group-focus-within:text-brand-primary transition-colors">
            Highlight word to set Target
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4 leading-relaxed">
          Example: "He decided to <strong className="text-brand-primary font-bold">address</strong> the issue."
        </p>
      </section>

      {/* 2. Target & Translation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="glass-panel p-8 rounded-3xl border-app-border">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Target Word</label>
          <input 
            type="text" 
            className="input-dark w-full p-4 rounded-xl font-bold text-white" 
            defaultValue="address" 
            placeholder="Auto-filled..." 
          />
          <p className="text-[10px] text-gray-500 mt-3 font-medium uppercase tracking-wider">Focus word for this card</p>
        </section>
        
        <section className="glass-panel p-8 rounded-3xl border-app-border">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Back (Meaning)</label>
            <button className="text-[10px] font-bold uppercase tracking-widest text-brand-primary hover:text-white transition-colors flex items-center gap-1.5">
              <i className="fas fa-magic" /> AI Translate
            </button>
          </div>
          <input 
            type="text" 
            className="input-dark w-full p-4 rounded-xl text-white" 
            defaultValue="заняться (проблемой)" 
            placeholder="Translation..." 
          />
          <p className="text-[10px] text-gray-500 mt-3 font-medium uppercase tracking-wider">Translation in context</p>
        </section>
      </div>

      {/* 3. Media (Anki Style) */}
      <section className="glass-panel p-8 rounded-3xl border-app-border">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Media Attachments</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Image Dropzone */}
          <div className="bg-app-bg border-2 border-dashed border-white/5 rounded-2xl h-36 flex flex-col items-center justify-center cursor-pointer group hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-app-surface border border-white/5 flex items-center justify-center mb-3 text-gray-600 group-hover:text-brand-primary group-hover:shadow-glow group-hover:bg-brand-primary/10 transition-all">
              <i className="fas fa-image text-lg" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-white">Drop image or Paste</span>
          </div>

          {/* Audio Dropzone */}
          <div className="bg-app-bg border-2 border-dashed border-white/5 rounded-2xl h-36 flex flex-col items-center justify-center cursor-pointer group hover:border-brand-secondary/50 hover:bg-brand-secondary/5 transition-all duration-300 relative">
            <div className="w-12 h-12 rounded-full bg-app-surface border border-white/5 flex items-center justify-center mb-3 text-gray-600 group-hover:text-brand-secondary group-hover:shadow-glow group-hover:bg-brand-secondary/10 transition-all">
              <i className="fas fa-microphone text-lg" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-white">Upload or Record</span>
            
            {/* Auto TTS Toggle */}
            <label className="absolute top-3 right-3 flex items-center gap-2 cursor-pointer bg-app-surface px-2.5 py-1.5 rounded-lg border border-white/5 shadow-lg group/tts">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider group-hover/tts:text-brand-primary transition-colors">Auto TTS</span>
              <div className="relative">
                <input type="checkbox" defaultChecked className="peer sr-only" />
                <div className="w-7 h-4 bg-gray-700 rounded-full peer peer-checked:bg-brand-primary transition-colors" />
                <div className="absolute left-1 top-1 w-2 h-2 bg-white rounded-full transition-transform peer-checked:translate-x-3" />
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* 4. Source Information */}
      <section className="glass-panel p-8 rounded-3xl border-app-border">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Source Information</label>
        <div className="space-y-4">
          <div className="bg-app-bg p-5 rounded-2xl border border-white/5 flex items-center gap-4 group">
            <div className="w-12 h-12 bg-red-600/10 text-red-500 rounded-xl flex items-center justify-center border border-red-500/20 shadow-lg">
              <i className="fab fa-youtube text-2xl" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">YouTube Video</div>
              <div className="text-sm text-white font-bold truncate">Kurzgesagt – In a Nutshell: Why we do what we do</div>
              <div className="text-[10px] text-gray-400 font-medium">Timestamp: 04:20</div>
            </div>
            <button className="text-gray-600 hover:text-white transition-colors p-2">
              <i className="fas fa-times" />
            </button>
          </div>
          <button className="w-full py-3.5 bg-app-bg hover:bg-app-hover border border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-all flex items-center justify-center gap-2">
            <i className="fas fa-plus" /> Add Source Reference
          </button>
        </div>
      </section>
    </div>
  )
}
