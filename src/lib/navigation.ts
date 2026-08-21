import type { LucideIcon } from "lucide-react"
import {
  BookMarked,
  BookOpen,
  Bot,
  CreditCard,
  FileUp,
  GraduationCap,
  Home,
  Layers,
  Mic,
  PlusCircle,
  Store,
} from "lucide-react"

export interface NavAction {
  id: string
  label: string
  labelKey?: string
  href: string
  group: string
  groupKey?: string
  icon: LucideIcon
  /** Extra searchable keywords / natural-language aliases (e.g. "open decks"). */
  aliases?: string[]
  /** Hidden items are excluded from the sidebar but can still appear in the Omnibar. */
  visible?: boolean
}

export const HOME_ACTION: NavAction = {
  id: "home",
  label: "Dashboard",
  labelKey: "nav.dashboard",
  href: "/dashboard",
  group: "Command Center",
  groupKey: "nav.groups.commandCenter",
  icon: Home,
  aliases: ["home", "command center", "overview"],
}

export const NAV_ACTIONS: NavAction[] = [
  // ── AI ──────────────────────────────────────────────────────────────────────
  {
    id: "agents",
    label: "Agents",
    labelKey: "nav.agents",
    href: "/agents",
    group: "AI",
    groupKey: "nav.groups.ai",
    icon: Bot,
    aliases: ["ai tools", "agent hub", "polyguide", "assistant"],
    visible: process.env.NEXT_PUBLIC_FF_AI_AGENTS === "true",
  },

  // ── Reading ──────────────────────────────────────────────────────────────────
  {
    id: "library",
    label: "Books",
    labelKey: "nav.books",
    href: "/library",
    group: "Reading",
    groupKey: "nav.groups.reading",
    icon: BookMarked,
    aliases: ["reader", "library", "book library"],
  },
  {
    id: "lessons",
    label: "Lessons",
    labelKey: "nav.lessons",
    href: "/lessons",
    group: "Grammar",
    groupKey: "nav.groups.grammar",
    icon: GraduationCap,
    aliases: ["tutor", "classes", "mini-lessons", "grammar"],
    visible: process.env.NEXT_PUBLIC_FF_ADVANCED_MODULES === "true",
  },

  // ── Vocabulary ───────────────────────────────────────────────────────────────
  {
    id: "decks",
    label: "Decks",
    labelKey: "nav.decks",
    href: "/decks",
    group: "Vocabulary",
    groupKey: "nav.groups.vocabulary",
    icon: Layers,
    aliases: ["deck", "gallery", "playlists", "study decks"],
  },
  {
    id: "vocabulary",
    label: "Vocabulary",
    labelKey: "nav.vocabulary",
    href: "/vocabulary",
    group: "Vocabulary",
    groupKey: "nav.groups.vocabulary",
    icon: BookOpen,
    aliases: ["words", "stats", "dictionary", "language passport", "cards", "browser", "card manager"],
  },
  {
    id: "editor",
    label: "Create Card",
    labelKey: "nav.createCard",
    href: "/editor",
    group: "Vocabulary",
    groupKey: "nav.groups.vocabulary",
    icon: PlusCircle,
    aliases: ["new card", "add card", "manual card", "card editor"],
  },
  {
    id: "import",
    label: "Import",
    labelKey: "nav.import",
    href: "/import",
    group: "Vocabulary",
    groupKey: "nav.groups.vocabulary",
    icon: FileUp,
    aliases: ["upload", "bulk import", "csv"],
  },

  // ── Community (mostly hidden) ────────────────────────────────────────────────
  {
    id: "marketplace",
    label: "Marketplace",
    labelKey: "nav.marketplace",
    href: "/marketplace",
    group: "Community",
    groupKey: "nav.groups.community",
    icon: Store,
    visible: false,
    aliases: ["store", "buy decks"],
  },
  {
    id: "billing",
    label: "Billing",
    labelKey: "nav.billing",
    href: "/billing",
    group: "Community",
    groupKey: "nav.groups.community",
    icon: CreditCard,
    visible: false,
    aliases: ["subscription", "plan", "payment"],
  },
  {
    id: "admin",
    label: "Admin",
    labelKey: "nav.admin",
    href: "/admin",
    group: "Community",
    groupKey: "nav.groups.community",
    icon: Store,
    visible: false, // We will override this in sidebar based on isAdmin
    aliases: ["admin", "dashboard", "manage users"],
  },
]

export const GROUP_ORDER = [
  "Command Center",
  "AI",
  "Reading",
  "Grammar",
  "Vocabulary",
  "Listening",
  "Writing",
  "Studio",
  "Community",
]

export function sortGroups([a]: [string, NavAction[]], [b]: [string, NavAction[]]) {
  return GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b)
}
