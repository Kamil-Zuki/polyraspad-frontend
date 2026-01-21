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
    <header className="h-16 flex items-center justify-between px-8 z-10 bg-dark-900/80 backdrop-blur-md sticky top-0 border-b border-white/5">
      {/* Search */}
      <div className="relative w-96 group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i className="fas fa-search text-gray-500 group-focus-within:text-brand-purple transition" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-full leading-5 bg-dark-800 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-dark-700 focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 sm:text-sm transition-all"
          placeholder="Search decks, tags, or words..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-white transition">
          <i className="fas fa-bell" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-pink rounded-full" />
        </button>
        <button className="gradient-border px-4 py-1.5 text-sm font-medium text-white hover:brightness-110 transition shadow-lg shadow-purple-500/20">
          <i className="fas fa-plus mr-2" /> Create New
        </button>
      </div>
    </header>
  )
}
