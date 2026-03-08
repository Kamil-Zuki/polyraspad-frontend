"use client"

import { useState, useMemo } from "react"
import { useProjects, useSearchCards, useDeckTree } from "@/lib/react-query/queries"
import { useProjectContext } from "@/contexts/project-context"
import type { CardResponseDto } from "@/lib/api/types"
import { CardViewModal } from "@/components/browser/card-view-modal"

const PAGE_SIZE = 20
const TRUNCATE_LEN = 60

function truncate(s: string, len: number) {
  if (!s) return ""
  return s.length <= len ? s : s.slice(0, len) + "\u2026"
}

function flattenDeckTree(tree: { id: string; title: string; children?: unknown[] }[]): { id: string; title: string }[] {
  const result: { id: string; title: string }[] = []
  for (const node of tree) {
    result.push({ id: node.id, title: node.title })
    if (node.children && node.children.length > 0) {
      result.push(...flattenDeckTree(node.children as { id: string; title: string; children?: unknown[] }[]))
    }
  }
  return result
}

export default function BrowserPage() {
  const { currentProject } = useProjectContext()
  const { data: projects, isLoading: projectsLoading } = useProjects()
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(currentProject?.id)
  const [selectedDeckId, setSelectedDeckId] = useState<string | undefined>()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSrsStatuses, setSelectedSrsStatuses] = useState<string[]>([])
  const [pageNumber, setPageNumber] = useState(1)
  const [viewCardId, setViewCardId] = useState<string | null>(null)
  const [viewCard, setViewCard] = useState<CardResponseDto | null>(null)

  const projectIdForTree = selectedProjectId || currentProject?.id || ""
  const { data: deckTree } = useDeckTree(projectIdForTree)

  const hasSearch = searchQuery.trim().length >= 2
  const hasDeck = !!selectedDeckId
  const hasProject = !!selectedProjectId
  const hasSrs = selectedSrsStatuses.length > 0
  const shouldFetch = hasSearch || hasDeck || hasProject || hasSrs
  const effectiveQuery = hasSearch ? searchQuery.trim() : ""

  const { data: searchResults, isLoading: searchLoading, error: searchError } = useSearchCards(
    effectiveQuery,
    {
      projectId: selectedProjectId,
      deckId: selectedDeckId,
      srsStatuses: selectedSrsStatuses.length > 0 ? selectedSrsStatuses : undefined,
      pageNumber,
      pageSize: PAGE_SIZE,
    },
    true,
  )

  const availableDecks = useMemo(
    () => (deckTree ? flattenDeckTree(deckTree) : []),
    [deckTree],
  )
  const deckTitleById = useMemo(() => {
    const map: Record<string, string> = {}
    availableDecks.forEach((d) => {
      map[d.id] = d.title
    })
    return map
  }, [availableDecks])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (shouldFetch) setPageNumber(1)
  }

  const showResults = shouldFetch
  const showEmptyPrompt = !showResults && !projectsLoading

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
          <p className="text-gray-400">Browse cards by deck or search. Click a card to view front/back.</p>
        </div>

        <form onSubmit={handleSearch} className="glass-panel rounded-xl p-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cards (min 2 chars) or leave empty and select a deck"
                className="input-dark w-full pl-12"
              />
            </div>
            <button type="submit" className="btn-primary">
              {hasSearch ? "Search" : "Apply"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-app-border">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                Project
              </label>
              <select
                value={selectedProjectId || ""}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value || undefined)
                  setSelectedDeckId(undefined)
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
                  const v = e.target.value
                  setSelectedSrsStatuses(v ? v.split(",") : [])
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

        {showResults && (
          <div className="glass-panel rounded-xl p-6">
            {searchLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : searchError ? (
              <div className="text-red-400 text-center py-12">
                {searchError instanceof Error ? searchError.message : "Unknown error"}
              </div>
            ) : searchResults ? (
              <>
                <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-sm text-gray-400">
                    {searchResults.totalCount} card{searchResults.totalCount !== 1 ? "s" : ""}
                    {hasDeck && !hasSearch && " in deck"}
                    {hasProject && !hasDeck && !hasSearch && " in project"}
                    {hasSearch && " found"}
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
                    {hasDeck && !hasSearch ? "No cards in this deck" : "No cards found"}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchResults.items.map((card: CardResponseDto) => (
                      <button
                        key={card.id}
                        type="button"
                        className="w-full text-left bg-app-surface rounded-xl p-4 border border-app-border hover:border-brand-primary/30 transition-all"
                        onClick={() => {
                          setViewCard(card)
                          setViewCardId(card.id)
                        }}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-white truncate" title={card.sentence}>
                              {truncate(card.sentence ?? "", TRUNCATE_LEN)}
                            </p>
                            <p className="text-gray-400 text-sm truncate mt-0.5" title={card.translation}>
                              {truncate(card.translation ?? "", TRUNCATE_LEN)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {card.targetWord && (
                              <span className="text-xs text-brand-primary font-semibold px-2 py-0.5 rounded bg-brand-primary/10">
                                {card.targetWord}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-500 uppercase">
                              {deckTitleById[card.deckId] ?? card.deckId}
                            </span>
                            <span className="text-[10px] text-gray-500">{card.srsStatus}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {showEmptyPrompt && (
          <div className="glass-panel rounded-xl p-12 text-center">
            <div className="mb-4">
              <i className="fas fa-layer-group text-6xl text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Browse or search</h2>
            <p className="text-gray-400">
              Select a project to see all cards in it, choose a deck to see only that deck, or enter at least 2 characters to search.
            </p>
          </div>
        )}
      </div>

      {viewCardId && (
        <CardViewModal
          cardId={viewCardId}
          initialCard={viewCard}
          onClose={() => {
            setViewCardId(null)
            setViewCard(null)
          }}
        />
      )}
    </div>
  )
}
