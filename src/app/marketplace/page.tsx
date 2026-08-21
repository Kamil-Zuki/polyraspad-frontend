"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MarketplaceFilters, type PriceFilter } from "@/components/marketplace/marketplace-filters";
import { ProductCard, type ProductCardBadgeColor } from "@/components/marketplace/product-card";
import { apiClient } from "@/lib/api";
import type { ProductDto, PaginatedResponseDto } from "@/lib/api/types";

const FALLBACK_PRODUCTS: Array<{
  id: string;
  image: string;
  price: number | string;
  isVerified: boolean;
  authorAvatar: string;
  category: string;
  level: string;
  title: string;
  description: string;
  rating: number;
  reviewsCount: number;
  studentsCount: string;
  badgeColor: ProductCardBadgeColor;
}> = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80",
    price: 19.99,
    isVerified: true,
    authorAvatar: "https://i.pravatar.cc/150?u=1",
    category: "Business",
    level: "C1",
    title: "Advanced Business English",
    description: "Master negotiations and corporate vocabulary with native audio.",
    rating: 4.9,
    reviewsCount: 120,
    studentsCount: "2.5k",
    badgeColor: "secondary",
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1528164344705-47542687000d?w=600&q=80",
    price: "FREE",
    isVerified: false,
    authorAvatar: "https://i.pravatar.cc/150?u=2",
    category: "Kanji",
    level: "N5",
    title: "Japanese N5 Basic",
    description: "Start your journey with the essential 100 Kanji. Includes stroke order.",
    rating: 4.5,
    reviewsCount: 40,
    studentsCount: "10k+",
    badgeColor: "pink",
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80",
    price: 5.0,
    isVerified: false,
    authorAvatar: "https://i.pravatar.cc/150?u=3",
    category: "IT / Tech",
    level: "B2",
    title: "Python for Data Science",
    description: "English vocabulary specifically for DS/ML engineers.",
    rating: 5.0,
    reviewsCount: 12,
    studentsCount: "300",
    badgeColor: "blue",
  },
  {
    id: "4",
    image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&q=80",
    price: 12.5,
    isVerified: true,
    authorAvatar: "https://i.pravatar.cc/150?u=4",
    category: "Academic",
    level: "IELTS 7.5+",
    title: "IELTS Masterclass",
    description: "Complete guide to scoring 7.5+ in IELTS Academic. High-level essays included.",
    rating: 4.8,
    reviewsCount: 85,
    studentsCount: "1.2k",
    badgeColor: "secondary",
  },
];

function stripHtml(html: string): string {
  if (typeof document !== "undefined") {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent ?? div.innerText ?? html;
  }
  return html.replace(/<[^>]*>/g, "").trim();
}

function productDtoToCardProps(product: ProductDto): React.ComponentProps<typeof ProductCard> {
  const priceDisplay = product.price === 0 ? "FREE" : product.price;
  const studentsCount =
    product.salesCount >= 1000
      ? `${(product.salesCount / 1000).toFixed(1)}k`
      : String(product.salesCount);
  return {
    id: product.id,
    image: product.coverImageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80",
    price: priceDisplay,
    isVerified: product.author.isVerified,
    authorAvatar: product.author.avatarUrl || "https://i.pravatar.cc/150?u=0",
    category: "Course",
    level: "—",
    title: product.title,
    description: stripHtml(product.descriptionHtml).slice(0, 120) || product.title,
    rating: product.averageRating,
    reviewsCount: product.reviewCount,
    studentsCount,
    badgeColor: "secondary",
  };
}

const PAGE_SIZE = 12;

export default function MarketplacePage() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Languages"]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [sort, setSort] = useState<"popularity" | "rating" | "newest" | "price_asc">("popularity");
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    setPageNumber(1);
  }, [urlQuery]);

  const apiParams = useMemo(
    () => ({
      query: urlQuery.trim() || undefined,
      tags: selectedCategories.length ? selectedCategories.join(",") : undefined,
      maxPrice: priceFilter === "free" ? 0 : undefined,
      sort,
      pageNumber,
      pageSize: PAGE_SIZE,
    }),
    [urlQuery, selectedCategories, priceFilter, sort, pageNumber]
  );

  const { data: rawData, isLoading, isError } = useQuery<PaginatedResponseDto<ProductDto>>({
    queryKey: ["marketplace", "products", apiParams],
    queryFn: () => apiClient.marketplace.getProducts(apiParams),
  });
  const data: PaginatedResponseDto<ProductDto> | undefined = rawData;

  const useFallback = isError || (data?.items?.length === 0 && pageNumber === 1);
  const items = useFallback ? FALLBACK_PRODUCTS : (data?.items ?? []).map((p: ProductDto) => productDtoToCardProps(p));
  const totalCount = useFallback ? FALLBACK_PRODUCTS.length : (data?.totalCount ?? 0);
  const totalPages = useFallback ? 1 : (data?.totalPages ?? 1);
  const hasNextPage = data?.hasNextPage ?? false;
  const hasPreviousPage = data?.hasPreviousPage ?? false;
  const showSkeleton = isLoading && !data?.items?.length;

  return (
    <div className="flex h-full overflow-hidden bg-app-bg">
      <MarketplaceFilters
        selectedCategories={selectedCategories}
        selectedLevels={selectedLevels}
        priceFilter={priceFilter}
        onCategoriesChange={setSelectedCategories}
        onLevelsChange={setSelectedLevels}
        onPriceChange={setPriceFilter}
      />

      <main className="flex-1 overflow-y-auto p-8 custom-scroll relative flex flex-col">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col flex-1 pt-8">
          <div className="flex justify-between items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-white">Featured Courses</h2>
            <div className="flex items-center gap-4">
              <div className="text-xs text-gray-500">
                {isLoading ? "Loading…" : `Showing ${items.length} of ${totalCount} results`}
              </div>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as typeof sort);
                  setPageNumber(1);
                }}
                className="bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm text-white focus:border-brand-primary"
              >
                <option value="popularity">Popularity</option>
                <option value="rating">Rating</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price</option>
              </select>
            </div>
          </div>

          {showSkeleton ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-app-surface rounded-xl overflow-hidden border border-white/5 h-80 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {items.map((product) => (
                  <ProductCard key={product.id ?? product.title} {...product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    type="button"
                    disabled={!hasPreviousPage}
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    className="px-4 py-2 rounded-lg border border-app-border bg-app-surface text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-app-hover transition"
                  >
                    <i className="fas fa-chevron-left mr-1" /> Previous
                  </button>
                  <span className="text-sm text-gray-400 px-4">
                    Page {pageNumber} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={!hasNextPage}
                    onClick={() => setPageNumber((p) => p + 1)}
                    className="px-4 py-2 rounded-lg border border-app-border bg-app-surface text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-app-hover transition"
                  >
                    Next <i className="fas fa-chevron-right ml-1" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
