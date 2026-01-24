import React from 'react';
import { MarketplaceFilters } from '@/components/marketplace/marketplace-filters';
import { ProductCard } from '@/components/marketplace/product-card';

export default function MarketplacePage() {
  const products = [
    {
      id: 1,
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
      badgeColor: 'secondary' as const
    },
    {
      id: 2,
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
      badgeColor: 'pink' as const
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80",
      price: 5.00,
      isVerified: false,
      authorAvatar: "https://i.pravatar.cc/150?u=3",
      category: "IT / Tech",
      level: "B2",
      title: "Python for Data Science",
      description: "English vocabulary specifically for DS/ML engineers.",
      rating: 5.0,
      reviewsCount: 12,
      studentsCount: "300",
      badgeColor: 'blue' as const
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&q=80",
      price: 12.50,
      isVerified: true,
      authorAvatar: "https://i.pravatar.cc/150?u=4",
      category: "Academic",
      level: "IELTS 7.5+",
      title: "IELTS Masterclass",
      description: "Complete guide to scoring 7.5+ in IELTS Academic. High-level essays included.",
      rating: 4.8,
      reviewsCount: 85,
      studentsCount: "1.2k",
      badgeColor: 'secondary' as const
    }
  ];

  return (
    <div className="flex h-full overflow-hidden bg-app-bg">
      {/* LEFT: FILTERS SIDEBAR */}
      <MarketplaceFilters />

      {/* RIGHT: GRID AREA */}
      <main className="flex-1 overflow-y-auto p-8 custom-scroll relative">
        {/* Background Gradient Decoration */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Featured Courses</h2>
            <div className="text-xs text-gray-500">Showing {products.length} results</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
