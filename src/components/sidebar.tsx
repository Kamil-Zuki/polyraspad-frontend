"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavItem {
  id: string
  label: string
  icon: string
  href: string
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Главная", icon: "🏠", href: "/" },
  { id: "projects", label: "Проекты", icon: "📚", href: "/projects" },
  { id: "study", label: "Обучение", icon: "📖", href: "/study" },
  { id: "marketplace", label: "Маркетплейс", icon: "🛒", href: "/marketplace" },
  { id: "community", label: "Сообщество", icon: "👥", href: "/community" },
  { id: "statistics", label: "Статистика", icon: "📊", href: "/statistics" },
  { id: "settings", label: "Настройки", icon: "⚙️", href: "/settings" },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <h1 className="text-xl font-bold text-gray-900">Polyraspad</h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={collapsed ? "Развернуть" : "Свернуть"}
        >
          <span className="text-lg">{collapsed ? "→" : "←"}</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!collapsed && (
          <div className="text-xs text-gray-500">
            <p>© 2025 Polyraspad</p>
          </div>
        )}
      </div>
    </aside>
  )
}
