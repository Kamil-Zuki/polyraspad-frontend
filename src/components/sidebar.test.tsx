import { describe, it, expect, vi, beforeEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { OmnibarProvider } from "@/contexts/omnibar-context"
import { Sidebar } from "./sidebar"

vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(() => ({
    user: { id: "u1", userName: "Test", email: "test@test.com" },
    isAuthenticated: true,
    isLoading: false,
  })),
}))

vi.mock("@/contexts/project-context", () => ({
  useProjectContext: () => ({ currentProject: { id: "proj-1", title: "P" } }),
}))

vi.mock("@/lib/react-query/queries", () => ({
  useUserSettings: vi.fn(() => ({ data: { currentStreak: 2, dailyGoalReview: 10 } })),
  useDailySummary: vi.fn(() => ({
    data: {
      currentStreak: 5,
      reviews: { current: 3, target: 10, isCompleted: false },
    },
  })),
}))

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, any>) => {
    const map: Record<string, string> = {
      "common.search": "Search / Command",
      "common.logOut": "Log out",
      "common.signingOut": "Signing out…",
      "common.profile": "Profile",
      "common.streak": "Streak",
      "common.dailyGoal": "Daily Goal",
      "nav.dashboard": "Dashboard",
      "nav.decks": "Decks",
      "nav.vocabulary": "Vocabulary",
      "nav.createCard": "Create Card",
      "nav.import": "Import",
      "nav.books": "Books",
      "nav.groups.commandCenter": "Command Center",
      "nav.groups.vocabulary": "Vocabulary",
      "nav.groups.toolsImport": "Tools / Import",
      "nav.groups.reading": "Reading",
    }
    if (key === "common.reviews" && params) {
      return `${params.done} / ${params.goal} reviews`
    }
    return map[key] || key
  },
  useLocale: () => "en",
}))

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}))

vi.mock("next/image", () => ({
  default: (props: { alt?: string; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt ?? ""} className={props.className} />
  ),
}))

vi.mock("./sidebar/project-switcher", () => ({
  ProjectSwitcher: () => <div data-testid="project-switcher">ProjectSwitcher</div>,
}))

function renderSidebar(props?: Partial<{ isCollapsed: boolean; onToggleCollapse: () => void }>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <OmnibarProvider>
        <Sidebar isCollapsed={false} onToggleCollapse={vi.fn()} {...props} />
      </OmnibarProvider>
    </QueryClientProvider>
  )
}

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  it("рендерит ссылку Import с href /import в группе Vocabulary", () => {
    renderSidebar()
    const importLink = screen.getByRole("link", { name: /import/i })
    expect(importLink).toBeInTheDocument()
    expect(importLink).toHaveAttribute("href", "/import")
  })

  it("keeps all visible nav links when collapsed including Import", () => {
    renderSidebar({ isCollapsed: true })

    const expectedLabels = [
      "Dashboard",
      "Decks",
      "Vocabulary",
      "Books",
      "Create Card",
      "Import",
    ]

    for (const label of expectedLabels) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument()
    }

    expect(screen.getByRole("link", { name: /import/i })).toHaveAttribute("href", "/import")
    expect(screen.getByRole("button", { name: /expand sidebar/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /profile/i })).toBeInTheDocument()
  })

  it("calls onToggleCollapse when collapse control is clicked", async () => {
    const user = userEvent.setup()
    const onToggleCollapse = vi.fn()
    renderSidebar({ onToggleCollapse })

    await user.click(screen.getByRole("button", { name: /collapse sidebar/i }))
    expect(onToggleCollapse).toHaveBeenCalledTimes(1)
  })
})
