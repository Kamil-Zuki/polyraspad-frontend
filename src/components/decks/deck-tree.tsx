"use client"

import { useState } from "react"
import { useDeckTree, useDeleteDeck } from "@/lib/react-query/queries"
import type { DeckTreeItemDto } from "@/lib/api/types"
import { DeckItem } from "./deck-item"
import { CreateDeckDialog } from "./create-deck-dialog"

interface DeckTreeProps {
  projectId: string
}

export function DeckTree({ projectId }: DeckTreeProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
  const { data: deckTree, isLoading, error } = useDeckTree(projectId)
  const deleteDeck = useDeleteDeck()

  const handleCreateDeck = (parentId?: string | null) => {
    setSelectedParentId(parentId || null)
    setIsCreateDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">Failed to load deck tree</p>
      </div>
    )
  }

  if (!deckTree || deckTree.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <i className="fas fa-folder-open text-6xl text-gray-600" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No decks yet</h3>
        <p className="text-gray-400 mb-6">Create your first deck to start organizing your cards</p>
        <button
          onClick={() => handleCreateDeck()}
          className="px-4 py-2 bg-brand-purple hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
        >
          <i className="fas fa-plus mr-2" />
          Create Deck
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Decks</h3>
        <button
          onClick={() => handleCreateDeck()}
          className="px-3 py-1.5 bg-brand-purple hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <i className="fas fa-plus mr-2" />
          New Deck
        </button>
      </div>

      <div className="space-y-1">
        {deckTree.map((deck) => (
          <DeckItem
            key={deck.id}
            deck={deck}
            projectId={projectId}
            onCreateChild={(parentId) => handleCreateDeck(parentId)}
            onDelete={async (id) => {
              if (confirm("Are you sure you want to delete this deck? All cards and sub-decks will be deleted.")) {
                await deleteDeck.mutateAsync(id)
              }
            }}
          />
        ))}
      </div>

      <CreateDeckDialog
        isOpen={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false)
          setSelectedParentId(null)
        }}
        projectId={projectId}
        parentDeckId={selectedParentId}
      />
    </div>
  )
}

