import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export type ProductCardBadgeColor = 'secondary' | 'pink' | 'blue';

export interface ProductCardProps {
  id?: string;
  image: string;
  price: string | number;
  isVerified?: boolean;
  authorAvatar: string;
  category: string;
  level: string;
  title: string;
  description: string;
  rating: number;
  reviewsCount: number;
  studentsCount: string;
  badgeColor?: ProductCardBadgeColor;
}

export function ProductCard({
  id,
  image,
  price,
  isVerified,
  authorAvatar,
  category,
  level,
  title,
  description,
  rating,
  reviewsCount,
  studentsCount,
  badgeColor = 'secondary'
}: ProductCardProps) {
  const badgeClasses = {
    secondary: 'text-brand-secondary bg-brand-secondary/10',
    pink: 'text-brand-pink bg-brand-pink/10',
    blue: 'text-blue-400 bg-blue-500/10',
  };

  const content = (
    <>
      {/* Cover */}
      <div className="h-48 relative">
        <Image 
          src={image} 
          alt={title}
          fill
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-app-surface via-transparent to-transparent" />
        
        {/* Price Tag */}
        <div className="absolute top-3 right-3 bg-white/10 backdrop-blur-md px-2 py-1 rounded-lg text-white font-bold text-xs shadow-lg border border-white/10">
          {typeof price === 'number' ? `$${price.toFixed(2)}` : price}
        </div>
        
        {/* Verified Author Badge */}
        {isVerified && (
          <div className="absolute top-3 left-3 bg-brand-primary text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg flex items-center gap-1">
            <i className="fas fa-check-circle" /> VERIFIED
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 pt-2 relative">
        {/* Avatar Overlap */}
        <div className="absolute -top-6 right-4">
          <div className="relative w-10 h-10 rounded-full border-2 border-app-surface shadow-md overflow-hidden">
            <Image 
              src={authorAvatar} 
              alt="Author" 
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-2">
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${badgeClasses[badgeColor]}`}>
            {category}
          </span>
          <span className="text-[10px] uppercase font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded">
            {level}
          </span>
        </div>

        <h3 className="text-white font-bold text-lg mb-1 leading-tight group-hover:text-brand-primary transition">
          {title}
        </h3>
        <p className="text-xs text-gray-500 mb-4 line-clamp-2">
          {description}
        </p>
        
        <div className="flex items-center justify-between border-t border-app-border pt-3">
          <div className="flex items-center gap-1 text-brand-yellow text-xs font-bold">
            <i className="fas fa-star" /> {rating.toFixed(1)} <span className="text-gray-600 font-normal">({reviewsCount})</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <i className="fas fa-user-friends" /> {studentsCount}
          </div>
        </div>
      </div>
    </>
  );

  const className = "bg-app-surface rounded-xl overflow-hidden border border-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-primary/40 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] group cursor-pointer relative";
  if (id) {
    return (
      <Link href={`/marketplace/product/${id}`} className={className} prefetch={false}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
