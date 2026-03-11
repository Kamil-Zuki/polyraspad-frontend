"use client"

import { useState, useEffect, useRef } from "react"
import { useDeck, useUpdateDeck } from "@/lib/react-query/queries"
import { uploadImage } from "@/lib/api/media-client"
import type { UpdateDeckDto, ContributionPolicyDto } from "@/lib/api/types"
import { ContributionPolicyDto as ContributionPolicyEnum } from "@/lib/api/types"

interface DeckSettingsDialogProps {
  deckId: string | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const CONTRIBUTION_OPTIONS: { value: ContributionPolicyDto; label: string }[] = [
  { value: ContributionPolicyEnum.Open, label: "Open" },
  { value: ContributionPolicyEnum.Restricted, label: "Restricted" },
  { value: ContributionPolicyEnum.Closed, label: "Closed" },
]

export function DeckSettingsDialog({
  deckId,
  isOpen,
  onClose,
  onSuccess,
}: DeckSettingsDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [contributionPolicy, setContributionPolicy] = useState<ContributionPolicyDto>(ContributionPolicyEnum.Open)
  const [error, setError] = useState("")
  const coverImageUrlRef = useRef<string>("")

  const { data: deck, isLoading } = useDeck(deckId ?? "")
  const updateDeck = useUpdateDeck()

  useEffect(() => {
    if (deck) {
      setTitle(deck.title)
      setDescription(deck.description ?? "")
      setIsPublic(deck.isPublic)
      const cover = deck.coverImageUrl ?? ""
      setCoverImageUrl(cover)
      coverImageUrlRef.current = cover
    }
  }, [deck])

  useEffect(() => {
    if (!isOpen) setError("")
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!deckId) return
    try {
      const effectiveCover = (coverImageUrlRef.current || coverImageUrl).trim() || null
      const data: UpdateDeckDto = {
        title: title.trim() || undefined,
        description: description.trim() || null,
        isPublic,
        coverImageUrl: effectiveCover,
        contributionPolicy,
      }
      await updateDeck.mutateAsync({ id: deckId, data })
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update deck")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-panel rounded-xl p-6 w-full max-w-md border-white/10 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <i className="fas fa-cog text-brand-primary" />
          Deck Settings
        </h2>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-10 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-24 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-10 bg-white/10 rounded-lg animate-pulse" />
          </div>
        ) : !deck ? (
          <p className="text-gray-400">Deck not found.</p>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="deck-settings-title" className="block text-sm font-medium text-gray-300 mb-1">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  id="deck-settings-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-white/10 rounded-lg bg-app-bg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary/50 transition"
                  placeholder="Deck title"
                />
              </div>

              <div>
                <label htmlFor="deck-settings-description" className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="deck-settings-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-white/10 rounded-lg bg-app-bg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary/50 transition resize-none"
                  placeholder="Optional description..."
                />
              </div>

              <div>
                <label htmlFor="deck-settings-cover" className="block text-sm font-medium text-gray-300 mb-1">
                  Cover image URL
                </label>
                <input
                  id="deck-settings-cover"
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => {
                    const v = e.target.value
                    setCoverImageUrl(v)
                    coverImageUrlRef.current = v
                  }}
                  className="w-full px-3 py-2 border border-white/10 rounded-lg bg-app-bg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary/50 transition"
                  placeholder="https://..."
                />
                <input
                  id="deck-settings-cover-upload"
                  type="file"
                  accept="image/*"
                  aria-label="Upload image"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      const { url } = await uploadImage(file)
                      coverImageUrlRef.current = url
                      setCoverImageUrl(url)
                    } catch (err: unknown) {
                      setError(err instanceof Error ? err.message : "Upload failed")
                    }
                    e.target.value = ""
                  }}
                  className="mt-2 w-full text-sm text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-primary/20 file:text-brand-primary hover:file:bg-brand-primary/30"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="deck-settings-public"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 text-brand-primary bg-app-bg border-white/10 rounded focus:ring-brand-primary focus:ring-2"
                />
                <label htmlFor="deck-settings-public" className="text-sm text-gray-300">
                  Public deck
                </label>
              </div>

              <div>
                <label htmlFor="deck-settings-policy" className="block text-sm font-medium text-gray-300 mb-1">
                  Contribution policy
                </label>
                <select
                  id="deck-settings-policy"
                  value={contributionPolicy}
                  onChange={(e) => setContributionPolicy(Number(e.target.value) as ContributionPolicyDto)}
                  className="w-full px-3 py-2 border border-white/10 rounded-lg bg-app-bg text-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary/50 transition"
                >
                  {CONTRIBUTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-300 bg-app-surface hover:bg-white/10 rounded-lg transition-colors border border-app-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateDeck.isPending}
                  className="px-4 py-2 bg-brand-primary hover:brightness-110 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {updateDeck.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
