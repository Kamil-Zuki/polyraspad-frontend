"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ReactNode } from "react"

interface FolderItemProps {
  title: string
  deckCount: number
  cardCount: number
  icon: string
  color: "secondary" | "pink" | "primary"
  onClick?: () => void
  children?: ReactNode
}

export function FolderItem({ title, deckCount, cardCount, icon, color, onClick, children }: FolderItemProps) {
  // Note: onClick can be passed by parent component
  const colorClasses = {
    secondary: "group-hover:text-brand-secondary group-hover:border-brand-secondary/50",
    pink: "group-hover:text-brand-pink group-hover:border-brand-pink/50",
    primary: "group-hover:text-brand-primary group-hover:border-brand-primary/50",
  }

  return (
    <div className="relative group">
      <div
        onClick={onClick}
        className="glass-panel p-4 rounded-xl flex items-center gap-4 cursor-pointer transition-all duration-200 border border-app-border"
      >
        <div className={cn(
          "w-11 h-11 bg-app-bg border border-app-border rounded-lg flex items-center justify-center text-gray-500 transition-all duration-200",
          colorClasses[color]
        )}>
          <i className={cn(icon, "text-xl")} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-200 group-hover:text-white truncate transition-colors">
            {title}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">
            {deckCount} decks • {cardCount} cards
          </div>
        </div>
        <i className="fas fa-chevron-right text-[10px] text-gray-700 group-hover:text-white transition-colors" />
      </div>

      {/* Action slot rendered on top-right of the folder card (shown on hover) */}
      {children && (
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {children}
        </div>
      )}
    </div>
  )
}

interface LibraryDeckCardProps {
  id: string
  title: string
  image?: string
  cardCount: number
  dueCount: number
  progress: number
  isPurchased?: boolean
}

export function LibraryDeckCard({
  id,
  title,
  image,
  cardCount,
  dueCount,
  progress,
  isPurchased = false,
}: LibraryDeckCardProps) {
  const router = useRouter()

  return (
    <div
      className="glass-panel rounded-xl overflow-hidden hover:-translate-y-1 transition-all duration-300 border border-app-border hover:border-brand-primary/50 group cursor-pointer flex flex-col aspect-[4/3]"
      onClick={() => router.push(`/study/${id}`)}
    >
      {/* Cover - top ~half of card */}
      <div className="flex-[0_0_50%] min-h-0 bg-app-bg relative overflow-hidden">
        {image ? (
          <img
            src={image}
            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-all duration-500 group-hover:scale-105"
            alt={title}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center">
            <i className="fas fa-clone text-3xl text-brand-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-app-surface/90 via-transparent to-transparent" />

        {isPurchased && (
          <div className="absolute top-2 left-2 bg-brand-secondary text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
            PURCHASED
          </div>
        )}

        <div className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center opacity-0 pointer-events-none" aria-hidden />
      </div>

      {/* Content: title, progress bar, meta */}
      <div className="flex-1 min-h-0 flex flex-col p-3">
        <h3 className="text-sm font-bold text-white leading-tight mb-2 group-hover:text-brand-primary transition-colors truncate">
          {title}
        </h3>

        {/* Progress Bar - thin strip under title */}
        <div className="w-full h-0.5 bg-app-bg rounded-full mb-3 overflow-hidden flex-shrink-0">
          <div
            className={cn(
              "h-full transition-all duration-1000 ease-out",
              isPurchased ? "bg-brand-secondary" : "bg-brand-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Meta: card count + due/done */}
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-auto">
          <span className="flex items-center gap-1.5">
            <i className="fas fa-layer-group text-gray-500" /> {cardCount}
          </span>
          {dueCount > 0 ? (
            <span className="flex items-center gap-1.5 text-status-warning">
              <i className="fas fa-clock" /> {dueCount} due
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-status-success">
              <i className="fas fa-check-circle" /> Done
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
