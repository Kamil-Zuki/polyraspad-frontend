"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export function GlobalNav() {
  const { user } = useAuth()
  const userInitial = user?.userName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"

  return (
    <nav className="w-full h-20 flex items-center justify-center border-b border-white/5 bg-app-bg/50 backdrop-blur-sm sticky top-0 z-20">
      <div className="w-full max-w-6xl px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/projects" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold shadow-glow group-hover:scale-105 transition-transform">
            P
          </div>
          <span className="font-bold text-xl tracking-tight text-white">PVS.ai</span>
        </Link>

        {/* Global Actions & User Profile */}
        <div className="flex items-center gap-6">
          <Link href="/docs" className="text-sm font-medium hover:text-white transition">Docs</Link>
          <Link href="/support" className="text-sm font-medium hover:text-white transition">Support</Link>
          <div className="h-6 w-px bg-white/10" />
          
          <Link href="/profile" className="flex items-center gap-3 cursor-pointer group hover:opacity-80 transition">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-white group-hover:text-brand-primary transition">
                {user?.userName || user?.email?.split('@')[0] || "User"}
              </div>
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Pro Plan</div>
            </div>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold text-sm border border-gray-600 group-hover:border-brand-primary transition">
                {userInitial}
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-status-success border-2 border-app-bg rounded-full" />
            </div>
          </Link>
        </div>
      </div>
    </nav>
  )
}
