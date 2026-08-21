"use client"

import { useAuth } from "@/contexts/auth-context"
import { redirect } from "next/navigation"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    redirect("/")
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex-none h-14 border-b border-app-surface flex items-center px-6">
        <h1 className="text-lg font-semibold text-brand-primary">Admin Dashboard</h1>
      </header>
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}
