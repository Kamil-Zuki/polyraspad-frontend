"use client"

import { useState, useMemo } from "react"
import { ProjectStatsBanner } from "@/components/library/project-stats-banner"
import { FolderItem, LibraryDeckCard } from "@/components/library/library-items"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { CreateDeckDialog } from "@/components/decks/create-deck-dialog"
import { useProjectContext } from "@/contexts/project-context"
import { useDeckTree, useCreateDeck, useUpdateDeck, useDeleteDeck } from "@/lib/react-query/queries"
import { DeckTreeItemDto } from "@/lib/api/types"

// Helper function to calculate total cards in a tree node (including children)
function calculateTotalCards(node: DeckTreeItemDto): number {
  return node.cardCount + node.children.reduce((sum, child) => sum + calculateTotalCards(child), 0)
}

// Helper function to find a node by ID in the tree
function findNodeById(tree: DeckTreeItemDto[], id: string): DeckTreeItemDto | null {
  for (const node of tree) {
    if (node.id === id) return node
    if (node.children && node.children.length > 0) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

// Helper function to get breadcrumb path to a node
function getBreadcrumbPath(tree: DeckTreeItemDto[], targetId: string, path: DeckTreeItemDto[] = []): DeckTreeItemDto[] | null {
  for (const node of tree) {
    const currentPath = [...path, node]
    if (node.id === targetId) return currentPath
    if (node.children && node.children.length > 0) {
      const found = getBreadcrumbPath(node.children, targetId, currentPath)
      if (found) return found
    }
  }
  return null
}

// Helper function to process tree into folders and decks for a specific parent
function processDeckTree(
  tree: DeckTreeItemDto[],
  parentId?: string | null
): {
  folders: Array<{ id: string; title: string; deckCount: number; cardCount: number; icon: string; color: "secondary" | "pink" | "primary" }>
  decks: Array<{ id: string; title: string; cardCount: number; dueCount: number; progress: number }>
} {
  const folders: Array<{ id: string; title: string; deckCount: number; cardCount: number; icon: string; color: "secondary" | "pink" | "primary" }> = []
  const decks: Array<{ id: string; title: string; cardCount: number; dueCount: number; progress: number }> = []

  const colors: Array<"secondary" | "pink" | "primary"> = ["secondary", "pink", "primary"]
  const icons = ["fas fa-folder", "fas fa-film", "fas fa-book"]

  // Get the nodes to process
  let nodesToProcess: DeckTreeItemDto[] = tree
  if (parentId) {
    const parentNode = findNodeById(tree, parentId)
    nodesToProcess = parentNode?.children || []
  }

  nodesToProcess.forEach((node, index) => {
    if (node.children && node.children.length > 0) {
      // This is a folder (has children)
      const totalCards = calculateTotalCards(node)
      folders.push({
        id: node.id,
        title: node.title,
        deckCount: node.children.length,
        cardCount: totalCards,
        icon: icons[index % icons.length],
        color: colors[index % colors.length],
      })
    } else {
      // This is a deck (no children)
      decks.push({
        id: node.id,
        title: node.title,
        cardCount: node.cardCount,
        dueCount: 0, // TODO: Calculate from card SRS status
        progress: 0, // TODO: Calculate from card maturity
      })
    }
  })

  return { folders, decks }
}

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [isCreateDeckOpen, setIsCreateDeckOpen] = useState(false)
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [editingDeck, setEditingDeck] = useState<DeckTreeItemDto | null>(null)
  const { currentProject } = useProjectContext()
  const { data: deckTree, isLoading, error, refetch } = useDeckTree(currentProject?.id || "", {
    enabled: !!currentProject?.id,
  })
  
  // Mutation hooks for deck operations
  const createDeckMutation = useCreateDeck()
  const updateDeckMutation = useUpdateDeck()
  const deleteDeckMutation = useDeleteDeck()

  // Get breadcrumb path
  const breadcrumbPath = useMemo(() => {
    if (!deckTree || !selectedFolderId) return []
    return getBreadcrumbPath(deckTree, selectedFolderId) || []
  }, [deckTree, selectedFolderId])

  // Process tree for current view
  const { folders, decks } = useMemo(() => {
    if (!deckTree || deckTree.length === 0) {
      return { folders: [], decks: [] }
    }
    return processDeckTree(deckTree, selectedFolderId)
  }, [deckTree, selectedFolderId])

  // Filter by search query
  const filteredFolders = useMemo(() => {
    if (!searchQuery) return folders
    return folders.filter(f => f.title.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [folders, searchQuery])

  const filteredDecks = useMemo(() => {
    if (!searchQuery) return decks
    return decks.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [decks, searchQuery])

  const handleFolderClick = (folderId: string) => {
    setSelectedFolderId(folderId)
    setSearchQuery("") // Clear search when navigating
  }

  const handleBreadcrumbClick = (folderId: string | null) => {
    setSelectedFolderId(folderId)
    setSearchQuery("")
  }

  const handleCreateDeck = () => {
    setIsCreateDeckOpen(true)
  }

  const handleCreateFolder = () => {
    setIsCreateFolderOpen(true)
  }

  const handleDeckDialogClose = () => {
    setIsCreateDeckOpen(false)
    setIsCreateFolderOpen(false)
    setEditingDeck(null)
    refetch() // Refresh deck tree after creation
  }

  const handleDeckEdit = (deck: DeckTreeItemDto) => {
    setEditingDeck(deck)
    setIsCreateDeckOpen(true) // Use same dialog for editing
  }

  const handleDeckDelete = async (deckId: string) => {
    if (confirm("Are you sure you want to delete this deck? All cards and sub-decks will be deleted.")) {
      try {
        await deleteDeckMutation.mutateAsync(deckId)
        refetch() // Refresh deck tree after deletion
      } catch (error) {
        console.error("Failed to delete deck:", error)
      }
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex-1 flex flex-col h-full bg-app-bg relative">
        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto relative custom-scroll">
          {/* Actions Bar - First element in scrollable content */}
          <div className="h-14 glass-panel border-b border-app-border flex items-center justify-between px-8 sticky top-0 z-20 bg-app-bg/95 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => handleBreadcrumbClick(null)}
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <i className="fas fa-home" />
                  <span>Library</span>
                </button>
                {breadcrumbPath.map((node, index) => (
                  <div key={node.id} className="flex items-center gap-2">
                    <i className="fas fa-chevron-right text-[10px] text-gray-600" />
                    <button
                      onClick={() => handleBreadcrumbClick(index === breadcrumbPath.length - 1 ? null : node.id)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {node.title}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Search & Add */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-brand-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Filter decks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-app-bg border border-app-border rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-brand-primary focus:outline-none w-48 transition-all focus:w-72"
                />
              </div>
              <div className="h-6 w-px bg-app-border mx-1" />
              <button
                onClick={handleCreateFolder}
                className="bg-app-surface hover:bg-white/5 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-app-border transition-all active:scale-95"
              >
                <i className="fas fa-folder-plus mr-2" /> New Folder
              </button>
              <button
                onClick={handleCreateDeck}
                className="btn-primary flex items-center gap-2 text-[10px] uppercase tracking-widest py-2"
              >
                <i className="fas fa-plus" /> New Deck
              </button>
            </div>
          </div>

          {/* Background Decor */}
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />

          {/* Content Area */}
          <div className="p-8 relative z-10">
            <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Project Stats Banner */}
            <ProjectStatsBanner />

            {/* Folders Section - Only show if there are folders */}
            {filteredFolders.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2.5">
                    <i className="fas fa-folder text-brand-secondary" /> Folders
                  </h2>
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 rounded-xl bg-app-surface/50 border border-app-border animate-pulse" />
                    ))}
                  </div>
                ) : error ? (
                  <div className="p-6 glass-panel border-red-500/30 rounded-2xl">
                    <div className="text-red-400">Error loading folders: {error instanceof Error ? error.message : "Unknown error"}</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredFolders.map((folder) => (
                      <FolderItem
                        key={folder.id}
                        {...folder}
                        onClick={() => handleFolderClick(folder.id)}
                      >
                        {/* Action buttons for folder (rendered inside FolderItem action slot) */}
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeckEdit(findNodeById(deckTree || [], folder.id)!)
                            }}
                            className="w-6 h-6 rounded-md bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/20 transition-all duration-200 shadow-sm"
                          >
                            <i className="fas fa-edit text-xs" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeckDelete(folder.id)
                            }}
                            className="w-6 h-6 rounded-md bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 shadow-sm"
                          >
                            <i className="fas fa-trash-alt text-xs" />
                          </button>
                        </>
                      </FolderItem>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Decks Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2.5">
                  <i className="fas fa-clone text-brand-primary" />
                  {selectedFolderId ? "Decks" : "Root Decks"}
                </h2>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-[320px] rounded-2xl bg-app-surface/50 border border-app-border animate-pulse" />
                  ))}
                </div>
              ) : error ? (
                <div className="p-6 glass-panel border-red-500/30 rounded-2xl">
                  <div className="text-red-400">Error loading decks: {error instanceof Error ? error.message : "Unknown error"}</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {filteredDecks.map((deck) => (
                    <div key={deck.id} className="relative group">
                      <LibraryDeckCard {...deck} />
                      {/* Action buttons for deck - positioned on top of the card */}
                      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeckEdit(findNodeById(deckTree || [], deck.id)!)
                          }}
                          className="w-7 h-7 rounded-md bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-xs text-gray-300 hover:text-white hover:bg-white/20 transition-all duration-200 shadow-sm"
                        >
                          <i className="fas fa-edit" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeckDelete(deck.id)
                          }}
                          className="w-7 h-7 rounded-md bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-xs text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 shadow-sm"
                        >
                          <i className="fas fa-trash-alt" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Empty State / Add New Placeholder */}
                  {filteredDecks.length === 0 && !searchQuery ? (
                    <button
                      onClick={handleCreateDeck}
                      className="bg-app-surface/30 border-2 border-dashed border-white/5 rounded-2xl h-[320px] flex flex-col items-center justify-center gap-4 group hover:border-brand-primary/40 hover:bg-app-surface/50 transition-all duration-300"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-app-bg border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <i className="fas fa-plus text-gray-600 group-hover:text-brand-primary transition-colors text-2xl" />
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold text-sm mb-1">Create New Deck</div>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest px-6 leading-relaxed">Organize your next learning goal</p>
                      </div>
                    </button>
                  ) : filteredDecks.length === 0 && searchQuery ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      No decks match your search
                    </div>
                  ) : (
                    <button
                      onClick={handleCreateDeck}
                      className="bg-app-surface/30 border-2 border-dashed border-white/5 rounded-2xl h-[320px] flex flex-col items-center justify-center gap-4 group hover:border-brand-primary/40 hover:bg-app-surface/50 transition-all duration-300"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-app-bg border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <i className="fas fa-plus text-gray-600 group-hover:text-brand-primary transition-colors text-2xl" />
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold text-sm mb-1">Create New Deck</div>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest px-6 leading-relaxed">Organize your next learning goal</p>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </section>
            </div>
          </div>
        </main>

        {/* Create/Edit Deck Dialog */}
        {currentProject && (
          <>
            <CreateDeckDialog
              isOpen={isCreateDeckOpen}
              onClose={handleDeckDialogClose}
              projectId={currentProject.id}
              parentDeckId={selectedFolderId}
              initialData={editingDeck ? { title: editingDeck.title } : undefined}
              isEditing={!!editingDeck}
              onEditSubmit={editingDeck ? async (formData) => {
                try {
                  await updateDeckMutation.mutateAsync({
                    id: editingDeck.id,
                    data: { title: formData.title, projectId: currentProject.id }
                  })
                  handleDeckDialogClose()
                } catch (error) {
                  console.error("Failed to update deck:", error)
                }
              } : undefined}
            />
            <CreateDeckDialog
              isOpen={isCreateFolderOpen}
              onClose={handleDeckDialogClose}
              projectId={currentProject.id}
              parentDeckId={selectedFolderId}
              isFolder={true}
            />
          </>
        )}
      </div>
    </ProtectedRoute>
  )
}
