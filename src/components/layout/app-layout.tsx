"use client"

import { Suspense } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/auth/protected-route"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Level 1 Pages (Launcher) and specialized tools according to IA
  // Focus Mode: /study and /study/* — fullscreen, no sidebar (per IA)
  const isGlobalPage =
    pathname === "/auth" ||
    pathname === "/projects" ||
    pathname === "/editor" ||
    pathname === "/study" ||
    pathname.startsWith("/study/") ||
    pathname.startsWith("/marketplace/product/")

  const hasDedicatedShellHeader = pathname === "/library"
  const headerHeightClass = pathname === "/marketplace" ? "h-20" : "h-16"

  if (isGlobalPage) {
    return <div className="min-h-screen bg-app-bg text-gray-400 font-sans selection:bg-brand-primary selection:text-white">{children}</div>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-app-bg text-gray-400 font-sans selection:bg-brand-primary selection:text-white">
      <div className="w-[260px] flex-shrink-0">
        <Sidebar />
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
