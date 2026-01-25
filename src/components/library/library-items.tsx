"use client"

import { cn } from "@/lib/utils"

interface FolderItemProps {
  title: string
  deckCount: number
  cardCount: number
  icon: string
  color: "secondary" | "pink" | "primary"
}

export function FolderItem({ title, deckCount, cardCount, icon, color }: FolderItemProps) {
  // Note: onClick is handled by parent component
  const colorClasses = {
    secondary: "group-hover:text-brand-secondary group-hover:border-brand-secondary/50",
    pink: "group-hover:text-brand-pink group-hover:border-brand-pink/50",
    primary: "group-hover:text-brand-primary group-hover:border-brand-primary/50",
  }

  const iconColorClasses = {
    secondary: "text-brand-secondary",
    pink: "text-brand-pink",
    primary: "text-brand-primary",
  }

  return (
    <div className="glass-panel p-5 rounded-2xl flex items-center gap-5 cursor-pointer group transition-all duration-300 hover:-translate-y-1">
      <div className={cn(
        "w-12 h-12 bg-app-bg border border-app-border rounded-xl flex items-center justify-center text-gray-500 transition-all duration-300",
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
  )
}

interface LibraryDeckCardProps {
  title: string
  image: string
  cardCount: number
  dueCount: number
  progress: number
  isPurchased?: boolean
}

export function LibraryDeckCard({
  title,
  image,
  cardCount,
  dueCount,
  progress,
  isPurchased = false,
}: LibraryDeckCardProps) {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden hover:-translate-y-1.5 transition-all duration-300 border-app-border hover:border-brand-primary/50 group cursor-pointer shadow-xl">
      {/* Cover */}
      <div className="h-36 bg-app-bg relative overflow-hidden">
        <img 
          src={image} 
          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" 
          alt={title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-app-surface to-transparent opacity-80" />
        
        {isPurchased && (
          <div className="absolute top-3 left-3 bg-brand-secondary text-white text-[9px] font-bold px-2 py-1 rounded-lg backdrop-blur-md shadow-lg uppercase tracking-widest border border-white/10">
            Purchased
          </div>
        )}

        {/* Menu */}
        <button className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-black/60 rounded-lg text-gray-300 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-md border border-white/5">
          <i className="fas fa-ellipsis-h" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 pt-3">
        <h3 className="text-base font-bold text-white leading-tight mb-4 group-hover:text-brand-primary transition-colors truncate">
          {title}
        </h3>
        
        {/* Progress Bar */}
        <div className="w-full h-1 bg-app-bg rounded-full mb-5 overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-1000 ease-out",
              isPurchased ? "bg-brand-secondary shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-brand-primary shadow-[0_0_8px_rgba(139,92,246,0.5)]"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500 pt-4 border-t border-white/5">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5 transition-colors group-hover:text-gray-300">
              <i className="fas fa-clone text-brand-primary" /> {cardCount}
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
          
          {/* Hover CTA */}
          <button className="text-white hover:text-brand-primary transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1.5">
            <i className="fas fa-play text-[8px]" /> Study
          </button>
        </div>
      </div>
    </div>
  )
}
