import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import DashboardPage from "@/app/dashboard/page"

vi.mock("@/components/auth/protected-route", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/contexts/project-context", () => ({
  useProjectContext: () => ({
    currentProject: { id: "p1", title: "English", sourceLang: "en", targetLang: "ru" },
  }),
}))

vi.mock("@/lib/react-query/queries", () => ({
  useProjects: () => ({ data: [{ id: "p1", title: "English" }], isLoading: false }),
}))

vi.mock("@/components/dashboard/dashboard-shell", () => ({
  DashboardShell: () => <div data-testid="dashboard-shell">Dashboard shell</div>,
}))

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders agent dashboard when a project is selected", () => {
    render(<DashboardPage />)
    expect(screen.getByTestId("dashboard-shell")).toBeInTheDocument()
  })
})
