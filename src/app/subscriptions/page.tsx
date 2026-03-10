"use client"

import { useState, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { ApiError } from "@/lib/api/errors"
import type { DeckSubscriptionDto } from "@/lib/api/types"
import { SubscriptionsEmptyState } from "./subscriptions-empty-state"
import { SubscriptionRow } from "./subscription-row"

export default function SubscriptionsPage() {
  const queryClient = useQueryClient()
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => apiClient.subscriptions.getSubscriptions(),
  })
  const [unsubscribingDeckId, setUnsubscribingDeckId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleUnsubscribe = useCallback(
    async (deckId: string) => {
      setErrorMessage(null)
      setUnsubscribingDeckId(deckId)
      try {
        await apiClient.subscriptions.deleteSubscription(deckId)
        await queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
      } catch (e) {
        if (e instanceof ApiError && (e.status === 403 || e.status === 404)) {
          setErrorMessage(e.detail ?? e.message)
        } else {
          setErrorMessage(e instanceof Error ? e.message : "Не удалось отписаться")
        }
      } finally {
        setUnsubscribingDeckId(null)
      }
    },
    [queryClient]
  )

  const isEmpty = !isLoading && (!subscriptions || subscriptions.length === 0)
  const hasItems = !isLoading && subscriptions.length > 0

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-app-bg">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Subscriptions</h1>
          <p className="text-gray-400">Manage your deck subscriptions</p>
        </header>

        <div className="glass-panel rounded-xl p-8 border border-white/10">
          {errorMessage && (
            <div
              className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-12" aria-busy="true">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <span className="text-gray-400 text-sm">Loading…</span>
              </div>
            </div>
          )}

          {isEmpty && <SubscriptionsEmptyState />}

          {hasItems && (
            <ul className="space-y-3 list-none p-0 m-0">
              {subscriptions.map((sub: DeckSubscriptionDto) => (
                <SubscriptionRow
                  key={sub.id}
                  deckId={sub.deckId}
                  title={sub.deckTitle ?? sub.deckId ?? "Deck"}
                  onUnsubscribe={handleUnsubscribe}
                  isUnsubscribing={unsubscribingDeckId === sub.deckId}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
