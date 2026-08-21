"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { useProjectContext } from "@/contexts/project-context"
import { useOmnibar } from "@/contexts/omnibar-context"
import { ROUTES } from "@/lib/constants"

export function Header() {
  const t = useTranslations()
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { currentProject } = useProjectContext()
  const { open } = useOmnibar()

  // Simple breadcrumb logic based on pathname
  const getBreadcrumbs = () => {
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length === 0) return [{ label: t("nav.dashboard"), active: true }]
    
    return parts.map((part, index) => ({
      label: part.charAt(0).toUpperCase() + part.slice(1),
      active: index === parts.length - 1
    }))
  }

  const breadcrumbs = getBreadcrumbs()
  const isMarketplace = pathname === '/marketplace'

  useEffect(() => {
    if (!isMarketplace) return
    const query = searchParams.get("q") ?? ""
    setSearchQuery((prev) => (prev === query ? prev : query))
  }, [isMarketplace, searchParams])

  useEffect(() => {
    if (!isMarketplace) return

    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim())
      } else {
        params.delete("q")
      }

      const next = params.toString() ? `${pathname}?${params.toString()}` : pathname
      const current = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname
      if (next !== current) {
        router.replace(next)
      }
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [isMarketplace, pathname, router, searchParams, searchQuery])

  if (isMarketplace) {
    return (
      <header className="h-20 flex items-center justify-between px-8 z-20 glass sticky top-0 border-b border-app-border">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-xl group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <i className="fas fa-search text-gray-500 group-focus-within:text-brand-primary transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-app-bg border border-app-border rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
              placeholder="Search for decks, topics, or authors..."
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition">
            <i className="fas fa-filter" /> {t("common.filters")}
          </button>
          <div className="h-6 w-px bg-app-border" />
          <Link
            href="/import"
            className="bg-app-surface hover:bg-app-hover border border-app-border text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <i className="fas fa-upload mr-2" /> Sell Your Deck
          </Link>
        </div>
      </header>
    )
  }

  return (
    <header className="h-16 flex items-center justify-between px-8 z-20 glass sticky top-0 border-b border-app-border">
      {/* Breadcrumbs / Title */}
      <div className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.label} className="flex items-center gap-2">
            {index > 0 && <i className="fas fa-chevron-right text-[10px] text-gray-700" />}
            <span className={crumb.active ? "text-gray-100 font-semibold" : "text-gray-500 hover:text-white transition cursor-pointer"}>
              {crumb.label}
            </span>
          </div>
        ))}
      </div>

      {/* Global Omnibar trigger */}
      {!isMarketplace && (
        <button
          type="button"
          onClick={() => open()}
          className="absolute left-1/2 top-1/2 w-80 lg:w-96 -translate-x-1/2 -translate-y-1/2 group flex items-center gap-3 rounded-xl border border-app-border bg-app-surface px-4 py-2 text-sm text-gray-400 shadow-sm transition-all hover:border-brand-primary/40 hover:bg-app-hover hover:text-white"
          aria-label="Open command palette"
        >
          <Search className="h-4 w-4 text-gray-500 group-hover:text-brand-primary transition-colors" />
          <span className="flex-1 text-left">{t("common.searchPlaceholder")}</span>
          <kbd className="rounded border border-gray-700 bg-app-bg px-1.5 py-0.5 text-[10px] uppercase text-gray-500">
            Ctrl+K
          </kbd>
        </button>
      )}

      {/* Header Actions */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-white transition">
          <i className="far fa-bell" />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-brand-pink rounded-full border border-app-surface" />
        </button>

        <Link
          href={currentProject ? ROUTES.DECKS : ROUTES.PROJECTS}
          className="btn-primary flex items-center gap-2 py-2"
        >
          <i className="fas fa-play text-xs" /> {t("common.studyNow")}
        </Link>
      </div>
    </header>
  )
}

