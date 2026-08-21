"use client"

import { useEffect, useMemo, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { Sparkles } from "lucide-react"
import { useProjectContext } from "@/contexts/project-context"
import { useOmnibar } from "@/contexts/omnibar-context"
import {
  ALL_NAV_ACTIONS,
  extractQuickAddTerm,
  getRecentRoutes,
  getSuggestedActions,
  isSmartFilterQuery,
  labelForRoute,
  matchesQuery,
  pushRecentRoute,
  type RecentRoute,
  type SuggestedAction,
} from "./omnibar-navigation"

export type OmnibarItemType = "nav" | "recent" | "suggested" | "quick-add" | "smart-filter"

export interface QuickAddState {
  status: "idle" | "loading" | "success" | "error"
  term?: string
  error?: string
}

export interface OmnibarItem {
  id: string
  type: OmnibarItemType
  title: string
  subtitle?: string
  icon?: LucideIcon
  href?: string
  disabled?: boolean
  keywords: string[]
  onSelect: () => void | Promise<void>
}

export interface OmnibarGroup {
  id: string
  label: string
  items: OmnibarItem[]
}

function makeNavItem(action: typeof ALL_NAV_ACTIONS[number], onSelect: () => void): OmnibarItem {
  return {
    id: `nav-${action.id}`,
    type: "nav",
    title: action.label,
    icon: action.icon,
    href: action.href,
    keywords: [action.label, action.href, ...(action.aliases ?? [])],
    onSelect,
  }
}

function makeSuggestedItem(action: SuggestedAction, onSelect: () => void): OmnibarItem {
  return {
    id: `suggested-${action.id}`,
    type: "suggested",
    title: action.title,
    subtitle: action.subtitle,
    icon: action.icon,
    href: action.href,
    keywords: [action.title, action.subtitle, ...action.keywords],
    onSelect,
  }
}

function makeRecentItem(route: RecentRoute, onSelect: () => void): OmnibarItem {
  return {
    id: `recent-${route.href}`,
    type: "recent",
    title: route.label,
    subtitle: route.href,
    href: route.href,
    keywords: [route.label, route.href],
    onSelect,
  }
}

export function useOmnibarItems(
  query: string,
  quickAddState: QuickAddState,
  onRunQuickAdd: (term: string) => Promise<void>,
): OmnibarGroup[] {
  const router = useRouter()
  const pathname = usePathname()
  const { currentProject } = useProjectContext()
  const { close } = useOmnibar()

  const handleNavigate = useCallback(
    (href: string) => {
      close()
      router.push(href)
    },
    [close, router],
  )

  // Record the current route as "recent" whenever it is a known nav action.
  useEffect(() => {
    const label = labelForRoute(pathname)
    if (label) {
      pushRecentRoute({ id: pathname, label, href: pathname })
    }
  }, [pathname])

  return useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const hasProject = Boolean(currentProject)

    const groups: OmnibarGroup[] = []

    // --- Quick Add -----------------------------------------------------------
    const quickAddTerm = extractQuickAddTerm(query)
    if (quickAddTerm) {
      const isLoading = quickAddState.status === "loading"
      const isSuccess = quickAddState.status === "success"
      const hasError = quickAddState.status === "error"
      const disabled = isLoading || isSuccess || !hasProject

      let title = `Create card for "${quickAddTerm}" in Inbox`
      if (isLoading) title = `Creating card for "${quickAddTerm}"…`
      if (isSuccess) title = `✅ Card "${quickAddTerm}" created`
      if (hasError) title = `⚠️ Could not create "${quickAddTerm}"`

      groups.push({
        id: "quick-add",
        label: isSuccess ? "Quick Add" : "AI Quick Add",
        items: [
          {
            id: "quick-add-item",
            type: "quick-add",
            title,
            subtitle: !hasProject
              ? "Select a project first"
              : hasError
                ? quickAddState.error
                : "Translation, audio and example will be generated automatically",
            icon: Sparkles,
            disabled,
            keywords: ["add", "create", "quick add", quickAddTerm],
            onSelect: () => {
              if (!disabled) onRunQuickAdd(quickAddTerm)
            },
          },
        ],
      })
    }

    // --- Smart Filter --------------------------------------------------------
    if (isSmartFilterQuery(query)) {
      groups.push({
        id: "smart-filter",
        label: "Smart Filter",
        items: [
          {
            id: "smart-filter-forgotten",
            type: "smart-filter",
            title: "Open Cards — forgotten / low-ease words",
            subtitle: "Words you often forget or find difficult",
            icon: Sparkles,
            href: "/vocabulary?tab=cards&filter=forgotten",
            keywords: ["forgotten", "difficult", "low ease", "lapses"],
            onSelect: () => handleNavigate("/vocabulary?tab=cards&filter=forgotten"),
          },
        ],
      })
    }

    // --- Navigation ----------------------------------------------------------
    const matchingNav = ALL_NAV_ACTIONS.filter((action) =>
      matchesQuery(normalized, action.label, action.href, ...(action.aliases ?? [])),
    )
    if (matchingNav.length > 0) {
      groups.push({
        id: "navigation",
        label: "Navigation",
        items: matchingNav.map((action) =>
          makeNavItem(action, () => handleNavigate(action.href)),
        ),
      })
    }

    // --- Suggested actions ---------------------------------------------------
    const suggested = getSuggestedActions(pathname, hasProject).filter((action) =>
      normalized ? matchesQuery(normalized, action.title, action.subtitle, ...action.keywords) : true,
    )
    if (suggested.length > 0 && (!normalized || suggested.some((a) => matchesQuery(normalized, a.title, a.subtitle, ...a.keywords)))) {
      groups.push({
        id: "suggested",
        label: "Suggested Actions",
        items: suggested.map((action) =>
          makeSuggestedItem(action, () => handleNavigate(action.href)),
        ),
      })
    }

    // --- Recent navigation ---------------------------------------------------
    const recent = getRecentRoutes().filter((route) =>
      normalized ? matchesQuery(normalized, route.label, route.href) : true,
    )
    if (recent.length > 0 && !quickAddTerm && !isSmartFilterQuery(query)) {
      groups.push({
        id: "recent",
        label: "Recent Navigation",
        items: recent.map((route) =>
          makeRecentItem(route, () => handleNavigate(route.href)),
        ),
      })
    }

    return groups.filter((group) => group.items.length > 0)
  }, [query, quickAddState, currentProject, pathname, handleNavigate, onRunQuickAdd])
}
