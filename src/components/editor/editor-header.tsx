"use client"

import { useRouter } from "next/navigation"
import { Eye } from "lucide-react"
import { cn } from "@/lib/utils"

interface EditorHeaderProps {
  isPreviewMode?: boolean
  onTogglePreview?: () => void
}

export function EditorHeader({ isPreviewMode, onTogglePreview }: EditorHeaderProps) {
  const router = useRouter()

  return (
    <header className="h-16 glass sticky top-0 z-20 border-b border-app-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back()
            } else {
              router.push("/dashboard")
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-app-bg border border-white/10 text-gray-300 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all"
          title="Назад"
          aria-label="Назад"
        >
          <i className="fas fa-arrow-left text-sm" />
          <span className="text-sm font-medium">Назад</span>
        </button>
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
        {onTogglePreview != null && (
          <button
            type="button"
            onClick={onTogglePreview}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all",
              isPreviewMode
                ? "bg-brand-primary/20 border-brand-primary/50 text-white"
                : "bg-app-bg border-white/10 text-gray-400 hover:text-white hover:border-white/20",
            )}
            title="Preview Mode"
            aria-label="Toggle preview"
          >
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Preview</span>
          </button>
        )}
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
