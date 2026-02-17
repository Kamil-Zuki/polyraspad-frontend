"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ChevronRight,
  Settings,
  BookOpen,
  Plus,
  LayoutGrid,
  BarChart3,
} from "lucide-react"
import { useDeck, useDeckTree } from "@/lib/react-query/queries"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DeckTreeItemDto } from "@/lib/api/types"

function getBreadcrumbPath(
  tree: DeckTreeItemDto[],
  targetId: string,
  path: DeckTreeItemDto[] = []
): DeckTreeItemDto[] | null {
  for (const node of tree) {
    const currentPath = [...path, node]
    if (node.id === targetId) return currentPath
    if (node.children?.length) {
      const found = getBreadcrumbPath(node.children, targetId, currentPath)
      if (found) return found
    }
  }
  return null
}

// Stats placeholder until API provides SRS counts per deck
const DEFAULT_STATS = { newCount: 10, learningCount: 5, toReviewCount: 15 }
const DUE_TODAY = 25

function DeckOverviewSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full bg-app-bg">
      <div className="h-14 glass-panel border-b border-app-border flex items-center px-8 gap-4">
        <div className="h-4 w-48 bg-app-surface rounded animate-pulse" />
        <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />
        <div className="h-4 w-32 bg-app-surface rounded animate-pulse" />
      </div>
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-8">
          <div className="h-10 w-64 bg-app-surface rounded-xl animate-pulse" />
          <div className="h-16 w-72 bg-app-surface rounded-2xl animate-pulse" />
          <div className="h-5 w-40 bg-app-surface rounded animate-pulse" />
          <div className="grid grid-cols-3 gap-4 w-full max-w-md">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-app-surface rounded-xl border border-app-border animate-pulse"
              />
            ))}
          </div>
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-28 bg-app-surface rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DeckOverviewPage() {
  const { deckId } = useParams()
  const router = useRouter()
  const id = Array.isArray(deckId) ? deckId[0] : deckId ?? ""

  const { data: deck, isLoading: isDeckLoading, error: deckError } = useDeck(id)
  const { data: deckTree } = useDeckTree(deck?.projectId ?? "")

  const breadcrumbPath = useMemo(() => {
    if (!deckTree?.length || !id) return []
    return getBreadcrumbPath(deckTree, id) ?? []
  }, [deckTree, id])

  const stats = useMemo(
    () =>
      deck
        ? {
            newCount: DEFAULT_STATS.newCount,
            learningCount: DEFAULT_STATS.learningCount,
            toReviewCount: DEFAULT_STATS.toReviewCount,
            dueToday: DUE_TODAY,
          }
        : null,
    [deck]
  )

  if (isDeckLoading) {
    return (
      <ProtectedRoute>
        <DeckOverviewSkeleton />
      </ProtectedRoute>
    )
  }

  if (deckError || !deck) {
    return (
      <ProtectedRoute>
        <div className="flex-1 flex flex-col h-full bg-app-bg items-center justify-center p-8">
          <div className="glass-panel border border-app-border rounded-2xl p-8 max-w-md text-center">
            <h2 className="text-xl font-bold text-white mb-2">Deck not found</h2>
            <p className="text-gray-400 mb-6">
              {deckError instanceof Error ? deckError.message : "This deck doesn't exist or you don't have access."}
            </p>
            <Link
              href="/library"
              className="inline-flex items-center gap-2 px-4 py-2 bg-app-surface hover:bg-app-hover border border-app-border rounded-lg text-white text-sm transition-colors"
            >
              Back to Library
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const sessionHref = `/study/${id}/session`

  return (
    <ProtectedRoute>
      <div className="flex-1 flex flex-col h-full bg-app-bg relative">
        <main className="flex-1 overflow-y-auto custom-scroll relative">
          {/* Header */}
          <header className="h-14 glass-panel border-b border-app-border flex items-center justify-between px-8 sticky top-0 z-20 bg-app-bg/95 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm min-w-0">
              <Link
                href="/library"
                className="text-gray-400 hover:text-white transition-colors shrink-0 flex items-center gap-1.5"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Library</span>
              </Link>
              {breadcrumbPath.map((node, index) => (
                <div key={node.id} className="flex items-center gap-2 shrink-0">
                  <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />
                  {index === breadcrumbPath.length - 1 ? (
                    <span className="text-white font-medium truncate">{node.title}</span>
                  ) : (
                    <Link
                      href={`/study/${node.id}`}
                      className="text-gray-400 hover:text-white transition-colors truncate"
                    >
                      {node.title}
                    </Link>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              aria-label="Options"
              className="p-2 rounded-lg bg-app-surface hover:bg-app-hover border border-app-border text-gray-400 hover:text-white transition-colors shrink-0"
            >
              <Settings className="w-5 h-5" />
            </button>
          </header>

          {/* Background decor */}
          <div className="absolute top-0 left-0 w-full h-80 bg-linear-to-b from-brand-primary/5 to-transparent pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 p-8">
            <div className="max-w-2xl mx-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Title */}
              <h1 className="text-3xl font-bold text-white text-center mb-10 mt-4">
                {deck.title}
              </h1>

              {/* Hero: Study Now CTA */}
              <section className="w-full flex flex-col items-center mb-10">
                <Link
                  href={sessionHref}
                  className="relative inline-flex items-center justify-center gap-2 px-10 py-5 rounded-2xl text-lg font-semibold text-white shadow-lg transition-transform active:scale-[0.98] min-w-[240px] animate-pulse bg-linear-to-r from-brand-primary via-brand-primary to-brand-secondary bg-[length_200%_100%] hover:bg-right"
                >
                  <BookOpen className="w-6 h-6" />
                  Study Now
                </Link>
                <p className="mt-3 text-gray-400 text-sm">
                  {stats?.dueToday ?? 0} cards due today
                </p>
              </section>

              {/* Stats Grid */}
              <section className="grid grid-cols-3 gap-4 w-full max-w-md mb-10">
                <div className="bg-app-surface rounded-xl border border-app-border p-4 text-center glass-panel">
                  <div className="text-2xl font-bold text-brand-secondary">
                    {stats?.newCount ?? 0}
                  </div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">
                    New
                  </div>
                </div>
                <div className="bg-app-surface rounded-xl border border-app-border p-4 text-center glass-panel">
                  <div className="text-2xl font-bold text-status-error">
                    {stats?.learningCount ?? 0}
                  </div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">
                    Learning
                  </div>
                </div>
                <div className="bg-app-surface rounded-xl border border-app-border p-4 text-center glass-panel">
                  <div className="text-2xl font-bold text-status-success">
                    {stats?.toReviewCount ?? 0}
                  </div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">
                    To Review
                  </div>
                </div>
              </section>

              {/* Sub-actions */}
              <section className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-app-surface hover:bg-app-hover border border-app-border text-white text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Card
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-app-surface hover:bg-app-hover border border-app-border text-white text-sm font-medium transition-colors"
                >
                  <LayoutGrid className="w-4 h-4" />
                  Browse Cards
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-app-surface hover:bg-app-hover border border-app-border text-white text-sm font-medium transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  Statistics
                </button>
              </section>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
