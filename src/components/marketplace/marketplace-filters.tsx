import React from 'react';

export function MarketplaceFilters() {
  return (
    <div className="w-64 bg-app-bg border-r border-app-border p-6 h-full overflow-y-auto hidden lg:block">
      <div className="mb-8">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Category</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded border-app-border bg-app-surface text-brand-primary focus:ring-offset-app-bg"
            />
            <span className="text-sm text-gray-300 group-hover:text-white transition">Languages</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-app-border bg-app-surface text-brand-primary focus:ring-offset-app-bg"
            />
            <span className="text-sm text-gray-300 group-hover:text-white transition">Medicine</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-app-border bg-app-surface text-brand-primary focus:ring-offset-app-bg"
            />
            <span className="text-sm text-gray-300 group-hover:text-white transition">Programming</span>
          </label>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Level (CEFR)</h3>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-1 bg-brand-primary/20 text-brand-primary border border-brand-primary/30 rounded-lg text-xs font-bold">
            A1
          </button>
          <button className="px-3 py-1 bg-app-surface text-gray-400 border border-app-border rounded-lg text-xs font-medium hover:text-white hover:border-gray-500 transition">
            A2
          </button>
          <button className="px-3 py-1 bg-app-surface text-gray-400 border border-app-border rounded-lg text-xs font-medium hover:text-white hover:border-gray-500 transition">
            B1
          </button>
          <button className="px-3 py-1 bg-app-surface text-gray-400 border border-app-border rounded-lg text-xs font-medium hover:text-white hover:border-gray-500 transition">
            B2
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Price</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="price"
              className="w-4 h-4 bg-app-surface border-app-border text-brand-primary focus:ring-offset-app-bg"
              defaultChecked
            />
            <span className="text-sm text-gray-300 group-hover:text-white transition">All</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="price"
              className="w-4 h-4 bg-app-surface border-app-border text-brand-primary focus:ring-offset-app-bg"
            />
            <span className="text-sm text-gray-300 group-hover:text-white transition">Free Only</span>
          </label>
        </div>
      </div>
    </div>
  );
}
