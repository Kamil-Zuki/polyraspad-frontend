"use client"

import React from 'react';
import { ProductHeader } from '@/components/marketplace/product-header';
import { PurchaseCard } from '@/components/marketplace/purchase-card';
import { ProductTabs } from '@/components/marketplace/product-details';
import Image from 'next/image';

export default function ProductPage({ params }: { params: { id: string } }) {
  // In a real app, we would fetch the product data based on params.id
  const productData = {
    title: "Advanced Business English Pro",
    image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1600&q=80",
    category: "BUSINESS",
    level: "ENGLISH C1",
    rating: 4.8,
    reviewsCount: 124,
    studentsCount: "2,530",
    price: 19.99,
    authorName: "Elena English",
    authorAvatar: "https://i.pravatar.cc/150?u=1",
    authorRole: "Top Rated Seller"
  };

  return (
    <div className="flex-1 bg-app-bg relative">
      {/* HERO BACKGROUND */}
      <div className="w-full h-96 absolute top-0 left-0 z-0 overflow-hidden">
        <Image 
          src={productData.image} 
          alt="Hero background"
          fill
          className="object-cover opacity-20 blur-xl"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-app-bg/80 via-app-bg/90 to-app-bg" />
      </div>

      {/* MAIN CONTENT */}
      <main className="w-full max-w-7xl mx-auto px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* LEFT COLUMN: Product Info */}
          <div className="lg:col-span-2 space-y-12">
            <ProductHeader 
              title={productData.title}
              image={productData.image}
              category={productData.category}
              level={productData.level}
              rating={productData.rating}
              reviewsCount={productData.reviewsCount}
              studentsCount={productData.studentsCount}
            />

            <ProductTabs />
          </div>

          {/* RIGHT COLUMN: Sticky Action Card */}
          <div className="lg:col-span-1">
            <PurchaseCard 
              price={productData.price}
              authorName={productData.authorName}
              authorAvatar={productData.authorAvatar}
              authorRole={productData.authorRole}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
