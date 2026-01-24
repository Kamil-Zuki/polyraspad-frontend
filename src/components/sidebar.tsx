"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

interface NavItem {
  id: string
  label: string
  icon: string
  href: string
  group?: string
}

const navItems: NavItem[] = [
  { id: "home", label: "Dashboard", icon: "home", href: "/dashboard", group: "Learning" },
  { id: "library", label: "Library", icon: "layer-group", href: "/library", group: "Learning" },
  { id: "browser", label: "Browser", icon: "search", href: "/browser", group: "Learning" },
  { id: "editor", label: "Create Card", icon: "plus-circle", href: "/editor", group: "Studio" },
  { id: "reader", label: "Reader", icon: "book-reader", href: "/reader", group: "Studio" },
  { id: "marketplace", label: "Marketplace", icon: "store", href: "/marketplace", group: "Community" },
]

const iconMap: Record<string, string> = {
  home: "fas fa-home",
  "layer-group": "fas fa-layer-group",
  search: "fas fa-search",
  "plus-circle": "fas fa-plus-circle",
  "book-reader": "fas fa-book-reader",
  store: "fas fa-store",
}

export function Sidebar() {
  const pathname = usePathname()
  const auth = useAuth()
  const user = auth.user
  const userInitial = user?.userName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"

  const groupedItems = navItems.reduce((acc, item) => {
    const group = item.group || "Other"
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {} as Record<string, NavItem[]>)

  const getIconHoverColor = (id: string) => {
    switch (id) {
      case "library": return "group-hover:text-brand-secondary"
      case "browser": return "group-hover:text-white"
      case "editor": return "group-hover:text-brand-primary"
      case "reader": return "group-hover:text-brand-pink"
      case "marketplace": return "group-hover:text-yellow-400"
      default: return "group-hover:text-white"
    }
  }

  return (
    <aside className="w-full h-full bg-app-surface border-r border-app-border flex flex-col z-30">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-app-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold text-lg mr-3 shadow-glow">
          P
        </div>
        <span className="font-bold text-white text-lg tracking-tight">PVS.ai</span>
      </div>

      {/* Project Switcher */}
      <div className="p-4 pb-2">
        <button className="w-full bg-app-bg hover:bg-app-hover border border-app-border transition-all duration-200 rounded-xl p-3 flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-indigo-900/40 flex items-center justify-center text-lg border border-white/5">
              🇬🇧
            </div>
            <div className="text-left">
              <div className="text-[10px] text-gray-500 font-bold group-hover:text-brand-primary transition uppercase tracking-wider">
                Current Project
              </div>
              <div className="text-sm font-bold text-gray-100">English C1</div>
            </div>
          </div>
          <i className="fas fa-chevron-down text-gray-500 text-xs" />
        </button>
      </div>

      {/* Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto px-3 py-6 space-y-8 custom-scroll">
        {Object.entries(groupedItems).map(([group, items]) => (
          <nav key={group} className="space-y-1">
            <div className="px-4 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              {group}
            </div>
            {items.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "nav-item flex items-center gap-3 px-4 py-2.5 rounded-r-lg text-gray-400 hover:text-gray-100 hover:bg-white/5 transition-all duration-200 group",
                    isActive && "active"
                  )}
                >
                  <i className={cn(iconMap[item.icon] || "fas fa-circle", "w-5 text-center transition-colors", !isActive && getIconHoverColor(item.id))} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        ))}
      </div>

      {/* Streak Widget (Sticky Bottom) */}
      <div className="p-4 border-t border-app-border bg-app-surface/50 backdrop-blur-sm">
        <div className="rounded-xl bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 border border-brand-primary/20 p-3 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-12 h-12 bg-brand-primary/20 blur-xl rounded-full group-hover:bg-brand-primary/30 transition duration-500" />
          <div className="flex justify-between items-center mb-2 relative z-10">
            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">
              Streak
            </span>
            <div className="flex items-center gap-1.5 text-orange-400">
              <i className="fas fa-fire text-sm animate-pulse" />
              <span className="font-bold text-white text-sm">12</span>
            </div>
          </div>
          <div className="w-full bg-app-bg h-1.5 rounded-full overflow-hidden relative z-10">
            <div className="bg-gradient-to-r from-orange-400 to-red-500 h-full w-[65%] rounded-full shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
          </div>
          <div className="flex justify-between text-[9px] text-gray-500 mt-1.5 relative z-10">
            <span>Daily Goal</span>
            <span className="text-gray-300">13 / 20</span>
          </div>
        </div>

        {/* Profile Mini */}
        <Link
          href="/settings"
          className="mt-4 flex items-center gap-3 px-1 group cursor-pointer hover:opacity-80 transition"
        >
          <div className="relative">
            <img src={`https://i.pravatar.cc/150?u=${user?.id || 1}`} className="w-8 h-8 rounded-full border border-gray-600" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-status-success border-2 border-app-surface rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {user?.userName || user?.email?.split('@')[0] || "Kamil Karatov"}
            </div>
            <div className="text-[10px] text-gray-500 group-hover:text-gray-400 transition">
              Pro Plan
            </div>
          </div>
          <i className="fas fa-cog text-gray-600 group-hover:text-white transition" />
        </Link>
      </div>
    </aside>
  )
}
