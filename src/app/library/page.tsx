"use client"

import { useState } from "react"
import { ProjectStatsBanner } from "@/components/library/project-stats-banner"
import { FolderItem, LibraryDeckCard } from "@/components/library/library-items"
import { ProtectedRoute } from "@/components/auth/protected-route"

const DEMO_FOLDERS = [
  { title: "Grammar Rules", deckCount: 12, cardCount: 450, icon: "fas fa-folder", color: "secondary" as const },
  { title: "TV Series", deckCount: 5, cardCount: 2100, icon: "fas fa-film", color: "pink" as const },
]

const DEMO_DECKS = [
  {
    id: "1",
    title: "Business English",
    image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&q=80",
    cardCount: 120,
    dueCount: 15,
    progress: 45,
  },
  {
    id: "2",
    title: "Finance Terms",
    image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&q=80",
    cardCount: 450,
    dueCount: 0,
    progress: 10,
    isPurchased: true,
  },
]

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <ProtectedRoute>
      <div className="flex-1 flex flex-col h-full bg-app-bg relative">
        {/* Header (Breadcrumbs & Actions) */}
        <header className="h-16 glass-panel border-b border-app-border flex items-center justify-between px-8 sticky top-0 z-20">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-gray-500 hover:text-white transition cursor-pointer">Project</span>
            <i className="fas fa-chevron-right text-[10px] text-gray-700" />
            <span className="text-gray-400 hover:text-white transition cursor-pointer">English C1</span>
            <i className="fas fa-chevron-right text-[10px] text-gray-700" />
            <span className="text-white font-bold flex items-center gap-2.5">
              <i className="fas fa-layer-group text-brand-primary" /> Library
            </span>
          </div>

          {/* Search & Add */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-brand-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Filter decks..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-app-bg border border-app-border rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-brand-primary focus:outline-none w-48 transition-all focus:w-72" 
              />
            </div>
            <div className="h-6 w-px bg-app-border mx-1" />
            <button className="bg-app-surface hover:bg-white/5 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-app-border transition-all active:scale-95">
              <i className="fas fa-folder-plus mr-2" /> New Folder
            </button>
            <button className="btn-primary flex items-center gap-2 text-[10px] uppercase tracking-widest py-2">
              <i className="fas fa-plus" /> New Deck
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 relative custom-scroll">
          {/* Background Decor */}
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />

          <div className="max-w-6xl mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Project Stats Banner */}
            <ProjectStatsBanner />

            {/* Folders Section */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2.5">
                  <i className="fas fa-folder text-brand-secondary" /> Folders
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {DEMO_FOLDERS.map((folder, i) => (
                  <FolderItem key={i} {...folder} />
                ))}
              </div>
            </section>

            {/* Decks Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2.5">
                  <i className="fas fa-clone text-brand-primary" /> Root Decks
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {DEMO_DECKS.map((deck) => (
                  <LibraryDeckCard key={deck.id} {...deck} />
                ))}
                
                {/* Empty State / Add New Placeholder */}
                <button className="bg-app-surface/30 border-2 border-dashed border-white/5 rounded-2xl h-[320px] flex flex-col items-center justify-center gap-4 group hover:border-brand-primary/40 hover:bg-app-surface/50 transition-all duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-app-bg border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <i className="fas fa-plus text-gray-600 group-hover:text-brand-primary transition-colors text-2xl" />
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-sm mb-1">Create New Deck</div>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest px-6 leading-relaxed">Organize your next learning goal</p>
                  </div>
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
