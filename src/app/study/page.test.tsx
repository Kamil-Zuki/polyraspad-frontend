import { describe, it, expect, vi, beforeEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, waitFor } from "@testing-library/react"
import StudyPage from "./page"

const replaceMock = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ replace: replaceMock, push: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() })),
  useParams: vi.fn(() => ({})),
}))

describe("StudyPage (root /study)", () => {
  beforeEach(() => {
    replaceMock.mockClear()
  })

  it("should_redirect_to_dashboard_when_visiting_root_study", async () => {
    render(<StudyPage />)

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/dashboard")
    })
  })
})
