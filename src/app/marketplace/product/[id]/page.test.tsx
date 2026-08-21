import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProductPage from "./page";
import { apiClient } from "@/lib/api";
import type { ProductDto } from "@/lib/api/types";

vi.mock("@/lib/api", () => ({
  apiClient: {
    marketplace: { getProduct: vi.fn() },
  },
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

function renderProductPage(id: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ProductPage params={{ id }} />
    </QueryClientProvider>
  );
}

const mockProduct: ProductDto = {
  id: "prod-1",
  title: "Test Product",
  price: 9.99,
  currency: "USD",
  author: {
    userId: "user-1",
    displayName: "Test Author",
    avatarUrl: "https://example.com/avatar.png",
  },
  coverImageUrl: "https://example.com/cover.jpg",
  averageRating: 4.5,
  reviewCount: 10,
  salesCount: 100,
  descriptionHtml: "<p>Test description</p>",
  linkedDeckId: "deck-1",
  isOwned: false,
};

describe("ProductPage", () => {
  beforeEach(() => {
    vi.mocked(apiClient.marketplace.getProduct).mockReset();
  });

  it("should_show_product_title_and_price_when_getProduct_returns_data", async () => {
    vi.mocked(apiClient.marketplace.getProduct).mockResolvedValue(mockProduct);
    renderProductPage("prod-1");

    await waitFor(() => {
      expect(screen.getByText("Test Product")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("$9.99")).toBeInTheDocument();
    });
  });
});
