"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

const DEMO_DECKS = [
  {
    id: "1",
    title: "Business English",
    image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&q=80",
    due: 15,
    new: 5,
    total: 120,
  },
  {
    id: "2",
    title: "Finance Basics",
    image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&q=80",
    due: 0,
    new: 0,
    completed: true,
  },
]

export function RecentDecks() {
  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Recent Decks</h3>
        <Link href="/library" className="text-xs text-brand-primary font-bold hover:text-white transition flex items-center gap-2">
          View Library <i className="fas fa-arrow-right text-[10px]" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {DEMO_DECKS.map((deck) => (
          <div 
            key={deck.id}
            className="bg-app-surface rounded-2xl overflow-hidden border border-app-border group cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:border-brand-primary/40 hover:shadow-2xl hover:shadow-brand-primary/5"
          >
            <div className="h-32 bg-dark-900 relative overflow-hidden">
              <img 
                src={deck.image} 
                className="w-full h-full object-cover opacity-50 group-hover:opacity-100 group-hover:scale-110 transition duration-700"
                alt={deck.title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-app-surface to-transparent opacity-60" />
              {deck.total && (
                <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-lg backdrop-blur-md border border-white/10 font-bold">
                  <i className="fas fa-layer-group text-brand-primary mr-1.5" />
                  {deck.total}
                </div>
              )}
            </div>
            <div className="p-5">
              <h4 className="text-white font-bold text-sm mb-1 truncate group-hover:text-brand-primary transition-colors">
                {deck.title}
              </h4>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-4">
                {deck.completed ? (
                  <span className="text-status-success flex items-center gap-1.5">
                    <i className="fas fa-check-circle" /> Completed
                  </span>
                ) : (
                  <>
                    <span>Due: <span className="text-status-warning">{deck.due}</span></span>
                    <span>New: <span className="text-brand-secondary">{deck.new}</span></span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Add New Deck Card */}
        <button className="bg-app-surface/40 rounded-2xl border-2 border-dashed border-white/5 hover:border-brand-primary/40 hover:bg-app-surface transition-all duration-300 cursor-pointer flex flex-col items-center justify-center h-full min-h-[200px] group p-6">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-brand-primary group-hover:text-white group-hover:shadow-glow text-gray-500 transition-all duration-300 border border-white/5 group-hover:border-brand-primary/50">
            <i className="fas fa-plus" />
          </div>
          <span className="text-sm font-bold text-gray-500 group-hover:text-white transition-colors">Create Deck</span>
        </button>
      </div>
    </section>
  )
}
