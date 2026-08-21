import React from "react"
import { cn } from "@/lib/utils"
import { CheckSquare, Square, Trash2, Move, RotateCcw, X } from "lucide-react"
import { cardListPrimaryLine, cardListWord, noteFieldPlainString } from "@/lib/editor/card-display"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"
import type { CardResponseDto } from "@/lib/api/types"

const TRUNCATE_LEN = 60

function truncate(s: string, len: number) {
  if (!s) return ""
  return s.length <= len ? s : s.slice(0, len) + "\u2026"
}

function formatDate(iso?: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString()
}

function srsPillClass(status: string) {
  const s = status.toLowerCase()
  if (s === "new") return "bg-brand-secondary/20 text-brand-secondary border-brand-secondary/30"
  if (s === "learning" || s === "relearning") return "bg-amber-500/20 text-amber-300 border-amber-500/30"
  if (s === "review" || s === "mature") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
  return "bg-white/10 text-gray-400 border-white/10"
}

export interface CardsTableProps {
  searchLoading: boolean
  searchError: Error | null
  searchResults: { items: CardResponseDto[]; totalCount: number; hasNextPage: boolean; hasPreviousPage: boolean } | undefined
  quickView: string
  pageNumber: number
  setPageNumber: React.Dispatch<React.SetStateAction<number>>
  selectedIds: Set<string>
  toggleSelect: (id: string) => void
  toggleSelectAll: () => void
  clearSelection: () => void
  deckTitleById: Record<string, string>
  setViewCard: (card: CardResponseDto) => void
  setViewCardId: (id: string) => void
  handleDeleteCard: (id: string) => void
  
  bulkMode: "move" | "reset" | null
  setBulkMode: (mode: "move" | "reset" | null) => void
  bulkError: string | null
  isBulkPending: boolean
  moveTargetDeckId: string
  setMoveTargetDeckId: (id: string) => void
  availableDecks: { id: string; title: string; depth: number }[]
  handleBulkMove: () => void
  handleBulkDelete: () => void
  handleBulkReset: () => void
}

export function CardsTable({
  searchLoading,
  searchError,
  searchResults,
  quickView,
  pageNumber,
  setPageNumber,
  selectedIds,
  toggleSelect,
  toggleSelectAll,
  clearSelection,
  deckTitleById,
  setViewCard,
  setViewCardId,
  handleDeleteCard,
  bulkMode,
  setBulkMode,
  bulkError,
  isBulkPending,
  moveTargetDeckId,
  setMoveTargetDeckId,
  availableDecks,
  handleBulkMove,
  handleBulkDelete,
  handleBulkReset,
}: CardsTableProps) {
  const allSelected = (searchResults?.items.length ?? 0) > 0 && selectedIds.size === (searchResults?.items.length ?? 0)

  return (
    <>
      {bulkError ? (
        <div className="glass-panel rounded-xl border border-red-500/30 p-4 text-red-400 text-sm">
          {bulkError}
        </div>
      ) : null}

      {selectedIds.size > 0 && (
        <div className="glass-panel rounded-xl border border-brand-primary/30 p-4 flex flex-wrap items-center gap-4">
          <div className="text-sm text-white">
            <span className="font-semibold">{selectedIds.size}</span> selected
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setBulkMode("move")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary/20 border border-brand-primary/40 text-brand-primary text-xs hover:bg-brand-primary/30"
            >
              <Move className="h-3.5 w-3.5" />
              Move
            </button>
            <button
              type="button"
              onClick={() => setBulkMode("reset")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-gray-300 hover:bg-white/5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset progress
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isBulkPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/40 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-gray-500 hover:bg-white/5"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>
      )}

      {bulkMode === "move" && (
        <div className="glass-panel rounded-xl border border-app-border p-4 space-y-3">
          <p className="text-sm text-white">Move {selectedIds.size} selected cards to deck</p>
          <div className="flex gap-3">
            <select
              value={moveTargetDeckId}
              onChange={(e) => setMoveTargetDeckId(e.target.value)}
              className="input-dark flex-1"
            >
              <option value="">Select deck…</option>
              {availableDecks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {"\u00A0".repeat(deck.depth * 2)}
                  {deck.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!moveTargetDeckId || isBulkPending}
              onClick={handleBulkMove}
              className="btn-primary disabled:opacity-50"
            >
              Move
            </button>
            <button
              type="button"
              onClick={() => setBulkMode(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {bulkMode === "reset" && (
        <div className="glass-panel rounded-xl border border-app-border p-4 space-y-3">
          <p className="text-sm text-white">
            Reset FSRS progress for {selectedIds.size} selected cards?
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={isBulkPending}
              onClick={handleBulkReset}
              className="btn-primary disabled:opacity-50"
            >
              Reset progress
            </button>
            <button
              type="button"
              onClick={() => setBulkMode(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="glass-panel rounded-xl border border-app-border p-6">
        {searchLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : searchError ? (
          <div className="text-red-400 text-center py-12">
            {searchError.message}
          </div>
        ) : searchResults ? (
          <>
            <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm text-gray-400">
                {searchResults.totalCount} card{searchResults.totalCount !== 1 ? "s" : ""}
                {quickView !== "search" && ` \u2014 ${quickView.replace("-", " ")}`}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  disabled={!searchResults.hasPreviousPage}
                  className="btn-secondary text-xs disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPageNumber((p) => p + 1)}
                  disabled={!searchResults.hasNextPage}
                  className="btn-secondary text-xs disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>

            {searchResults.items.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No cards found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-app-border text-[10px] uppercase tracking-wider text-gray-500">
                      <th className="px-3 py-3 font-bold">
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          className="inline-flex items-center gap-1.5 hover:text-white"
                        >
                          {allSelected ? (
                            <CheckSquare className="h-4 w-4 text-brand-primary" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-3 py-3 font-bold">Front</th>
                      <th className="px-3 py-3 font-bold">Word</th>
                      <th className="px-3 py-3 font-bold">Deck</th>
                      <th className="px-3 py-3 font-bold">Status</th>
                      <th className="px-3 py-3 font-bold">Interval</th>
                      <th className="px-3 py-3 font-bold">Due</th>
                      <th className="px-3 py-3 font-bold">Lapses</th>
                      <th className="px-3 py-3 font-bold">Ease</th>
                      <th className="px-3 py-3 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.items.map((card) => {
                      const primary = cardListPrimaryLine(card)
                      const trans = noteFieldPlainString(card.note?.fieldValues, SENTENCE_MINING.Translation)
                      const w = cardListWord(card)
                      const srs = card.srsState
                      return (
                        <tr
                          key={card.id}
                          className="border-b border-white/5 hover:bg-white/[0.02]"
                        >
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => toggleSelect(card.id)}
                              className="inline-flex items-center"
                            >
                              {selectedIds.has(card.id) ? (
                                <CheckSquare className="h-4 w-4 text-brand-primary" />
                              ) : (
                                <Square className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                          </td>
                          <td className="px-3 py-3 max-w-xs">
                            <p className="text-white truncate" title={primary}>
                              {truncate(primary ?? "", TRUNCATE_LEN)}
                            </p>
                            <p className="text-gray-500 text-xs truncate" title={trans}>
                              {truncate(trans ?? "", TRUNCATE_LEN)}
                            </p>
                          </td>
                          <td className="px-3 py-3">
                            {w ? (
                              <span className="text-xs text-brand-primary font-semibold px-2 py-0.5 rounded bg-brand-primary/10">
                                {w}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-3 text-gray-400 text-xs">
                            {deckTitleById[card.deckId] ?? card.deckId}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={cn(
                                "inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider",
                                srsPillClass(card.srsStatus)
                              )}
                            >
                              {card.srsStatus}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-gray-400 tabular-nums">
                            {srs?.currentInterval ?? 0}d
                          </td>
                          <td className="px-3 py-3 text-gray-400 tabular-nums text-xs">
                            {formatDate(srs?.dueUtc)}
                          </td>
                          <td className="px-3 py-3 text-gray-400 tabular-nums">
                            {srs?.lapses ?? 0}
                          </td>
                          <td className="px-3 py-3 text-gray-400 tabular-nums text-xs">
                            {srs?.difficulty ? srs.difficulty.toFixed(2) : "—"}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setViewCard(card)
                                  setViewCardId(card.id)
                                }}
                                className="px-2 py-1 rounded-md border border-white/10 text-xs text-gray-300 hover:bg-white/5"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  toggleSelect(card.id)
                                  setBulkMode("reset")
                                }}
                                className="px-2 py-1 rounded-md border border-white/10 text-xs text-gray-500 hover:bg-white/5"
                              >
                                Reset
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteCard(card.id)}
                                className="px-2 py-1 rounded-md border border-red-500/30 text-xs text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}
      </div>
    </>
  )
}
