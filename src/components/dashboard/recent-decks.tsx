"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { useProjectContext } from "@/contexts/project-context"
import { useDeckTree } from "@/lib/react-query/queries"
import { ROUTES } from "@/lib/constants"
import { useMemo } from "react"
import { DeckTreeItemDto } from "@/lib/api/types"

// Root-level decks = first 4 top-level nodes of the tree
function getRootDecks(tree: DeckTreeItemDto[]): DeckTreeItemDto[] {
  return tree.slice(0, 4)
}

export function RecentDecks() {
  const t = useTranslations("dashboard")
  const { currentProject } = useProjectContext()
  const { data: deckTree, isLoading } = useDeckTree(currentProject?.id ?? "")

  const rootDecks = useMemo(() => {
    if (!deckTree || deckTree.length === 0) return []
    return getRootDecks(deckTree)
  }, [deckTree])

  if (isLoading) {
    return (
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t("recentDecks")}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-app-surface rounded-2xl h-48 animate-pulse" />
          ))}
        </div>
      </section>
    )
  }
  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t("recentDecks")}</h3>
        <Link href={ROUTES.DECKS} className="text-xs text-brand-primary font-bold hover:text-white transition flex items-center gap-2">
          {t("viewAllDecks")} <i className="fas fa-arrow-right text-[10px]" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {rootDecks.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            {t("noDecksYet")}
          </div>
        ) : (
          rootDecks.map((deck) => (
            <Link
              key={deck.id}
              href={`/study/${deck.id}`}
              className="bg-app-surface rounded-2xl overflow-hidden border border-app-border group cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:border-brand-primary/40 hover:shadow-2xl hover:shadow-brand-primary/5 block"
            >
              <div className="h-32 bg-dark-900 relative overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 opacity-50 group-hover:opacity-100 transition duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-app-surface to-transparent opacity-60" />
                <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-lg backdrop-blur-md border border-white/10 font-bold">
                  <i className="fas fa-layer-group text-brand-primary mr-1.5" />
                  {deck.cardCount}
                </div>
              </div>
              <div className="p-5">
                <h4 className="text-white font-bold text-sm mb-1 truncate group-hover:text-brand-primary transition-colors">
                  {deck.title}
                </h4>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-4">
                  <span>Cards: <span className="text-brand-secondary">{deck.cardCount}</span></span>
                </div>
              </div>
            </Link>
          ))
        )}

        {/* Add New Deck Card */}
        <Link
          href={ROUTES.DECKS}
          className="bg-app-surface/40 rounded-2xl border-2 border-dashed border-white/5 hover:border-brand-primary/40 hover:bg-app-surface transition-all duration-300 cursor-pointer flex flex-col items-center justify-center h-full min-h-[200px] group p-6"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-brand-primary group-hover:text-white group-hover:shadow-glow text-gray-500 transition-all duration-300 border border-white/5 group-hover:border-brand-primary/50">
            <i className="fas fa-plus" />
          </div>
          <span className="text-sm font-bold text-gray-500 group-hover:text-white transition-colors">{t("createDeck")}</span>
        </Link>
      </div>
    </section>
  )
}

