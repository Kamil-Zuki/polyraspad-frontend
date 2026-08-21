"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { MoreHorizontal, Layers, Clock, Play, Pencil, Trash2, Settings } from "lucide-react"
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

export interface LibraryDeckCardProps {
  id: string
  title: string
  /** Cover image URL. Also accepts `imageUrl` for API compatibility. */
  image?: string
  imageUrl?: string
  /** Total cards in deck. Also accepts `totalCards`. */
  cardCount?: number
  totalCards?: number
  /** Cards due for review. Also accepts `dueCards`. Prefer `studyableCount` for deck list. */
  dueCount?: number
  dueCards?: number
  /** Cards ready to study now (new + due learning/review). Matches deck overview. */
  studyableCount?: number
  progress: number
  isPurchased?: boolean
  /** Called when user chooses Edit in the deck menu. */
  onEdit?: () => void
  /** Called when user chooses Settings in the deck menu. */
  onSettings?: () => void
  /** Called when user chooses Delete in the deck menu. */
  onDelete?: () => void
  /** Called when the card body is clicked. */
  onClick?: () => void
}

/** Deck card for library grid. Pixel-perfect: dark surface, border hover, cover with gradient, progress, footer with stats and Study. */
export function LibraryDeckCard({
  title,
  image,
  imageUrl,
  cardCount = 0,
  totalCards,
  dueCount = 0,
  dueCards,
  studyableCount,
  progress,
  isPurchased = false,
  onEdit,
  onSettings,
  onDelete,
  onClick,
}: LibraryDeckCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const imgSrc = image ?? imageUrl
  const total = totalCards ?? cardCount
  const due = studyableCount ?? dueCards ?? dueCount

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        buttonRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return
      setMenuOpen(false)
      setMenuPosition(null)
    }
    document.addEventListener("click", close)
    return () => document.removeEventListener("click", close)
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen || typeof document === "undefined") return
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) setMenuPosition({ top: rect.top, right: window.innerWidth - rect.right })
  }, [menuOpen])

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMenuOpen((v) => !v)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMenuOpen(false)
    setMenuPosition(null)
    onEdit?.()
  }

  const handleSettings = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMenuOpen(false)
    setMenuPosition(null)
    onSettings?.()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMenuOpen(false)
    setMenuPosition(null)
    onDelete?.()
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-app-surface rounded-2xl overflow-hidden flex flex-col aspect-4/3",
        "border border-white/10 transition-all duration-300",
        "hover:border-brand-primary/50 hover:shadow-[0_0_24px_rgba(139,92,246,0.12)]",
        "group cursor-pointer"
      )}
    >
      {/* Cover — ~40–50% height, gradient overlay, menu on hover */}
      <div className="flex-[0_0_45%] min-h-0 bg-app-surface relative overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc}
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
            alt=""
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center">
            <Layers className="w-10 h-10 text-brand-primary/30" />
          </div>
        )}
        <div
          className="absolute inset-0 pointer-events-none bg-gradient-to-t from-app-surface via-transparent to-transparent"
          aria-hidden
        />
        {isPurchased && (
          <div className="absolute top-2 left-2 bg-brand-secondary text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
            PURCHASED
          </div>
        )}
        <div className="absolute top-2 right-2 z-20">
          <button
            ref={buttonRef}
            type="button"
            onClick={handleMenuClick}
            className="w-8 h-8 rounded-md bg-black/40 border border-white/20 flex items-center justify-center text-white/90 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
            aria-label="Deck menu"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content: title, progress bar, divider, footer */}
      <div className="flex-1 min-h-0 flex flex-col p-3">
        <h3 className="text-sm font-bold text-brand-primary leading-tight truncate mb-2">
          {title}
        </h3>
        <div className="w-full h-1.5 bg-app-bg rounded-full overflow-hidden shrink-0 mb-3">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              isPurchased ? "bg-brand-secondary" : "bg-brand-primary"
            )}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        <div className="border-t border-white/5 mt-auto pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                {total}
              </span>
              <span className="flex items-center gap-1.5 text-amber-500">
                <Clock className="w-3.5 h-3.5" />
                {due} to study
              </span>
            </div>
            <span className="flex items-center gap-1.5 text-white font-medium text-xs hover:text-white/90 transition-colors">
              <Play className="w-3.5 h-3.5" />
              Study
            </span>
          </div>
        </div>
      </div>

      {/* Dropdown rendered in portal so it is not clipped by overflow-hidden */}
      {menuOpen &&
        menuPosition != null &&
        (onEdit != null || onSettings != null || onDelete != null) &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            className="min-w-[120px] py-1 rounded-lg bg-app-surface border border-white/10 shadow-xl z-[100]"
            style={{
              position: "fixed",
              top: menuPosition.top,
              right: menuPosition.right,
              transform: "translateY(-100%) translateY(-8px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {onEdit != null && (
              <button
                type="button"
                onClick={handleEdit}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
            {onSettings != null && (
              <button
                type="button"
                onClick={handleSettings}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white"
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </button>
            )}
            {onDelete != null && (
              <button
                type="button"
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>,
          document.body
        )}
    </div>
  )
}
