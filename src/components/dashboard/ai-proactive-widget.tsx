"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Sparkles, X } from "lucide-react"
import type { DailySummaryDto, UserSettingsResponseDto } from "@/lib/api/types"
import type { VocabularyStatsDto } from "@/lib/api/types"
import { cn } from "@/lib/utils"

export interface AIProactiveWidgetProps {
  dailySummary?: DailySummaryDto | null
  vocabularyData?: VocabularyStatsDto | null
  userSettings?: UserSettingsResponseDto | null
}

interface WidgetItem {
  id: string
  title: string
  message: string
  cta: string
  href: string
  priority: number
}

const STORAGE_PREFIX = "ai-widget-dismissed-"

function useDismissedWidgets() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (typeof window === "undefined") return
    const next = new Set<string>()
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(STORAGE_PREFIX)) {
        next.add(key.slice(STORAGE_PREFIX.length))
      }
    }
    setDismissed(next)
  }, [])

  const dismiss = (id: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`${STORAGE_PREFIX}${id}`, "1")
    }
    setDismissed((prev) => new Set(prev).add(id))
  }

  return { dismissed, dismiss }
}

function buildWidgets(
  dailySummary: DailySummaryDto | null | undefined,
  vocabularyData: VocabularyStatsDto | null | undefined,
): WidgetItem[] {
  const widgets: WidgetItem[] = []

  // Retention scenario
  const totalTerms = vocabularyData?.totalTerms ?? 0
  const matureCount = vocabularyData?.matureCount ?? 0
  if (totalTerms > 0) {
    const retentionPercent = (matureCount / totalTerms) * 100
    if (retentionPercent < 85) {
      widgets.push({
        id: "retention",
        title: "Retention dropping",
        message: `Your retention is ${retentionPercent.toFixed(0)}%. Run a hardcore review of difficult words?`,
        cta: "Start review",
        href: "/study",
        priority: 1,
      })
    }
  }

  // Streak scenario
  const currentStreak = dailySummary?.currentStreak ?? 0
  const isStreakExtended = dailySummary?.isStreakExtendedToday ?? false
  if (currentStreak > 0 && !isStreakExtended) {
    widgets.push({
      id: "streak",
      title: "Keep your streak",
      message: `Don't lose your ${currentStreak}-day streak! Review 5 cards now.`,
      cta: "Review 5 cards",
      href: "/study",
      priority: 2,
    })
  }

  // Level scenario
  const wordsToNextLevel = vocabularyData?.cefrLevel?.wordsToNextLevel
  const levelTitle = vocabularyData?.cefrLevel?.title
  if (wordsToNextLevel != null && wordsToNextLevel < 50 && levelTitle) {
    widgets.push({
      id: "level",
      title: "Level up soon",
      message: `Only ${wordsToNextLevel} words left to ${levelTitle}! Generate a sprint deck?`,
      cta: "Generate deck",
      href: "/editor",
      priority: 3,
    })
  }

  return widgets.sort((a, b) => a.priority - b.priority)
}

export function AIProactiveWidget({
  dailySummary,
  vocabularyData,
}: AIProactiveWidgetProps) {
  const { dismissed, dismiss } = useDismissedWidgets()
  const widgets = useMemo(
    () => buildWidgets(dailySummary, vocabularyData).filter((w) => !dismissed.has(w.id)),
    [dailySummary, vocabularyData, dismissed],
  )

  if (widgets.length === 0) return null

  return (
    <section className="space-y-3">
      {widgets.map((widget, index) => (
        <div
          key={widget.id}
          className={cn(
            "relative overflow-hidden rounded-2xl border border-brand-primary/20 bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 p-4 pr-12 shadow-glow",
            index > 0 && "from-brand-primary/5 to-brand-secondary/5 shadow-none",
          )}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/15 text-brand-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white">{widget.title}</h3>
              <p className="mt-0.5 text-sm text-gray-300">{widget.message}</p>
              <Link
                href={widget.href}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-app-bg transition hover:bg-gray-200"
              >
                {widget.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={() => dismiss(widget.id)}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white"
            aria-label={`Dismiss ${widget.title}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </section>
  )
}
