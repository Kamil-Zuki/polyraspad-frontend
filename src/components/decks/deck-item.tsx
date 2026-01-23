"use client"

import { useState } from "react"
import type { DeckTreeItemDto } from "@/lib/api/types"
import { UpdateDeckDialog } from "./update-deck-dialog"

interface DeckItemProps {
  deck: DeckTreeItemDto
  projectId: string
  onCreateChild: (parentId: string) => void
  onDelete: (id: string) => Promise<void>
  level?: number
}

export function DeckItem({
  deck,
  projectId,
  onCreateChild,
  onDelete,
  level = 0,
}: DeckItemProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const hasChildren = deck.children && deck.children.length > 0

  return (
    <>
      <div
        className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors relative"
        style={{ paddingLeft: `${12 + level * 24}px` }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            <i
              className={`fas fa-chevron-${isExpanded ? "down" : "right"} text-xs`}
            />
          ) : (
            <i className="fas fa-circle text-[4px]" />
          )}
        </button>

        <div className="flex-1 flex items-center gap-3 min-w-0">
          <i className="fas fa-folder text-brand-purple flex-shrink-0" />
          <span className="text-white font-medium truncate">{deck.title}</span>
          <span className="text-gray-500 text-sm flex-shrink-0">
            {deck.cardCount} cards
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onCreateChild(deck.id)
            }}
            className="px-2.5 py-1.5 text-white hover:text-brand-purple transition-all bg-dark-800 hover:bg-dark-700 rounded-md border border-white/20 hover:border-brand-purple/50 shadow-sm text-sm font-bold"
            title="Create sub-deck"
          >
            +
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              setIsUpdateDialogOpen(true)
            }}
            className="px-2.5 py-1.5 text-white hover:text-blue-400 transition-all bg-dark-800 hover:bg-dark-700 rounded-md border border-white/20 hover:border-blue-400/50 shadow-sm text-sm font-bold"
            title="Edit deck"
          >
            ✎
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onDelete(deck.id)
            }}
            className="px-2.5 py-1.5 text-white hover:text-red-400 transition-all bg-dark-800 hover:bg-dark-700 rounded-md border border-white/20 hover:border-red-400/50 shadow-sm text-sm font-bold"
            title="Delete deck"
          >
            ×
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {deck.children.map((child) => (
            <DeckItem
              key={child.id}
              deck={child}
              projectId={projectId}
              onCreateChild={onCreateChild}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}

      <UpdateDeckDialog
        isOpen={isUpdateDialogOpen}
        onClose={() => setIsUpdateDialogOpen(false)}
        deckId={deck.id}
        currentTitle={deck.title}
        projectId={projectId}
      />
    </>
  )
}

