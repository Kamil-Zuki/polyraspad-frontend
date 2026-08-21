import React from "react"
import { cn } from "@/lib/utils"
import { AlertTriangle, Music, ImageIcon, Search } from "lucide-react"

export type QuickView = "search" | "leeches" | "missing-audio" | "missing-image"

export interface CardsToolbarProps {
  searchQuery: string
  setSearchQuery: (val: string) => void
  onSearch: (e: React.FormEvent) => void
  selectedDeckId: string | undefined
  setSelectedDeckId: (id: string | undefined) => void
  availableDecks: { id: string; title: string; depth: number }[]
  deckSelectDisabled: boolean
  selectedSrsStatuses: string[]
  setSelectedSrsStatuses: (val: string[]) => void
  quickView: QuickView
  onQuickView: (v: QuickView) => void
}

export function CardsToolbar({
  searchQuery,
  setSearchQuery,
  onSearch,
  selectedDeckId,
  setSelectedDeckId,
  availableDecks,
  deckSelectDisabled,
  selectedSrsStatuses,
  setSelectedSrsStatuses,
  quickView,
  onQuickView,
}: CardsToolbarProps) {
  return (
    <form onSubmit={onSearch} className="glass-panel rounded-xl border border-app-border p-6 space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cards by term, context or translation..."
            className="input-dark w-full"
          />
        </div>
        <button type="submit" className="btn-primary">
          Search
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-app-border">
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
            Deck
          </label>
          <select
            value={selectedDeckId || ""}
            onChange={(e) => setSelectedDeckId(e.target.value || undefined)}
            className="input-dark w-full"
            disabled={deckSelectDisabled}
          >
            <option value="">All Decks</option>
            {availableDecks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {"\u00A0".repeat(deck.depth * 2)}
                {deck.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
            SRS Status
          </label>
          <select
            value={selectedSrsStatuses.join(",")}
            onChange={(e) => {
              const v = e.target.value
              setSelectedSrsStatuses(v ? v.split(",") : [])
              onQuickView("search")
            }}
            className="input-dark w-full"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Learning">Learning</option>
            <option value="Review">Review</option>
            <option value="Relearning">Relearning</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mr-2">
          Quick Lists
        </span>
        <div className="inline-flex rounded-lg bg-white/5 border border-white/10 p-1 w-fit">
          <button
            type="button"
            onClick={() => onQuickView("search")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              quickView === "search"
                ? "bg-white/10 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            )}
          >
            <Search className="h-3.5 w-3.5" />
            All Cards
          </button>
          <button
            type="button"
            onClick={() => onQuickView("leeches")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              quickView === "leeches"
                ? "bg-red-500/20 text-red-300 shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Leeches
          </button>
          <button
            type="button"
            onClick={() => onQuickView("missing-audio")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              quickView === "missing-audio"
                ? "bg-amber-500/20 text-amber-300 shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            )}
          >
            <Music className="h-3.5 w-3.5" />
            Missing audio
          </button>
          <button
            type="button"
            onClick={() => onQuickView("missing-image")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              quickView === "missing-image"
                ? "bg-amber-500/20 text-amber-300 shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            )}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Missing image
          </button>
        </div>
      </div>
    </form>
  )
}
