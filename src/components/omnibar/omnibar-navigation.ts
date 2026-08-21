import type { LucideIcon } from "lucide-react"
import { BookOpen, Play, PlusCircle, Search, Sparkles, Zap } from "lucide-react"
import { HOME_ACTION, NAV_ACTIONS, type NavAction } from "@/lib/navigation"

export const ALL_NAV_ACTIONS: NavAction[] = [HOME_ACTION, ...NAV_ACTIONS].filter(a => a.visible !== false)

export interface RecentRoute {
  id: string
  label: string
  href: string
}

const RECENT_ROUTES_KEY = "omnibar-recent-routes"
const MAX_RECENT_ROUTES = 5

export function getRecentRoutes(): RecentRoute[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(RECENT_ROUTES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentRoute[]
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_ROUTES) : []
  } catch {
    return []
  }
}

export function pushRecentRoute(route: RecentRoute) {
  if (typeof window === "undefined") return
  try {
    const existing = getRecentRoutes()
    const next = [
      route,
      ...existing.filter((r) => r.href !== route.href),
    ].slice(0, MAX_RECENT_ROUTES)
    window.localStorage.setItem(RECENT_ROUTES_KEY, JSON.stringify(next))
  } catch {
    // ignore storage errors
  }
}

export interface SuggestedAction {
  id: string
  title: string
  subtitle: string
  icon: LucideIcon
  href: string
  keywords: string[]
}

export function getSuggestedActions(pathname: string, hasProject: boolean): SuggestedAction[] {
  const common: SuggestedAction[] = [
    {
      id: "suggested-study",
      title: "Study Now",
      subtitle: "Jump into your current deck",
      icon: Play,
      href: hasProject ? "/decks" : "/projects",
      keywords: ["study", "review", "learn", "начать"],
    },
    {
      id: "suggested-create-card",
      title: "Create a card",
      subtitle: "Open the card editor",
      icon: PlusCircle,
      href: "/editor",
      keywords: ["create card", "new card", "add card", "создать карточку"],
    },
    {
      id: "suggested-reader",
      title: "Open Reader",
      subtitle: "Start a reading session",
      icon: BookOpen,
      href: "/reader",
      keywords: ["reader", "read", "читать", "книга"],
    },
    {
      id: "suggested-forgotten",
      title: "Show forgotten words",
      subtitle: "Open Cards with a low-ease filter",
      icon: Search,
      href: "/vocabulary?tab=cards&filter=forgotten",
      keywords: ["forgot", "difficult", "low ease", "lapses", "часто забываю"],
    },
  ]

  if (pathname === "/dashboard") {
    return [
      common[0], // Study Now
      common[1], // Create a card
      common[2], // Open Reader
    ]
  }

  if (pathname === "/decks" || pathname.startsWith("/decks")) {
    return [
      common[1], // Create a card
      {
        id: "suggested-start-review",
        title: "Start review session",
        subtitle: "Review due cards",
        icon: Zap,
        href: "/study",
        keywords: ["review", "srs", "session", "повторение"],
      },
    ]
  }

  if (pathname === "/vocabulary") {
    return [common[0], common[3]]
  }

  return common.slice(0, 3)
}

export function labelForRoute(href: string): string | null {
  const action = ALL_NAV_ACTIONS.find((a) => a.href === href)
  return action?.label ?? null
}

export function matchesQuery(query: string, ...texts: (string | undefined)[]): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return texts.some((text) => (text ?? "").toLowerCase().includes(normalized))
}

export function extractQuickAddTerm(query: string): string | null {
  const normalized = query.trim()
  // Matches: Add "word", Add 'word', Add word
  const quoted = normalized.match(/^add\s+["'«""](.+?)["'»""]$/i)
  if (quoted?.[1]) return quoted[1].trim()
  const plain = normalized.match(/^add\s+(.+)$/i)
  if (plain?.[1]) return plain[1].trim()
  return null
}

export function isSmartFilterQuery(query: string): boolean {
  const normalized = query.toLowerCase()
  const signals = [
    "забываю",
    "forget",
    "forgotten",
    "difficult",
    "low ease",
    "lapses",
    "hard words",
    "often forget",
    "трудные слова",
    "часто забываю",
  ]
  return signals.some((signal) => normalized.includes(signal))
}
