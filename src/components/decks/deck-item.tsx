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
        className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
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

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onCreateChild(deck.id)}
            className="p-1.5 text-gray-400 hover:text-brand-purple transition-colors"
            title="Create sub-deck"
          >
            <i className="fas fa-plus text-xs" />
          </button>
          <button
            onClick={() => setIsUpdateDialogOpen(true)}
            className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
            title="Edit deck"
          >
            <i className="fas fa-edit text-xs" />
          </button>
          <button
            onClick={() => onDelete(deck.id)}
            className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
            title="Delete deck"
          >
            <i className="fas fa-trash text-xs" />
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

