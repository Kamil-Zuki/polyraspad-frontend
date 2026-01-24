import React, { useState } from 'react';

export function ProductTabs() {
  const [activeTab, setActiveTab] = useState('description');

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'cards', label: 'Card List (2000)' },
    { id: 'reviews', label: 'Reviews' },
  ];

  return (
    <div className="space-y-10">
      {/* Tabs Navigation */}
      <div className="border-b border-app-border">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-sm font-medium transition-all relative ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="text-gray-300 space-y-8">
        {activeTab === 'description' && (
          <div className="space-y-6">
            <p className="text-lg leading-relaxed">
              Master the vocabulary needed for high-stakes business meetings, contract negotiations, and corporate strategy. This deck is curated from real-world business cases and Wall Street Journal articles.
            </p>
            
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">What you'll learn</h3>
              <ul className="space-y-3">
                <li className="flex gap-3 items-center">
                  <i className="fas fa-check-circle text-brand-green" />
                  <span>500+ advanced idioms for negotiations</span>
                </li>
                <li className="flex gap-3 items-center">
                  <i className="fas fa-check-circle text-brand-green" />
                  <span>Email writing templates and phrases</span>
                </li>
                <li className="flex gap-3 items-center">
                  <i className="fas fa-check-circle text-brand-green" />
                  <span>Native audio for every single card (US & UK accents)</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mt-8">Sample Cards</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-panel p-4 rounded-xl border border-white/5 bg-white/5">
                  <div className="text-xs text-gray-500 uppercase font-bold mb-2">Front</div>
                  <div className="text-white text-lg font-medium">
                    "Let's <span className="text-brand-primary">table</span> this discussion."
                  </div>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-white/5 bg-white/5">
                  <div className="text-xs text-gray-500 uppercase font-bold mb-2">Back</div>
                  <div className="text-gray-300">
                    Отложить обсуждение (на потом).
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cards' && (
          <div className="flex items-center justify-center h-48 border-2 border-dashed border-white/10 rounded-2xl text-gray-500">
            Card list preview is coming soon...
          </div>
        )}

        {activeTab === 'reviews' && (
          <ProductReviews />
        )}
      </div>
    </div>
  );
}

export function ProductReviews() {
  const reviews = [
    {
      id: 1,
      author: "John Doe",
      initials: "JD",
      isVerified: true,
      rating: 5,
      content: "The audio quality is amazing. Really helped me with my presentation last week.",
      avatar: null
    },
    {
      id: 2,
      author: "Sarah Smith",
      initials: "SS",
      isVerified: true,
      rating: 4,
      content: "Great content, but I wish there were more examples for the finance section.",
      avatar: "https://i.pravatar.cc/150?u=5"
    }
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white mb-6">Student Reviews</h3>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-app-surface p-5 rounded-xl border border-app-border group hover:border-white/10 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                {review.avatar ? (
                  <img src={review.avatar} alt={review.author} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                    {review.initials}
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold text-white">{review.author}</div>
                  {review.isVerified && (
                    <div className="text-[10px] text-brand-green flex items-center gap-1">
                      <i className="fas fa-check-circle" /> Verified Purchase
                    </div>
                  )}
                </div>
              </div>
              <div className="text-brand-yellow text-xs">
                {Array.from({ length: 5 }).map((_, i) => (
                  <i key={i} className={`${i < review.rating ? 'fas' : 'far'} fa-star`} />
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {review.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
