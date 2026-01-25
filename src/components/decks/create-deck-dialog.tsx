"use client"

import { useState } from "react"
import { useCreateDeck } from "@/lib/react-query/queries"
import type { CreateDeckDto } from "@/lib/api/types"

interface CreateDeckDialogProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  parentDeckId?: string | null
}

export function CreateDeckDialog({
  isOpen,
  onClose,
  projectId,
  parentDeckId,
}: CreateDeckDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [error, setError] = useState("")
  const createDeck = useCreateDeck()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!title.trim()) {
      setError("Title is required")
      return
    }

    try {
      const data: CreateDeckDto = {
        projectId,
        title: title.trim(),
        description: description.trim() || null,
        parentDeckId: parentDeckId || null,
        isPublic,
        coverImageUrl: null,
      }

      await createDeck.mutateAsync(data)
      setTitle("")
      setDescription("")
      setIsPublic(false)
      onClose() // This will trigger refetch in parent component
    } catch (err: any) {
      setError(err.message || "Failed to create deck")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-panel rounded-xl p-6 w-full max-w-md border-white/10">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <i className="fas fa-plus text-brand-purple" /> Create Deck
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Deck Title <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-white/10 rounded-lg bg-dark-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/50 transition"
              placeholder="e.g., Vocabulary Basics"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-white/10 rounded-lg bg-dark-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/50 transition resize-none"
              placeholder="Optional description..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isPublic"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 text-brand-purple bg-dark-800 border-white/10 rounded focus:ring-brand-purple focus:ring-2"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-300">
              Make this deck public
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createDeck.isPending}
              className="px-4 py-2 bg-brand-purple hover:bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            >
              {createDeck.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

