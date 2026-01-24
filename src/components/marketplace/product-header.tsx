import React from 'react';
import Image from 'next/image';

interface ProductHeaderProps {
  image: string;
  category: string;
  level: string;
  title: string;
  rating: number;
  reviewsCount: number;
  studentsCount: string;
}

export function ProductHeader({
  image,
  category,
  level,
  title,
  rating,
  reviewsCount,
  studentsCount
}: ProductHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <div className="w-32 h-32 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex-shrink-0 relative">
        <Image 
          src={image} 
          alt={title}
          fill
          className="object-cover"
        />
      </div>
      <div>
        <div className="flex gap-2 mb-3">
          <span className="px-2 py-1 rounded bg-brand-secondary/20 text-brand-secondary text-xs font-bold border border-brand-secondary/30">
            {category}
          </span>
          <span className="px-2 py-1 rounded bg-white/5 text-gray-400 text-xs font-bold border border-white/10">
            {level}
          </span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2 leading-tight">
          {title}
        </h1>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center text-brand-yellow">
            <i className="fas fa-star" />
            <i className="fas fa-star" />
            <i className="fas fa-star" />
            <i className="fas fa-star" />
            <i className="fas fa-star-half-alt" />
            <span className="ml-1 text-white font-bold">{rating.toFixed(1)}</span>
            <span className="ml-1 text-gray-500">({reviewsCount} reviews)</span>
          </div>
          <div className="text-gray-500">•</div>
          <div className="text-gray-400">{studentsCount} students enrolled</div>
        </div>
      </div>
    </div>
  );
}
