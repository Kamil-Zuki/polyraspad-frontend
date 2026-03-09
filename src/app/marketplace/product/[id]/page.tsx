"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { ProductHeader } from "@/components/marketplace/product-header"
import { PurchaseCard } from "@/components/marketplace/purchase-card"
import { ProductTabs } from "@/components/marketplace/product-details"

function formatStudentsCount(n: number): string {
  return n.toLocaleString()
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const id = params?.id ?? ""
  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["marketplace", "product", id],
    queryFn: () => apiClient.marketplace.getProduct(id),
    enabled: !!id,
  })

  if (!id) {
    return (
      <div className="flex-1 bg-app-bg p-8">
        <p className="text-gray-400">Invalid product.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 bg-app-bg p-8" aria-busy="true">
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <span className="text-gray-400 text-sm">Loading product…</span>
        </div>
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="flex-1 bg-app-bg p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-400">
            {error instanceof Error ? error.message : "Product not found."}
          </p>
        </div>
      </div>
    )
  }

  const image = product.coverImageUrl || ""
  const category = "—"
  const level = "—"
  const studentsCount = formatStudentsCount(product.salesCount)
  const authorAvatar =
    product.author?.avatarUrl ?? "https://i.pravatar.cc/150?u=anon"

  return (
    <div className="flex-1 bg-app-bg relative">
      <div className="w-full h-96 absolute top-0 left-0 z-0 overflow-hidden">
        <Image
          src={image}
          alt="Hero background"
          fill
          className="object-cover opacity-20 blur-xl"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-app-bg/80 via-app-bg/90 to-app-bg" />
      </div>

      <main className="w-full max-w-7xl mx-auto px-8 py-12 relative z-10">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition mb-6"
        >
          <i className="fas fa-arrow-left" /> Back to Marketplace
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <ProductHeader
              title={product.title}
              image={image}
              category={category}
              level={level}
              rating={product.averageRating}
              reviewsCount={product.reviewCount}
              studentsCount={studentsCount}
            />

            <ProductTabs descriptionHtml={product.descriptionHtml} />
          </div>

          <div className="lg:col-span-1">
            <PurchaseCard
              price={product.price}
              authorName={product.author?.displayName ?? "—"}
              authorAvatar={authorAvatar}
              authorRole="Creator"
            />
          </div>
        </div>
      </main>
    </div>
  )
}
