"use client"

import { DeckTreeItemDto } from "@/lib/api/types"
import { cn } from "@/lib/utils"
import { PreviewImage } from "@/components/editor/card-preview"
import { Layers, FolderOpen, Lock, Globe, Play } from "lucide-react"
import Link from "next/link"

interface DeckGalleryViewProps {
  decks: DeckTreeItemDto[]
  selectedId?: string | null
  onSelect: (deck: DeckTreeItemDto) => void
}

function flattenDecks(nodes: DeckTreeItemDto[]): DeckTreeItemDto[] {
  return nodes.flatMap((node) => [node, ...flattenDecks(node.children)])
}

function collectSubtree(nodes: DeckTreeItemDto[], targetId: string): DeckTreeItemDto[] {
  for (const node of nodes) {
    if (node.id === targetId) {
      return [node, ...flattenDecks(node.children)]
    }
    const found = collectSubtree(node.children, targetId)
    if (found.length) return found
  }
  return []
}

export function DeckGalleryView({ decks, selectedId, onSelect }: DeckGalleryViewProps) {
  const visibleDecks = selectedId ? collectSubtree(decks, selectedId) : flattenDecks(decks)

  if (visibleDecks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-app-surface/30 p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-app-bg border border-white/5 flex items-center justify-center mb-4">
          <Layers className="h-7 w-7 text-gray-600" />
        </div>
        <p className="text-white font-medium mb-1">No decks here</p>
        <p className="text-sm text-gray-500">Select another folder or create a new deck.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {visibleDecks.map((deck) => {
        const total = deck.stats?.totalCardsCount ?? deck.cardCount
        const studyable = deck.stats?.studyableNowCount ?? 0
        const due = deck.stats?.dueCardsCount ?? 0
        const isFolder = deck.children.length > 0

        return (
          <div
            key={deck.id}
            onClick={() => onSelect(deck)}
            className={cn(
              "group relative overflow-hidden rounded-2xl border border-white/10 bg-app-surface/50 transition-all duration-300 hover:border-brand-primary/40 hover:shadow-lg hover:shadow-brand-primary/5 cursor-pointer flex flex-col"
            )}
          >
            {/* Cover */}
            <div className="relative aspect-[4/3] overflow-hidden bg-app-bg">
              {deck.coverImageUrl ? (
                <PreviewImage
                  src={deck.coverImageUrl}
                  alt={deck.title}
                  className="h-full w-full"
                  imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10">
                  {isFolder ? (
                    <FolderOpen className="h-12 w-12 text-brand-primary/40" />
                  ) : (
                    <Layers className="h-12 w-12 text-brand-primary/40" />
                  )}
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                {deck.isPublic ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                    <Globe className="h-3 w-3" /> Public
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-300 border border-white/10">
                    <Lock className="h-3 w-3" /> Private
                  </span>
                )}
                {deck.forkedFromId && (
                  <span className="rounded-md bg-brand-secondary/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-secondary border border-brand-secondary/20">
                    Purchased
                  </span>
                )}
              </div>

              {/* Hover overlay with Study */}
              {!isFolder && (
                <div className="absolute inset-0 flex items-end justify-end p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-t from-black/60 to-transparent">
                  <Link
                    href={`/study/${deck.id}/session`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-xs font-bold text-white shadow-lg hover:bg-brand-primary/90 transition"
                  >
                    <Play className="h-3.5 w-3.5" /> Study
                  </Link>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col p-4">
              <h3 className="truncate text-sm font-bold text-white mb-1" title={deck.title}>
                {deck.title}
              </h3>
              <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
                <span>{total} card{total !== 1 ? "s" : ""}</span>
                {studyable > 0 ? (
                  <span className="text-amber-500 font-medium">{studyable} to study</span>
                ) : due > 0 ? (
                  <span className="text-blue-400 font-medium">{due} due</span>
                ) : null}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { flattenDecks, collectSubtree }
