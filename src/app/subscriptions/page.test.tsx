import { vi, describe, it, expect, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import SubscriptionsPage from "./page"

const getSubscriptionsMock = vi.fn()
const deleteSubscriptionMock = vi.fn()

vi.mock("@/lib/api", () => ({
  apiClient: {
    subscriptions: {
      getSubscriptions: () => getSubscriptionsMock(),
      deleteSubscription: (deckId: string) => deleteSubscriptionMock(deckId),
    },
  },
}))

const mockSubscriptions = [
  {
    id: "sub-1",
    userId: "user-1",
    deckId: "deck-abc",
    lastSyncedVersion: 0,
    subscribedAt: "2025-01-01T00:00:00Z",
    lastAccessedAt: "2025-01-01T00:00:00Z",
    deckTitle: "Test Deck",
  },
]

function renderSubscriptionsPage(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <SubscriptionsPage />
    </QueryClientProvider>
  )
}

describe("Subscriptions page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSubscriptionsMock.mockResolvedValue(mockSubscriptions)
    deleteSubscriptionMock.mockResolvedValue(undefined)
  })

  it("should_remove_subscription_from_list_when_user_clicks_unsubscribe_and_api_returns_204", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

    renderSubscriptionsPage(queryClient)

    await screen.findByText("Test Deck")
    const unsubBtn = screen.getByRole("button", { name: /unsubscribe/i })
    fireEvent.click(unsubBtn)

    await waitFor(() => {
      expect(deleteSubscriptionMock).toHaveBeenCalledWith("deck-abc")
    })
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["subscriptions"] })
    })
  })
})
