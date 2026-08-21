import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ProductReviews } from "./product-details"
import type { ProductReviewDto } from "@/lib/api/types"

const getProductReviewsMock = vi.fn()

vi.mock("@/lib/api", () => ({
  apiClient: {
    marketplace: {
      getProductReviews: (productId: string) => getProductReviewsMock(productId),
    },
  },
}))

const mockReviewsPayload = {
  items: [
    {
      id: "review-1",
      productId: "prod-1",
      author: {
        userId: "user-1",
        displayName: "Happy Learner",
        avatarUrl: null,
        isVerified: true,
      },
      rating: 5,
      comment: "Отличный курс! Особенно понравились примеры из реальных новостей.",
      isVerifiedPurchase: true,
      authorReply: "Спасибо! Рад, что вам понравилось.",
      createdAt: "2025-12-05T10:30:00Z",
    } as ProductReviewDto,
    {
      id: "review-2",
      productId: "prod-1",
      author: {
        userId: "user-2",
        displayName: "Sarah Smith",
        avatarUrl: null,
      },
      rating: 4,
      comment: "Great content, but I wish there were more examples.",
      isVerifiedPurchase: true,
      authorReply: null,
      createdAt: "2025-12-06T12:00:00Z",
    } as ProductReviewDto,
  ],
  pageNumber: 1,
  totalPages: 1,
  totalCount: 2,
  hasPreviousPage: false,
  hasNextPage: false,
}

function renderProductReviews(productId: string, queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <ProductReviews productId={productId} />
    </QueryClientProvider>
  )
}

describe("ProductReviews", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should_display_reviews_when_api_returns_reviews", async () => {
    getProductReviewsMock.mockResolvedValue(mockReviewsPayload)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    renderProductReviews("prod-1", queryClient)

    await waitFor(() => {
      expect(getProductReviewsMock).toHaveBeenCalledWith("prod-1")
    })

    // Список отзывов отображается: авторы и текст
    expect(await screen.findByText("Happy Learner")).toBeTruthy()
    expect(screen.getByText("Sarah Smith")).toBeTruthy()
    expect(
      screen.getByText(/Отличный курс! Особенно понравились примеры из реальных новостей./)
    ).toBeTruthy()
    expect(
      screen.getByText(/Great content, but I wish there were more examples./)
    ).toBeTruthy()
    // Ответ автора при наличии
    expect(screen.getByText(/Спасибо! Рад, что вам понравилось./)).toBeTruthy()
    // Verified Purchase
    const verifiedLabels = screen.getAllByText(/Verified Purchase/i)
    expect(verifiedLabels.length).toBeGreaterThanOrEqual(1)
  })

  it("should_display_placeholder_when_api_returns_empty_reviews", async () => {
    getProductReviewsMock.mockResolvedValue({
      items: [],
      pageNumber: 1,
      totalPages: 0,
      totalCount: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    })
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    renderProductReviews("prod-2", queryClient)

    await waitFor(() => {
      expect(getProductReviewsMock).toHaveBeenCalledWith("prod-2")
    })

    expect(await screen.findByText("Reviews will appear soon")).toBeTruthy()
  })
})
