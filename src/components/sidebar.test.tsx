import { describe, it, expect, vi, beforeEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
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

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
}))

vi.mock("./sidebar/project-switcher", () => ({
  ProjectSwitcher: () => <div data-testid="project-switcher">ProjectSwitcher</div>,
}))

function renderSidebar() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <Sidebar />
    </QueryClientProvider>
  )
}

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("рендерит ссылку Import с href /import в группе Studio", () => {
    renderSidebar()
    const importLink = screen.getByRole("link", { name: /import/i })
    expect(importLink).toBeInTheDocument()
    expect(importLink).toHaveAttribute("href", "/import")
  })
})
