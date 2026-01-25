"use client"

import { useState } from "react"
import { useProjects } from "@/lib/react-query/queries"
import { useSearchCards } from "@/lib/react-query/queries"
import { useProjectContext } from "@/contexts/project-context"
import { useDeckTree } from "@/lib/react-query/queries"
import { CardResponseDto } from "@/lib/api/types"

export default function BrowserPage() {
  const { currentProject } = useProjectContext()
  const { data: projects, isLoading: projectsLoading } = useProjects()
  const { data: deckTree } = useDeckTree(currentProject?.id || "", {
    enabled: !!currentProject?.id,
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(currentProject?.id)
  const [selectedDeckId, setSelectedDeckId] = useState<string | undefined>()
  const [selectedSrsStatuses, setSelectedSrsStatuses] = useState<string[]>([])
  const [pageNumber, setPageNumber] = useState(1)
  const pageSize = 20

  const { data: searchResults, isLoading: searchLoading, error: searchError } = useSearchCards(
    searchQuery,
    {
      projectId: selectedProjectId,
      deckId: selectedDeckId,
      srsStatuses: selectedSrsStatuses.length > 0 ? selectedSrsStatuses : undefined,
      pageNumber,
      pageSize,
    },
    !!searchQuery && searchQuery.length >= 2
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.length >= 2) {
      setPageNumber(1)
    }
  }

  const flattenDeckTree = (tree: any[]): any[] => {
    const result: any[] = []
    for (const node of tree) {
      result.push(node)
      if (node.children && node.children.length > 0) {
        result.push(...flattenDeckTree(node.children))
      }
    }
    return result
  }

  const availableDecks = deckTree ? flattenDeckTree(deckTree) : []

  if (projectsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 relative custom-scroll">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />
      
      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Card Browser</h1>
          <p className="text-gray-400">Browse and search your vocabulary cards</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="glass-panel rounded-xl p-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cards..."
                className="input-dark w-full pl-12"
                minLength={2}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={searchQuery.length < 2}>
              Search
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-app-border">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                Project
              </label>
              <select
                value={selectedProjectId || ""}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value || undefined)
                  setSelectedDeckId(undefined) // Reset deck when project changes
                }}
                className="input-dark w-full"
              >
                <option value="">All Projects</option>
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                Deck
              </label>
              <select
                value={selectedDeckId || ""}
                onChange={(e) => setSelectedDeckId(e.target.value || undefined)}
                className="input-dark w-full"
                disabled={!selectedProjectId}
              >
                <option value="">All Decks</option>
                {availableDecks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
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
                  const value = e.target.value
                  setSelectedSrsStatuses(value ? value.split(",") : [])
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
        </form>

        {/* Search Results */}
        {searchQuery.length >= 2 && (
          <div className="glass-panel rounded-xl p-6">
            {searchLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : searchError ? (
              <div className="text-red-400 text-center py-12">
                Error: {searchError instanceof Error ? searchError.message : "Unknown error"}
              </div>
            ) : searchResults ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Found {searchResults.totalCount} card{searchResults.totalCount !== 1 ? "s" : ""}
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
                  <div className="text-center py-12 text-gray-500">
                    No cards found matching your search
                  </div>
                ) : (
                  <div className="space-y-4">
                    {searchResults.items.map((card: CardResponseDto) => (
                      <div
                        key={card.id}
                        className="bg-app-surface rounded-xl p-6 border border-app-border hover:border-brand-primary/30 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="text-sm text-gray-500 mb-2">
                              <span className="text-[10px] uppercase tracking-wider">SRS: </span>
                              <span className="text-brand-primary font-bold">{card.srsStatus}</span>
                            </div>
                            <div className="text-lg text-white mb-2">{card.sentence}</div>
                            <div className="text-gray-400">{card.translation}</div>
                          </div>
                        </div>
                        {card.targetWord && (
                          <div className="mt-3 pt-3 border-t border-app-border">
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Target: </span>
                            <span className="text-brand-primary font-bold">{card.targetWord}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {searchQuery.length < 2 && (
          <div className="glass-panel rounded-xl p-12 text-center">
            <div className="mb-4">
              <i className="fas fa-search text-6xl text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Start Searching</h2>
            <p className="text-gray-400">
              Enter at least 2 characters to search for cards
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

