"use client"

import { Suspense, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/auth/protected-route"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return window.localStorage.getItem("app-sidebar-collapsed") === "true"
  })
  
  // Level 1 Pages (Launcher) and specialized tools according to IA
  // Focus Mode: /study and /study/* — fullscreen, no sidebar (per IA)
  const isGlobalPage =
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/projects" ||
    pathname === "/editor" ||
    pathname === "/study" ||
    pathname.startsWith("/study/") ||
    pathname.startsWith("/marketplace/product/")

  const hasDedicatedShellHeader = pathname === "/decks" || pathname === "/library"
  const headerHeightClass = pathname === "/marketplace" ? "h-20" : "h-16"

  useEffect(() => {
    window.localStorage.setItem("app-sidebar-collapsed", String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  if (isGlobalPage) {
    return <div className="min-h-screen bg-app-bg text-gray-400 font-sans selection:bg-brand-primary selection:text-white">{children}</div>
  }

  return (
    <div className="flex h-screen bg-app-bg text-gray-400 font-sans selection:bg-brand-primary selection:text-white">
      <div
        className={`${
          isSidebarCollapsed ? "w-[88px] min-w-[88px]" : "w-[260px] min-w-[260px]"
        } relative z-30 flex-shrink-0 transition-[width,min-width] duration-300`}
      >
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
        />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!hasDedicatedShellHeader && (
          <Suspense
            fallback={
              <div className={`${headerHeightClass} glass border-b border-app-border sticky top-0 z-20`} />
            }
          >
            <Header />
          </Suspense>
        )}
        <main className="flex-1 overflow-y-auto relative">
          {/* Background Gradient Decoration from IA */}
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />
          <div className="relative z-10 h-full">
            <ProtectedRoute>{children}</ProtectedRoute>
          </div>
        </main>
      </div>
    </div>
  )
}
