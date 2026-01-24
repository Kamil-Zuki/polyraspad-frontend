import React from 'react';
import Image from 'next/image';

interface PurchaseCardProps {
  price: string | number;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
}

export function PurchaseCard({
  price,
  authorName,
  authorAvatar,
  authorRole
}: PurchaseCardProps) {
  return (
    <div className="space-y-6 sticky top-24">
      {/* Purchase Card */}
      <div className="glass-panel p-6 rounded-2xl border border-brand-primary/20 shadow-glow bg-app-surface/50 backdrop-blur-xl">
        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="text-xs text-gray-500 uppercase font-bold mb-1">One-time payment</div>
            <div className="text-4xl font-bold text-white">
              {typeof price === 'number' ? `$${price.toFixed(2)}` : price}
            </div>
          </div>
        </div>

        <button className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold py-3.5 rounded-xl mb-3 shadow-lg flex items-center justify-center gap-2 transition transform hover:brightness-110 active:scale-95">
          Get Access Now
        </button>
        
        <button className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl border border-white/10 transition flex items-center justify-center gap-2 group">
          <i className="fas fa-eye text-brand-primary group-hover:scale-110 transition" />
          Smart Preview (10 Cards)
        </button>

        <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <i className="fas fa-infinity text-brand-primary w-5 text-center" /> Lifetime access
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <i className="fas fa-sync-alt text-brand-primary w-5 text-center" /> Free updates
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <i className="fas fa-mobile-alt text-brand-primary w-5 text-center" /> Mobile & Web
          </div>
        </div>
      </div>

      {/* Author Box */}
      <div className="bg-app-surface p-4 rounded-xl border border-app-border flex items-center gap-4">
        <div className="relative w-12 h-12 rounded-full border-2 border-brand-primary overflow-hidden">
          <Image 
            src={authorAvatar} 
            alt={authorName}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 uppercase font-bold">Created by</div>
          <div className="text-white font-bold hover:text-brand-primary cursor-pointer transition truncate">
            {authorName}
          </div>
          <div className="text-xs text-gray-400">{authorRole}</div>
        </div>
        <button className="text-gray-600 hover:text-white transition">
          <i className="fas fa-envelope" />
        </button>
      </div>
    </div>
  );
}
