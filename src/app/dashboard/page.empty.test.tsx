import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import DashboardPage from "@/app/dashboard/page"

vi.mock("@/components/auth/protected-route", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/contexts/project-context", () => ({
  useProjectContext: () => ({ currentProject: null }),
}))

vi.mock("@/lib/react-query/queries", () => ({
  useProjects: () => ({ data: [], isLoading: false }),
}))

vi.mock("@/components/dashboard/dashboard-shell", () => ({
  DashboardShell: () => <div data-testid="dashboard-shell">Dashboard shell</div>,
}))

describe("DashboardPage empty state", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders empty-project state instead of agent shell", () => {
    render(<DashboardPage />)
    expect(screen.queryByTestId("dashboard-shell")).not.toBeInTheDocument()
    expect(screen.getByText("Create your first project")).toBeInTheDocument()
  })
})
