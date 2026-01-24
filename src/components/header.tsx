"use client"

import { useState, useTransition } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/constants"

export function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isPending, startTransition] = useTransition()
  const auth = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await auth.logout()
    startTransition(() => {
      router.push(ROUTES.AUTH)
    })
  }

  return (
    <header className="h-16 flex items-center justify-between px-8 z-20 glass sticky top-0 border-b border-app-border">
      {/* Breadcrumbs / Title */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500 hover:text-white transition cursor-pointer">Project</span>
        <i className="fas fa-chevron-right text-[10px] text-gray-700" />
        <span className="text-gray-100 font-semibold">Dashboard</span>
      </div>

      {/* Global Search */}
      <div className="relative w-96 group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i className="fas fa-search text-gray-600 group-focus-within:text-brand-primary transition-colors" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-app-border rounded-lg leading-5 bg-app-surface text-gray-300 placeholder-gray-600 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary sm:text-sm transition-all duration-200"
          placeholder="Search cards, decks or tags..."
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-gray-600 text-xs border border-gray-700 rounded px-1.5 py-0.5 uppercase">
            Ctrl+K
          </span>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-white transition">
          <i className="far fa-bell" />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-brand-pink rounded-full border border-app-surface" />
        </button>
        
        <button className="btn-primary flex items-center gap-2 py-2">
          <i className="fas fa-play text-xs" /> Study
        </button>
      </div>
    </header>
  )
}
