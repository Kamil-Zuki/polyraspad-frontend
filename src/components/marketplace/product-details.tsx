"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { ProductReviewDto } from "@/lib/api/types";

export interface ProductTabsProps {
  productId: string;
  descriptionHtml?: string;
  reviewCount?: number;
  /** Показывать кнопку Demo (Smart Preview) только для не купивших */
  isOwned?: boolean;
}

export function ProductTabs({
  productId,
  descriptionHtml,
  reviewCount = 0,
  isOwned = false,
}: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState("description");
  const [previewOpen, setPreviewOpen] = useState(false);

  const tabs = [
    { id: "description", label: "Description" },
    { id: "cards", label: "Card List" },
    { id: "reviews", label: `Reviews${reviewCount > 0 ? ` (${reviewCount})` : ""}` },
  ];

  return (
    <div className="space-y-10">
      {/* Кнопка Demo (Smart Preview) — только если в API и товар не куплен (SR-MKT-02) */}
      {!isOwned && (
        <div className="flex justify-end">
          <SmartPreviewButton productId={productId} onOpen={() => setPreviewOpen(true)} />
        </div>
      )}
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

      <div className="text-gray-300 space-y-8">
        {activeTab === 'description' && (
          <div className="space-y-6">
            {descriptionHtml ? (
              <div
                className="prose prose-invert max-w-none text-gray-300"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            ) : (
              <>
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
              </>
            )}
          </div>
        )}

        {activeTab === 'cards' && (
          <div className="flex items-center justify-center h-48 border-2 border-dashed border-white/10 rounded-2xl text-gray-500">
            Card list preview is coming soon...
          </div>
        )}

        {activeTab === "reviews" && (
          <ProductReviews productId={productId} />
        )}
      </div>

      {previewOpen && (
        <SmartPreviewModal
          productId={productId}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}

/** Кнопка «Попробовать» / Demo: запуск Smart Preview (SR-MKT-02) */
function SmartPreviewButton({
  productId,
  onOpen,
}: {
  productId: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary/20 text-brand-primary border border-brand-primary/40 hover:bg-brand-primary/30 transition font-medium text-sm"
    >
      <i className="fas fa-play" aria-hidden />
      Попробовать (Demo)
    </button>
  );
}

/** Модальное окно с сэмплом карточек (Smart Preview) */
function SmartPreviewModal({
  productId,
  onClose,
}: {
  productId: string;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["marketplace", "product", productId, "preview"],
    queryFn: () => apiClient.marketplace.getProductPreview(productId),
    enabled: !!productId,
  });
  const items = data?.items ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label="Демо: примеры карточек"
    >
      <div className="bg-app-surface border border-app-border rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-app-border">
          <h3 className="text-lg font-bold text-white">Попробовать (Smart Preview)</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg transition"
            aria-label="Закрыть"
          >
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <span className="text-sm">Загрузка примеров карточек…</span>
            </div>
          )}
          {isError && (
            <p className="text-gray-400 text-sm py-4">
              Не удалось загрузить демо. Попробуйте позже.
            </p>
          )}
          {!isLoading && !isError && items.length === 0 && (
            <p className="text-gray-400 text-sm py-4">Нет доступных карточек для предпросмотра.</p>
          )}
          {!isLoading && !isError && items.length > 0 && (
            <ul className="space-y-4">
              {items.map((card) => (
                <li
                  key={card.id}
                  className="p-4 rounded-xl border border-app-border bg-app-bg/50"
                >
                  <div className="text-xs text-gray-500 uppercase font-bold mb-2">Карточка</div>
                  <div
                    className="text-white font-medium mb-2"
                    dangerouslySetInnerHTML={{ __html: card.sentence }}
                  />
                  <div className="text-gray-400 text-sm">
                    <span className="text-brand-primary">{card.targetWord}</span>
                    {card.translation && ` — ${card.translation}`}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export interface ProductReviewsProps {
  productId: string;
}

/** Блок отзывов: при наличии API — список; иначе заглушка (SR-MKT-05) */
export function ProductReviews({ productId }: ProductReviewsProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["marketplace", "product", productId, "reviews"],
    queryFn: () => apiClient.marketplace.getProductReviews(productId),
    enabled: !!productId,
    retry: false,
  });
  const items = data?.items ?? [];
  const hasReviews = items.length > 0;

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white mb-6">Отзывы</h3>
      {isLoading && (
        <div className="text-gray-400 text-sm py-4">Загрузка отзывов…</div>
      )}
      {!isLoading && (isError || !hasReviews) && (
        <div className="flex items-center justify-center py-12 border-2 border-dashed border-white/10 rounded-2xl text-gray-500 text-sm">
          Отзывы скоро появятся
        </div>
      )}
      {!isLoading && !isError && hasReviews && (
        <div className="space-y-4">
          {items.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: ProductReviewDto }) {
  const author = review.author;
  const displayName = author?.displayName ?? "Пользователь";
  const avatarUrl = author?.avatarUrl;
  const initials = displayName
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-app-surface p-5 rounded-xl border border-app-border group hover:border-white/10 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
              {initials}
            </div>
          )}
          <div>
            <div className="text-sm font-bold text-white">{displayName}</div>
            {review.isVerifiedPurchase && (
              <div className="text-[10px] text-brand-green flex items-center gap-1">
                <i className="fas fa-check-circle" /> Verified Purchase
              </div>
            )}
          </div>
        </div>
        <div className="text-brand-yellow text-xs">
          {Array.from({ length: 5 }).map((_, i) => (
            <i key={i} className={`${i < review.rating ? "fas" : "far"} fa-star`} />
          ))}
        </div>
      </div>
      <p className="text-sm text-gray-400 leading-relaxed">{review.comment}</p>
      {review.authorReply && (
        <div className="mt-3 pl-4 border-l-2 border-brand-primary/40 text-sm text-gray-500">
          <span className="text-gray-400">Ответ автора: </span>
          {review.authorReply}
        </div>
      )}
    </div>
  );
}
