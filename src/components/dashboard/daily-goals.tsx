"use client"

import Link from "next/link"
import { useProjectContext } from "@/contexts/project-context"
import { useDailySummary, useDeckTree } from "@/lib/react-query/queries"
import type { DeckTreeItemDto } from "@/lib/api/types"

export function DailyGoals() {
  const { currentProject } = useProjectContext()
  const { data: dailySummary, isLoading } = useDailySummary(currentProject?.id, {
    enabled: !!currentProject?.id,
  })
  const { data: deckTree } = useDeckTree(currentProject?.id ?? "")

  const reviews = dailySummary?.reviews || { current: 0, target: 0, isCompleted: false }
  const newCards = dailySummary?.newCards || { current: 0, target: 0, isCompleted: false }
  
  const reviewsProgress = reviews.target > 0 ? Math.min((reviews.current / reviews.target) * 100, 100) : 0
  const newCardsProgress = newCards.target > 0 ? Math.min((newCards.current / newCards.target) * 100, 100) : 0
  
  const reviewsRemaining = Math.max(reviews.target - reviews.current, 0)
  const newCardsRemaining = Math.max(newCards.target - newCards.current, 0)
  const hasReviewGoal = reviews.target > 0
  const hasNewGoal = newCards.target > 0

  if (isLoading) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-panel p-6 rounded-2xl border-app-border h-48 animate-pulse" />
        ))}
      </section>
    )
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Goal: Reviews */}
      <div className="glass-panel p-6 rounded-2xl border-app-border relative overflow-hidden group hover:border-brand-secondary/30 transition-all duration-300">
        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
          <i className="fas fa-sync-alt text-7xl text-brand-secondary" />
        </div>
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <div className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest mb-1">Reviews</div>
            <div className="text-3xl font-bold text-white">
              {reviews.current} <span className="text-sm text-gray-500 font-normal">/ {reviews.target}</span>
            </div>
          </div>
        </div>
        <div className="w-full bg-app-bg h-1.5 rounded-full overflow-hidden relative z-10">
          <div 
            className="bg-brand-secondary h-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-700" 
            style={{ width: `${reviewsProgress}%` }}
          />
        </div>
        <div className="mt-4 text-xs text-gray-500 relative z-10">
          {!hasReviewGoal ? (
            <>
              Set a daily review goal in{" "}
              <Link href="/profile" className="text-brand-secondary hover:text-white transition">
                Profile
              </Link>
              .
            </>
          ) : reviewsRemaining > 0 ? (
            `${reviewsRemaining} cards remaining to maintain memory.`
          ) : (
            "Daily goal completed! 🎉"
          )}
        </div>
      </div>

      {/* Goal: New Words */}
      <div className="glass-panel p-6 rounded-2xl border-app-border relative overflow-hidden group hover:border-brand-primary/30 transition-all duration-300">
        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
          <i className="fas fa-plus-circle text-7xl text-brand-primary" />
        </div>
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <div className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1">New Words</div>
            <div className="text-3xl font-bold text-white">
              {newCards.current} <span className="text-sm text-gray-500 font-normal">/ {newCards.target}</span>
            </div>
          </div>
          {newCards.isCompleted && (
            <div className="w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center border border-brand-primary/30">
              <i className="fas fa-check text-xs" />
            </div>
          )}
        </div>
        <div className="w-full bg-app-bg h-1.5 rounded-full overflow-hidden relative z-10">
          <div 
            className="bg-brand-primary h-full shadow-[0_0_10px_rgba(139,92,246,0.5)] transition-all duration-700" 
            style={{ width: `${newCardsProgress}%` }}
          />
        </div>
        <div className="mt-4 text-xs text-gray-500 relative z-10">
          {!hasNewGoal ? (
            <>
              Set a daily new cards goal in{" "}
              <Link href="/profile" className="text-brand-secondary hover:text-white transition">
                Profile
              </Link>
              .
            </>
          ) : newCardsRemaining > 0 ? (
            `Great pace! ${newCardsRemaining} more to reach daily target.`
          ) : (
            "Daily goal completed! 🎉"
          )}
        </div>
      </div>

      {/* Continue / Study Now banner */}
      <ContinueBanner
        currentProject={currentProject}
        deckTree={deckTree}
      />
    </section>
  )
}

function ContinueBanner({
  currentProject,
  deckTree,
}: {
  currentProject: { id: string; title: string } | null
  deckTree: DeckTreeItemDto[] | undefined
}) {
  const firstDeck = deckTree?.[0]

  if (!currentProject) {
    return (
      <Link
        href="/projects"
        className="relative rounded-2xl overflow-hidden border border-app-border group cursor-pointer shadow-lg hover:shadow-brand-primary/10 transition-all duration-500 flex flex-col items-center justify-center min-h-[200px] p-6 bg-app-surface/60"
      >
        <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 flex items-center justify-center mb-4 border border-brand-primary/30 group-hover:bg-brand-primary/30 transition">
          <i className="fas fa-folder-plus text-xl text-brand-primary" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">No project selected</h3>
        <p className="text-xs text-gray-400 mb-4 text-center">Create or select a project to start studying.</p>
        <span className="bg-white text-app-bg px-5 py-2.5 rounded-xl text-xs font-bold inline-block">
          Go to projects
        </span>
      </Link>
    )
  }

  if (!firstDeck) {
    return (
      <Link
        href="/library"
        className="relative rounded-2xl overflow-hidden border border-app-border group cursor-pointer shadow-lg hover:shadow-brand-primary/10 transition-all duration-500 flex flex-col items-center justify-center min-h-[200px] p-6 bg-app-surface/60"
      >
        <div className="w-12 h-12 rounded-2xl bg-brand-pink/20 flex items-center justify-center mb-4 border border-brand-pink/30 group-hover:bg-brand-pink/30 transition">
          <i className="fas fa-layer-group text-xl text-brand-pink" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">No decks yet</h3>
        <p className="text-xs text-gray-400 mb-4 text-center">Create your first deck in the library to start learning.</p>
        <span className="bg-white text-app-bg px-5 py-2.5 rounded-xl text-xs font-bold inline-block">
          Open Library
        </span>
      </Link>
    )
  }

  return (
    <Link
      href={`/study/${firstDeck.id}`}
      className="relative rounded-2xl overflow-hidden border border-app-border group cursor-pointer shadow-lg hover:shadow-brand-primary/10 transition-all duration-500 block"
    >
      <img
        src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80"
        className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition duration-700"
        alt=""
      />
      <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-app-bg/60 to-transparent" />
      <div className="absolute bottom-0 left-0 p-6 w-full">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-1 bg-brand-pink/20 text-brand-pink text-[10px] font-bold rounded uppercase backdrop-blur-md border border-brand-pink/30 tracking-widest">
            Continue
          </span>
        </div>
        <h3 className="text-xl font-bold text-white mb-1">{firstDeck.title}</h3>
        <p className="text-xs text-gray-400 mb-5">{firstDeck.cardCount} cards</p>
        <span className="bg-white text-app-bg px-5 py-2.5 rounded-xl text-xs font-bold inline-block shadow-xl group-hover:bg-gray-200 transition-all">
          Study Now
        </span>
      </div>
    </Link>
  )
}
