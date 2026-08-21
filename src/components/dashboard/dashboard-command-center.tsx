"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  BookMarked,
  BookOpen,
  Layers,
  Mic,
  PlusCircle,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

const MODES = [
  { id: "read", label: "Read", icon: BookOpen },
  { id: "study", label: "Study", icon: Layers },
  { id: "create", label: "Create Card", icon: PlusCircle },
  { id: "import", label: "Import", icon: Upload },
] as const

type ModeId = (typeof MODES)[number]["id"]

const QUICK_ACTIONS = [
  { id: "books", label: "Books", icon: BookMarked, href: "/library", color: "from-amber-500/20 to-orange-500/20" },
  { id: "decks", label: "Decks", icon: Layers, href: "/decks", color: "from-brand-primary/20 to-brand-secondary/20" },
  { id: "vocabulary", label: "Vocabulary", icon: BookOpen, href: "/vocabulary", color: "from-emerald-500/20 to-teal-500/20" },
  { id: "browser", label: "Cards", icon: Search, href: "/vocabulary?tab=cards", color: "from-blue-500/20 to-cyan-500/20" },
  { id: "analytics", label: "Analytics", icon: TrendingUp, href: "/analytics", color: "from-violet-500/20 to-purple-500/20" },
]

const MODE_ROUTES: Record<ModeId, string> = {
  read: "/library",
  study: "/decks",
  create: "/editor",
  import: "/import",
}

export function DashboardCommandCenter() {
  const router = useRouter()
  const { user } = useAuth()
  const [mode, setMode] = useState<ModeId>("read")
  const [query, setQuery] = useState("")

  const userName = user?.userName || user?.email?.split("@")[0] || "Learner"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const base = MODE_ROUTES[mode]
    if (query.trim()) {
      router.push(`${base}?q=${encodeURIComponent(query.trim())}`)
    } else {
      router.push(base)
    }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-app-surface">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-primary/20 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-brand-secondary/15 rounded-full blur-[100px] opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-app-surface/40 via-app-surface/80 to-app-surface" />
      </div>

      <div className="relative z-10 px-6 py-16 md:py-24 text-center">
        <p className="text-sm font-medium text-brand-primary mb-4">
          Welcome back, {userName}
        </p>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-4">
          YOURS TO MASTER
        </h1>
        <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto mb-10">
          Choose how you want to learn today. Read real books, review decks, or practice pronunciation.
        </p>

        {/* Command input */}
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-2 shadow-2xl"
          data-testid="agent-command-center"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <Sparkles className="h-5 w-5 text-brand-primary shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you want to learn today?"
              className="flex-1 bg-transparent text-white placeholder:text-gray-500 outline-none text-base"
            />
            <button
              type="submit"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 transition"
            >
              <Target className="h-4 w-4" />
              Go
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-2 pt-1">
            <div className="flex flex-wrap items-center gap-2" data-testid="agent-prompt-chips">
              {MODES.map((m) => {
                const Icon = m.icon
                const isActive = mode === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition border",
                      isActive
                        ? "bg-brand-primary/20 border-brand-primary/40 text-white"
                        : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {m.label}
                  </button>
                )
              })}
            </div>

            <button
              type="submit"
              className="sm:hidden inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition"
            >
              Go
            </button>
          </div>
        </form>

        {/* Quick actions */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 md:gap-6">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.id}
                href={action.href}
                className="group flex flex-col items-center gap-2 transition"
              >
                <div
                  className={cn(
                    "h-14 w-14 rounded-2xl border border-white/10 bg-gradient-to-br flex items-center justify-center text-gray-300 transition group-hover:scale-110 group-hover:text-white group-hover:border-white/20",
                    action.color
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-gray-500 group-hover:text-gray-300 transition">
                  {action.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
