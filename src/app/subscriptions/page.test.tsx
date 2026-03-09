import { describe, it, expect, vi, beforeEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import SubscriptionsPage from "./page"
import { apiClient } from "@/lib/api"

vi.mock("@/lib/api", () => ({
  apiClient: {
    subscriptions: { getSubscriptions: vi.fn() },
  },
}))

function renderSubscriptionsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <SubscriptionsPage />
    </QueryClientProvider>
  )
}

describe("SubscriptionsPage", () => {
  beforeEach(() => {
    vi.mocked(apiClient.subscriptions.getSubscriptions).mockReset()
  })

  it("should_show_title_and_description_when_page_renders", () => {
    vi.mocked(apiClient.subscriptions.getSubscriptions).mockResolvedValue([])
    renderSubscriptionsPage()
    expect(screen.getByRole("heading", { level: 1, name: "Subscriptions" })).toBeInTheDocument()
    expect(screen.getByText(/Manage your deck subscriptions/i)).toBeInTheDocument()
  })

  it("should_show_empty_state_when_no_subscriptions", async () => {
    vi.mocked(apiClient.subscriptions.getSubscriptions).mockResolvedValue([])
    renderSubscriptionsPage()

    await waitFor(() => {
      expect(apiClient.subscriptions.getSubscriptions).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByText(/no subscriptions|you have no subscriptions|empty/i)).toBeInTheDocument()
    })
  })

  it("should_show_list_of_decks_when_subscriptions_exist", async () => {
    vi.mocked(apiClient.subscriptions.getSubscriptions).mockResolvedValue([
      {
        id: "sub-1",
        userId: "user-1",
        deckId: "deck-1",
        lastSyncedVersion: 1,
        subscribedAt: "2025-01-01T00:00:00Z",
        lastAccessedAt: "2025-01-01T00:00:00Z",
        deckTitle: "My Deck",
      },
    ])
    renderSubscriptionsPage()

    await waitFor(() => {
      expect(apiClient.subscriptions.getSubscriptions).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByText("My Deck")).toBeInTheDocument()
    })
  })
})
