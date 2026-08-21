import { describe, it, expect, beforeEach, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { AIProactiveWidget } from "./ai-proactive-widget"
import type { DailySummaryDto, VocabularyStatsDto } from "@/lib/api/types"

function renderWidget(props: {
  dailySummary?: Partial<DailySummaryDto>
  vocabularyData?: Partial<VocabularyStatsDto>
}) {
  return render(
    <AIProactiveWidget
      dailySummary={(props.dailySummary ?? null) as DailySummaryDto | null}
      vocabularyData={(props.vocabularyData ?? null) as VocabularyStatsDto | null}
    />,
  )
}

describe("AIProactiveWidget", () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    window.sessionStorage.clear()
  })

  it("renders retention widget when retention is below 85%", () => {
    renderWidget({
      vocabularyData: {
        totalTerms: 100,
        matureCount: 80,
      } as VocabularyStatsDto,
    })

    expect(screen.getByText("Retention dropping")).toBeInTheDocument()
    expect(screen.getByText(/80%/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /start review/i })).toHaveAttribute("href", "/study")
  })

  it("renders streak widget when streak is active but not extended today", () => {
    renderWidget({
      dailySummary: {
        currentStreak: 4,
        isStreakExtendedToday: false,
      } as DailySummaryDto,
    })

    expect(screen.getByText("Keep your streak")).toBeInTheDocument()
    expect(screen.getByText(/4-day streak/)).toBeInTheDocument()
  })

  it("renders level widget when words to next level is below 50", () => {
    renderWidget({
      vocabularyData: {
        cefrLevel: { code: "A2", title: "A2", progressPercent: 80, wordsToNextLevel: 20 },
      } as VocabularyStatsDto,
    })

    expect(screen.getByText("Level up soon")).toBeInTheDocument()
    expect(screen.getByText(/20 words left to A2/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /generate deck/i })).toHaveAttribute("href", "/editor")
  })

  it("returns null when no scenarios match", () => {
    renderWidget({
      dailySummary: { currentStreak: 0, isStreakExtendedToday: false } as DailySummaryDto,
      vocabularyData: {
        totalTerms: 100,
        matureCount: 90,
        cefrLevel: { code: "B1", title: "B1", progressPercent: 50, wordsToNextLevel: 100 },
      } as VocabularyStatsDto,
    })

    expect(screen.queryByText("Retention dropping")).not.toBeInTheDocument()
    expect(screen.queryByText("Keep your streak")).not.toBeInTheDocument()
    expect(screen.queryByText("Level up soon")).not.toBeInTheDocument()
  })
})
