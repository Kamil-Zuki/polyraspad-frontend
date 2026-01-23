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
  { id: "home", label: "Home", icon: "home", href: "/", group: "Learning" },
  { id: "library", label: "Library", icon: "layer-group", href: "/library", group: "Learning" },
  { id: "study", label: "Study Now", icon: "play", href: "/study", group: "Learning" },
  { id: "browser", label: "Card Browser", icon: "search", href: "/browser", group: "Learning" },
  { id: "generator", label: "Generator", icon: "magic", href: "/generator", group: "AI Tools" },
  { id: "reader", label: "Reader", icon: "book-reader", href: "/reader", group: "AI Tools" },
  { id: "import", label: "Import", icon: "file-import", href: "/import", group: "AI Tools" },
  { id: "marketplace", label: "Marketplace", icon: "store", href: "/marketplace", group: "Community" },
  { id: "subscriptions", label: "Subscriptions", icon: "users", href: "/subscriptions", group: "Community" },
]

const iconMap: Record<string, string> = {
  home: "fas fa-home",
  "layer-group": "fas fa-layer-group",
  play: "fas fa-play",
  search: "fas fa-search",
  magic: "fas fa-magic",
  "book-reader": "fas fa-book-reader",
  "file-import": "fas fa-file-import",
  store: "fas fa-store",
  users: "fas fa-users",
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

  return (
    <aside className="w-64 h-full bg-dark-800 border-r border-white/5 flex flex-col flex-shrink-0 z-20">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-5 border-b border-white/5">
        <div className="w-7 h-7 rounded bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center text-white font-bold text-sm mr-3 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
          P
        </div>
        <span className="font-bold text-gray-100 text-lg tracking-tight">PVS.ai</span>
      </div>

      {/* Project Switcher */}
      <div className="p-4 pb-2">
        <button className="w-full bg-dark-700 hover:bg-white/10 transition-colors rounded-xl p-3 flex items-center justify-between border border-white/5 group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-900/50 flex items-center justify-center text-xl">
              📚
            </div>
            <div className="text-left">
              <div className="text-xs text-gray-400 font-medium group-hover:text-brand-purple transition">
                Current Project
              </div>
              <div className="text-sm font-bold text-white">My Projects</div>
            </div>
          </div>
          <i className="fas fa-chevron-down text-gray-500 text-xs" />
        </button>
      </div>

      {/* Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 custom-scroll">
        {/* Streak Widget */}
        <div className="bg-gradient-to-r from-brand-purple/10 to-brand-pink/5 border border-brand-purple/20 rounded-xl p-3 mx-1">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-brand-purple uppercase tracking-widest">
              Streak Power
            </span>
            <div className="flex items-center gap-1 text-orange-400">
              <i className="fas fa-fire text-sm animate-pulse" />
              <span className="font-bold text-white">0</span>
            </div>
          </div>
          <div className="w-full bg-dark-900/50 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-orange-400 to-red-500 h-full w-[0%] rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
          </div>
          <div className="flex justify-between text-[9px] text-gray-400 mt-1">
            <span>Daily Goal</span>
            <span>0/20 New</span>
          </div>
        </div>

        {/* Navigation Groups */}
        {Object.entries(groupedItems).map(([group, items]) => (
          <div key={group} className="space-y-1">
            <div className="px-3 mb-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              {group}
            </div>
            {items.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all group",
                    isActive && "active"
                  )}
                >
                  <i className={cn(iconMap[item.icon] || "fas fa-circle", "w-5 text-center transition-colors")} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.id === "study" && (
                    <span className="bg-brand-purple/20 text-brand-purple text-[10px] font-bold px-1.5 py-0.5 rounded border border-brand-purple/30 ml-auto">
                      0
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}

        {/* Creator Studio */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <Link
            href="/creator"
            className="nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 bg-white/5 hover:bg-white/10 transition-all border border-white/5"
          >
            <i className="fas fa-pen-nib w-5 text-center text-brand-pink" />
            <span className="text-sm font-medium">Creator Studio</span>
          </Link>
        </div>

        <div className="h-4" />
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-white/5 bg-dark-900/30">
        <Link
          href="/settings"
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center text-white font-bold text-sm border border-gray-600 group-hover:border-brand-purple transition">
              {userInitial}
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-dark-800 rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate group-hover:text-brand-purple transition">
              {user?.userName || user?.email || "User"}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1 group-hover:text-gray-400 transition">
              <i className="fas fa-cog" /> Settings
            </div>
          </div>
        </Link>
      </div>
    </aside>
  )
}
