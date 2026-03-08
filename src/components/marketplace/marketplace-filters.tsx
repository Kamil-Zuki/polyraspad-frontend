"use client";

import React from "react";

const CATEGORIES = ["Languages", "Medicine", "Programming"] as const;
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "N5"] as const;

export type PriceFilter = "all" | "free";

export interface MarketplaceFiltersProps {
  selectedCategories?: string[];
  selectedLevels?: string[];
  priceFilter?: PriceFilter;
  onCategoriesChange?: (categories: string[]) => void;
  onLevelsChange?: (levels: string[]) => void;
  onPriceChange?: (price: PriceFilter) => void;
}

export function MarketplaceFilters({
  selectedCategories = ["Languages"],
  selectedLevels = [],
  priceFilter = "all",
  onCategoriesChange,
  onLevelsChange,
  onPriceChange,
}: MarketplaceFiltersProps) {
  const toggleCategory = (cat: string) => {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    onCategoriesChange?.(next);
  };

  const toggleLevel = (level: string) => {
    const next = selectedLevels.includes(level)
      ? selectedLevels.filter((l) => l !== level)
      : [...selectedLevels, level];
    onLevelsChange?.(next);
  };

  return (
    <div className="w-64 bg-app-bg border-r border-app-border p-6 h-full overflow-y-auto hidden lg:block">
      <div className="mb-8">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Category</h3>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="w-4 h-4 rounded border-app-border bg-app-surface text-brand-primary focus:ring-offset-app-bg"
              />
              <span className="text-sm text-gray-300 group-hover:text-white transition">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Level (CEFR)</h3>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((level) => {
            const isSelected = selectedLevels.includes(level);
            return (
              <button
                key={level}
                type="button"
                onClick={() => toggleLevel(level)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  isSelected
                    ? "bg-brand-primary/20 text-brand-primary border border-brand-primary/30"
                    : "bg-app-surface text-gray-400 border border-app-border hover:text-white hover:border-gray-500"
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Price</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="price"
              checked={priceFilter === "all"}
              onChange={() => onPriceChange?.("all")}
              className="w-4 h-4 bg-app-surface border-app-border text-brand-primary focus:ring-offset-app-bg"
            />
            <span className="text-sm text-gray-300 group-hover:text-white transition">All</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="price"
              checked={priceFilter === "free"}
              onChange={() => onPriceChange?.("free")}
              className="w-4 h-4 bg-app-surface border-app-border text-brand-primary focus:ring-offset-app-bg"
            />
            <span className="text-sm text-gray-300 group-hover:text-white transition">Free Only</span>
          </label>
        </div>
      </div>
    </div>
  );
}
