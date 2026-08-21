"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useProfileAvatar } from "@/hooks/use-profile-avatar"
import polyraspadLogo from "@/assets/polyraspad-logo.png"

export function GlobalNav() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { avatarUrl } = useProfileAvatar()
  const userInitial = user?.userName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      router.push("/auth")
    } catch {
      router.push("/auth")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <nav className="w-full h-20 flex items-center justify-center border-b border-white/5 bg-app-bg/50 backdrop-blur-sm sticky top-0 z-20">
      <div className="w-full max-w-6xl px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/projects" className="flex items-center gap-3 group">
          <Image
            src={polyraspadLogo}
            alt="Polyraspad logo"
            priority
            className="h-10 w-10 rounded-xl object-cover shadow-glow group-hover:scale-105 transition-transform"
          />
          <span className="font-bold text-xl tracking-tight text-white">Polyraspad</span>
        </Link>

        {/* Global Actions & User Profile */}
        <div className="flex items-center gap-6">
          <Link href="/docs" className="text-sm font-medium hover:text-white transition">Docs</Link>
          <Link href="/support" className="text-sm font-medium hover:text-white transition">Support</Link>
          <div className="h-6 w-px bg-white/10" />
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-sm font-medium text-gray-400 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1.5 rounded-lg hover:bg-white/5"
            >
              {isLoggingOut ? "…" : "Log out"}
            </button>
            <Link href="/profile" className="flex items-center gap-3 cursor-pointer group hover:opacity-80 transition">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-white group-hover:text-brand-primary transition">
                  {user?.userName || user?.email?.split('@')[0] || "User"}
                </div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Pro Plan</div>
              </div>
              <div className="relative">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-10 h-10 rounded-full border border-gray-600 object-cover group-hover:border-brand-primary transition"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold text-sm border border-gray-600 group-hover:border-brand-primary transition">
                    {userInitial}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-status-success border-2 border-app-bg rounded-full" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
