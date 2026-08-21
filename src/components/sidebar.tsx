"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { useTranslations } from "next-intl"

import { useAuth } from "@/contexts/auth-context"
import { useEntitlements } from "@/contexts/entitlement-context"
import { useOmnibar } from "@/contexts/omnibar-context"
import { useProjectContext } from "@/contexts/project-context"
import { useUserSettings, useDailySummary } from "@/lib/react-query/queries"
import { HOME_ACTION, NAV_ACTIONS, sortGroups, type NavAction } from "@/lib/navigation"
import { cn } from "@/lib/utils"
import { useProfileAvatar } from "@/hooks/use-profile-avatar"
import { useLocaleSync } from "@/hooks/use-locale"
import { ProjectSwitcher } from "./sidebar/project-switcher"
import { SubscriptionBadge } from "./billing/subscription-badge"
import polyraspadLogo from "@/assets/polyraspad-logo.png"

const ALL_ACTIONS: NavAction[] = [HOME_ACTION, ...NAV_ACTIONS]

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
}: {
  isCollapsed: boolean
  onToggleCollapse: () => void
}) {
  useLocaleSync()
  const t = useTranslations()
  const pathname = usePathname()
  const router = useRouter()
  const { open } = useOmnibar()
  const auth = useAuth()
  const user = auth.user
  const { logout } = auth
  const { avatarUrl } = useProfileAvatar()
  const avatarInitial = (user?.userName?.[0] || user?.email?.[0] || "?").toUpperCase()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { data: userSettings } = useUserSettings()
  const { currentProject } = useProjectContext()
  const projectId = currentProject?.id
  const { data: dailySummary } = useDailySummary(projectId, { enabled: !!projectId })

  const streakDisplay =
    dailySummary?.currentStreak ?? userSettings?.currentStreak ?? 0
  const reviewGoal =
    dailySummary?.reviews.target ?? userSettings?.dailyGoalReview ?? 1
  const reviewsDone = dailySummary?.reviews.current ?? 0
  const goalProgressPct = Math.min(
    100,
    Math.round((reviewsDone / Math.max(reviewGoal, 1)) * 100),
  )

  const { isPro } = useEntitlements()

  const groupedItems = ALL_ACTIONS.map(item => {
      if (item.id === "admin") {
        return { ...item, visible: auth.isAdmin }
      }
      if (item.id === "agents") {
        return { ...item, visible: (item.visible ?? true) && isPro }
      }
      return item
    }).filter((item) => item.visible !== false)
    .reduce((acc, item) => {
      const groupKey = item.groupKey || item.group
      if (!acc[groupKey]) acc[groupKey] = []
      acc[groupKey].push(item)
      return acc
    }, {} as Record<string, NavAction[]>)

  return (
    <aside className="w-full h-full bg-app-surface border-r border-app-border flex flex-col">
      {/* Logo / collapse */}
      <div
        className={cn(
          "border-b border-app-border",
          isCollapsed
            ? "flex flex-col items-center gap-2 px-2 py-2"
            : "h-16 flex items-center justify-between px-3"
        )}
      >
        <div className={cn("flex min-w-0 items-center", isCollapsed ? "justify-center" : "")}>
          <Image
            src={polyraspadLogo}
            alt="Polyraspad logo"
            width={40}
            height={40}
            priority
            className={cn(
              "rounded-xl object-cover shadow-glow shrink-0",
              isCollapsed ? "h-8 w-8" : "h-10 w-10 mr-3"
            )}
          />
          {!isCollapsed && (
            <span className="truncate font-bold text-white text-lg tracking-tight">Polyraspad</span>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition h-9 w-9 flex items-center justify-center shrink-0"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <ProjectSwitcher isCollapsed={isCollapsed} />

      <div
        className={cn(
          "flex-1 overflow-y-auto py-4 custom-scroll",
          isCollapsed ? "px-2 overflow-x-visible" : "px-3"
        )}
      >
        {/* Omnibar trigger */}
        <div className={cn("mb-4", isCollapsed ? "flex flex-col items-center" : "")}>
          <button
            type="button"
            onClick={() => open()}
            className={cn(
              "w-full group text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200",
              isCollapsed
                ? "mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]"
                : "flex items-center gap-3 rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm"
            )}
            aria-label="Open command palette"
            title={t("common.search")}
          >
            <Search
              className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                isCollapsed ? "" : "text-gray-500 group-hover:text-brand-primary"
              )}
            />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{t("common.search")}</span>
                <kbd className="rounded border border-gray-700 bg-app-surface px-1.5 py-0 text-[10px] uppercase text-gray-500">
                  Ctrl+K
                </kbd>
              </>
            )}
          </button>
        </div>

        {Object.entries(groupedItems)
          .filter(([, items]) => items.length > 0)
          .sort(sortGroups)
          .map(([groupKey, items]) => {
            const displayGroup = items[0]?.groupKey ? t(items[0].groupKey as any) : groupKey
            return (
              <nav key={groupKey} className={cn("space-y-1", isCollapsed ? "mb-4 flex flex-col items-center" : "mb-6")}>
                {!isCollapsed && (
                  <div className="px-2 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    {displayGroup}
                  </div>
                )}
                {items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href === "/library" && pathname.startsWith("/reader"))
                  const Icon = item.icon
                  const itemLabel = item.labelKey ? t(item.labelKey as any) : item.label
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      title={itemLabel}
                      aria-label={itemLabel}
                      className={cn(
                        "nav-item text-gray-400 hover:text-gray-100 hover:bg-white/5 transition-all duration-200 group shrink-0",
                        isCollapsed
                          ? "mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-0 py-0"
                          : "flex items-center gap-3 rounded-r-lg px-4 py-2.5",
                        isActive &&
                          (isCollapsed
                            ? "bg-brand-primary/15 ring-1 ring-brand-primary/40 text-white border-brand-primary/30"
                            : "active")
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0 transition-colors",
                          isActive ? "text-brand-primary" : "group-hover:text-white"
                        )}
                      />
                      {!isCollapsed && (
                        <span className="text-sm font-medium text-gray-400 group-hover:text-white flex items-center gap-2">
                          {itemLabel}
                          {item.id === "billing" && <SubscriptionBadge compact />}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </nav>
            )
          })}
      </div>

      <div className="p-4 border-t border-app-border bg-app-surface/50 backdrop-blur-sm">
        {isCollapsed ? (
          <div className="space-y-3">
            <div
              className="rounded-2xl border border-brand-primary/20 bg-gradient-to-b from-brand-primary/10 to-brand-secondary/10 px-2 py-3 text-center"
              title={t("common.reviews", { done: reviewsDone, goal: reviewGoal })}
            >
              <div className="flex justify-center text-orange-400">
                <i className="fas fa-fire text-sm animate-pulse" />
              </div>
              <div className="mt-1 text-sm font-bold text-white tabular-nums">{streakDisplay}</div>
              <div className="mt-2 h-1.5 rounded-full bg-app-bg overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500 transition-[width] duration-300"
                  style={{ width: `${goalProgressPct}%` }}
                />
              </div>
            </div>

            <Link
              href="/profile"
              className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 py-2.5 hover:bg-white/10 transition"
              aria-label={t("common.profile")}
              title={t("common.profile")}
            >
              <div className="relative">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full border border-gray-600 object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full border border-gray-600 bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-[10px] font-bold text-white">
                    {avatarInitial}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-status-success border-2 border-app-surface rounded-full" />
              </div>
            </Link>

            <button
              type="button"
              onClick={async () => {
                try {
                  setIsLoggingOut(true)
                  await logout()
                  router.push("/auth")
                } catch {
                  router.push("/auth")
                } finally {
                  setIsLoggingOut(false)
                }
              }}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center rounded-xl border border-white/10 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/15 transition disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t("common.logOut")}
              title={t("common.logOut")}
            >
              <i className={`fas ${isLoggingOut ? "fa-spinner fa-spin" : "fa-sign-out-alt"} text-xs`} />
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-xl bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 border border-brand-primary/20 p-3 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-12 h-12 bg-brand-primary/20 blur-xl rounded-full group-hover:bg-brand-primary/30 transition duration-500" />
              <div className="flex justify-between items-center mb-2 relative z-10">
                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                  {t("common.streak")}
                </span>
                <div className="flex items-center gap-1.5 text-orange-400">
                  <i className="fas fa-fire text-sm animate-pulse" />
                  <span className="font-bold text-white text-sm tabular-nums">
                    {streakDisplay}
                  </span>
                </div>
              </div>
              <div className="w-full bg-app-bg h-1.5 rounded-full overflow-hidden relative z-10">
                <div
                  className="bg-gradient-to-r from-orange-400 to-red-500 h-full rounded-full shadow-[0_0_8px_rgba(249,115,22,0.6)] transition-[width] duration-300"
                  style={{ width: `${goalProgressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-gray-500 mt-1.5 relative z-10">
                <span>{t("common.dailyGoal")}</span>
                <span className="text-gray-300 tabular-nums">
                  {t("common.reviews", { done: reviewsDone, goal: reviewGoal })}
                </span>
              </div>
            </div>

            <Link
              href="/profile"
              className="mt-4 flex items-center gap-3 px-1 group cursor-pointer hover:opacity-80 transition"
              aria-label={t("common.profile")}
            >
              <div className="relative">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full border border-gray-600 object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full border border-gray-600 bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-[10px] font-bold text-white">
                    {avatarInitial}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-status-success border-2 border-app-surface rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white flex items-center gap-1.5">
                  <span className="truncate">{user?.userName || user?.email?.split('@')[0] || "User"}</span>
                  <SubscriptionBadge compact />
                </div>
                <div className="text-[10px] text-gray-500 group-hover:text-gray-400 transition">
                  {t("common.profile")}
                </div>
              </div>
              <i className="fas fa-cog text-gray-600 group-hover:text-white transition" />
            </Link>

            <button
              type="button"
              onClick={async () => {
                try {
                  setIsLoggingOut(true)
                  await logout()
                  router.push("/auth")
                } catch {
                  router.push("/auth")
                } finally {
                  setIsLoggingOut(false)
                }
              }}
              disabled={isLoggingOut}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-[13px] font-medium text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/15 transition disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t("common.logOut")}
            >
              <i className={`fas ${isLoggingOut ? "fa-spinner fa-spin" : "fa-sign-out-alt"} text-xs`} />
              {isLoggingOut ? t("common.signingOut") : t("common.logOut")}
            </button>
          </>
        )}
      </div>
    </aside>
  )
}

