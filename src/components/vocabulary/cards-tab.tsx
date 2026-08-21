"use client"

/**
 * Cards tab: FSRS card manager with search, filters, and bulk actions.
 * Extracted from the standalone /browser page for use inside the Vocabulary tabbed view.
 */

import { useMemo, useState } from "react"
import { useQueries } from "@tanstack/react-query"
import {
  useProjects,
  useSearchCards,
  useDeckTree,
  useDeleteCard,
  useBulkDeleteCards,
  useMoveCards,
  useResetCardProgress,
  useLeechCards,
  useCardsMissingMedia,
} from "@/lib/react-query/queries"
import { deckQueryKeys } from "@/lib/react-query/constants"
import { apiClient } from "@/lib/api/index"
import { useProjectContext } from "@/contexts/project-context"
import type { CardResponseDto } from "@/lib/api/types"
import { cardListPrimaryLine, cardListWord, noteFieldPlainString } from "@/lib/editor/card-display"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"
import { flattenDeckTree } from "@/lib/decks/deck-tree-utils"
import { useFlatDecks } from "@/hooks/use-flat-decks"
import { CardViewModal } from "@/components/browser/card-view-modal"
import { CardsToolbar, QuickView } from "./cards-toolbar"
import { CardsTable } from "./cards-table"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

const PAGE_SIZE = 20

export function CardsTab() {
  const { currentProject } = useProjectContext()
  const { data: projects, isLoading: projectsLoading } = useProjects()
  const selectedProjectId = currentProject?.id
  const [selectedDeckId, setSelectedDeckId] = useState<string | undefined>()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSrsStatuses, setSelectedSrsStatuses] = useState<string[]>([])
  const [pageNumber, setPageNumber] = useState(1)
  const [viewCardId, setViewCardId] = useState<string | null>(null)
  const [viewCard, setViewCard] = useState<CardResponseDto | null>(null)
  const [quickView, setQuickView] = useState<QuickView>("search")

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkMode, setBulkMode] = useState<"move" | "reset" | null>(null)
  const [moveTargetDeckId, setMoveTargetDeckId] = useState<string>("")
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    description?: string
    variant?: "destructive" | "warning" | "primary"
    onConfirm: () => void
  }>({
    isOpen: false,
    title: "",
    onConfirm: () => {},
  })

  const { decks: scopedFlatDecks, isLoading: scopedDecksLoading } = useFlatDecks(selectedProjectId ?? "")
  const allProjectIds = useMemo(() => projects?.map((p) => p.id) ?? [], [projects])

  const aggregatedDeckQueries = useQueries({
    queries: allProjectIds.map((projectId) => ({
      queryKey: deckQueryKeys.deckTree(projectId),
      queryFn: () => apiClient.decks.getDeckTree(projectId),
      enabled: !selectedProjectId && allProjectIds.length > 0,
    })),
  })

  const aggregatedDecksEpoch = aggregatedDeckQueries.map((q) => `${q.fetchStatus}:${q.dataUpdatedAt}`).join("|")
  const allDecksLoading =
    !selectedProjectId && allProjectIds.length > 0 && aggregatedDeckQueries.some((q) => q.isLoading)

  const availableDecks = useMemo(() => {
    if (selectedProjectId) {
      return scopedFlatDecks
    }
    const rows: { id: string; title: string; depth: number }[] = []
    aggregatedDeckQueries.forEach((q, i) => {
      if (!q.data) return
      const pid = allProjectIds[i]
      const projTitle = projects?.find((p) => p.id === pid)?.title ?? ""
      const prefix = projTitle ? `${projTitle} \u2014 ` : ""
      rows.push(
        ...flattenDeckTree(q.data).map((d: any) => ({
          id: d.id,
          title: `${prefix}${d.title}`,
          depth: d.depth,
        })),
      )
    })
    return rows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, scopedFlatDecks, projects, allProjectIds, aggregatedDecksEpoch])

  const deckSelectDisabled =
    !projects?.length || (availableDecks.length === 0 && (selectedProjectId ? scopedDecksLoading : allDecksLoading))
  const deckTitleById = useMemo(() => {
    const map: Record<string, string> = {}
    availableDecks.forEach((d) => {
      map[d.id] = d.title
    })
    return map
  }, [availableDecks])

  const effectiveQuery = searchQuery.trim()

  const searchResult = useSearchCards(
    effectiveQuery,
    {
      projectId: selectedProjectId,
      deckId: selectedDeckId,
      srsStatuses: selectedSrsStatuses.length > 0 ? selectedSrsStatuses : undefined,
      pageNumber,
      pageSize: PAGE_SIZE,
    },
    quickView === "search",
  )

  const leechResult = useLeechCards(
    selectedProjectId,
    { pageNumber, pageSize: PAGE_SIZE },
    quickView === "leeches",
  )

  const missingAudioResult = useCardsMissingMedia(
    selectedProjectId,
    { mediaType: "audio", pageNumber, pageSize: PAGE_SIZE },
    quickView === "missing-audio",
  )

  const missingImageResult = useCardsMissingMedia(
    selectedProjectId,
    { mediaType: "image", pageNumber, pageSize: PAGE_SIZE },
    quickView === "missing-image",
  )

  const activeResult =
    quickView === "search"
      ? searchResult
      : quickView === "leeches"
      ? leechResult
      : quickView === "missing-audio"
      ? missingAudioResult
      : missingImageResult

  const deleteCard = useDeleteCard()
  const bulkDelete = useBulkDeleteCards()
  const moveCards = useMoveCards()
  const resetProgress = useResetCardProgress()

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    const ids = activeResult.data?.items.map((c) => c.id) ?? []
    if (selectedIds.size === ids.length && ids.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(ids))
    }
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleDeleteCard = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete this card?",
      description: "This action cannot be undone.",
      variant: "destructive",
      onConfirm: async () => {
        setBulkError(null)
        try {
          await deleteCard.mutateAsync(id)
        } catch (err) {
          setBulkError(err instanceof Error ? err.message : "Failed to delete card")
        }
      },
    })
  }

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return
    setConfirmConfig({
      isOpen: true,
      title: `Delete ${selectedIds.size} selected cards?`,
      description: "All selected cards will be permanently removed.",
      variant: "destructive",
      onConfirm: async () => {
        setBulkError(null)
        try {
          await bulkDelete.mutateAsync({ cardIds: Array.from(selectedIds) })
          setSelectedIds(new Set())
        } catch (err) {
          setBulkError(err instanceof Error ? err.message : "Failed to delete cards")
        }
      },
    })
  }

  const handleBulkMove = async () => {
    if (selectedIds.size === 0 || !moveTargetDeckId) return
    setBulkError(null)
    try {
      await moveCards.mutateAsync({ cardIds: Array.from(selectedIds), deckId: moveTargetDeckId })
      setSelectedIds(new Set())
      setBulkMode(null)
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Failed to move cards")
    }
  }

  const handleBulkReset = () => {
    if (selectedIds.size === 0) return
    setConfirmConfig({
      isOpen: true,
      title: `Reset progress for ${selectedIds.size} selected cards?`,
      description: "FSRS review history and scheduling parameters will be reset.",
      variant: "warning",
      onConfirm: async () => {
        setBulkError(null)
        try {
          await resetProgress.mutateAsync({ cardIds: Array.from(selectedIds) })
          setSelectedIds(new Set())
          setBulkMode(null)
        } catch (err) {
          setBulkError(err instanceof Error ? err.message : "Failed to reset progress")
        }
      },
    })
  }

  const isBulkPending = deleteCard.isPending || bulkDelete.isPending || moveCards.isPending || resetProgress.isPending

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPageNumber(1)
    setQuickView("search")
  }

  const handleQuickView = (v: QuickView) => {
    setQuickView(v)
    setPageNumber(1)
    setSelectedIds(new Set())
  }

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const searchResults = activeResult.data
  const searchLoading = activeResult.isLoading
  const searchError = activeResult.error

  const allSelected =
    (searchResults?.items.length ?? 0) > 0 && selectedIds.size === (searchResults?.items.length ?? 0)

  return (
    <>
      <CardsToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        selectedDeckId={selectedDeckId}
        setSelectedDeckId={setSelectedDeckId}
        availableDecks={availableDecks}
        deckSelectDisabled={deckSelectDisabled}
        selectedSrsStatuses={selectedSrsStatuses}
        setSelectedSrsStatuses={setSelectedSrsStatuses}
        quickView={quickView}
        onQuickView={handleQuickView}
      />
      
      <CardsTable
        searchLoading={searchLoading}
        searchError={searchError}
        searchResults={searchResults}
        quickView={quickView}
        pageNumber={pageNumber}
        setPageNumber={setPageNumber}
        selectedIds={selectedIds}
        toggleSelect={toggleSelect}
        toggleSelectAll={toggleSelectAll}
        clearSelection={clearSelection}
        deckTitleById={deckTitleById}
        setViewCard={setViewCard}
        setViewCardId={setViewCardId}
        handleDeleteCard={handleDeleteCard}
        bulkMode={bulkMode}
        setBulkMode={setBulkMode}
        bulkError={bulkError}
        isBulkPending={isBulkPending}
        moveTargetDeckId={moveTargetDeckId}
        setMoveTargetDeckId={setMoveTargetDeckId}
        availableDecks={availableDecks}
        handleBulkMove={handleBulkMove}
        handleBulkDelete={handleBulkDelete}
        handleBulkReset={handleBulkReset}
      />

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

      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        description={confirmConfig.description}
        variant={confirmConfig.variant}
      />
    </>
  )
}
