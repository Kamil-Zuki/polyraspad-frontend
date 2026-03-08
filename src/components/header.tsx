"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { ROUTES } from "@/lib/constants"
import { useProjectContext } from "@/contexts/project-context"

export function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isPending, startTransition] = useTransition()
  const auth = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { currentProject } = useProjectContext()

  const handleLogout = async () => {
    await auth.logout()
    startTransition(() => {
      router.push(ROUTES.AUTH)
    })
  }

  // Simple breadcrumb logic based on pathname
  const getBreadcrumbs = () => {
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length === 0) return [{ label: 'Dashboard', active: true }]
    
    return parts.map((part, index) => ({
      label: part.charAt(0).toUpperCase() + part.slice(1),
      active: index === parts.length - 1
    }))
  }

  const breadcrumbs = getBreadcrumbs()
  const isMarketplace = pathname === '/marketplace'
  const isProductPage = pathname.startsWith('/marketplace/product/')

  return (
    <header className="h-16 flex items-center justify-between px-8 z-20 glass sticky top-0 border-b border-app-border">
      {/* Breadcrumbs / Title */}
      <div className="flex items-center gap-2 text-sm">
        {isProductPage ? (
          <button 
            onClick={() => router.push('/marketplace')}
            className="text-sm font-medium hover:text-white transition flex items-center gap-2 text-gray-400"
          >
            <i className="fas fa-arrow-left" /> Back to Marketplace
          </button>
        ) : (
          <>
            <span className="text-gray-500 hover:text-white transition cursor-pointer">Project</span>
            {breadcrumbs.map((crumb, i) => (
              <div key={crumb.label} className="flex items-center gap-2">
                <i className="fas fa-chevron-right text-[10px] text-gray-700" />
                <span className={crumb.active ? "text-gray-100 font-semibold" : "text-gray-500 hover:text-white transition cursor-pointer"}>
                  {crumb.label}
                </span>
              </div>
            ))}
          </>
        )}
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
          placeholder={isMarketplace ? "Search for decks, topics, or authors..." : "Search cards, decks or tags..."}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-gray-600 text-xs border border-gray-700 rounded px-1.5 py-0.5 uppercase">
            Ctrl+K
          </span>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-4">
        {isMarketplace ? (
          <>
            <button className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition mr-2">
              <i className="fas fa-filter" /> Filters
            </button>
            <div className="h-6 w-px bg-app-border" />
            <button className="bg-app-surface hover:bg-app-hover border border-app-border text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              <i className="fas fa-upload mr-2" /> Sell Your Deck
            </button>
          </>
        ) : (
          <>
            <button className="relative p-2 text-gray-400 hover:text-white transition">
              <i className="far fa-bell" />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-brand-pink rounded-full border border-app-surface" />
            </button>

            <Link
              href={currentProject ? "/library" : "/projects"}
              className="btn-primary flex items-center gap-2 py-2"
            >
              <i className="fas fa-play text-xs" /> Study Now
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
