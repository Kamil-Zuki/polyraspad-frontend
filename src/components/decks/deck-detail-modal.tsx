"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import {
  X,
  Copy,
  Layers,
  Clock,
  Play,
  Pencil,
  Trash2,
  Globe,
  Lock,
  ShoppingBag,
  BookOpen,
  Sparkles,
  Check,
} from "lucide-react"
import { DeckDetailDto } from "@/lib/api/types"
import { cn } from "@/lib/utils"

interface DeckDetailModalProps {
  deckId: string | null
  isOpen: boolean
  onClose: () => void
  deck?: DeckDetailDto | null
  isLoading?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

function formatDeckDate(value?: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function DeckDetailModal({
  deckId,
  isOpen,
  onClose,
  deck,
  isLoading,
  onEdit,
  onDelete,
}: DeckDetailModalProps) {
  const [copied, setCopied] = useState(false)
  const studyHref = deckId ? `/study/${deckId}` : "#"

  useEffect(() => {
    if (!isOpen) setCopied(false)
  }, [isOpen])

  const handleCopy = async () => {
    if (!deck?.title) return
    try {
      await navigator.clipboard.writeText(deck.title)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  const stats = deck?.stats
  const totalCards = stats?.totalCardsCount ?? deck?.cardCount ?? 0
  const newCards = stats?.newCardsCount ?? 0
  const learningCards = stats?.learningCardsCount ?? 0
  const dueCards = stats?.dueCardsCount ?? 0
  const studyableCount = stats?.studyableNowCount ?? 0

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={onClose}
        />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d10] shadow-2xl shadow-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 focus:outline-none"
          onEscapeKeyDown={onClose}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-gray-400 transition hover:border-white/20 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {isLoading || !deck ? (
            <div className="grid min-h-[420px] place-items-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row">
              {/* Left — cover preview */}
              <div className="relative flex aspect-[4/3] items-center justify-center bg-neutral-950 md:aspect-auto md:w-[55%]">
                {deck.coverImageUrl ? (
                  <img
                    src={deck.coverImageUrl}
                    alt={deck.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10">
                    <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
                      <Layers className="h-12 w-12 text-brand-primary/40" />
                    </div>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0d0d10]/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#0d0d10]/60" />
              </div>

              {/* Right — details */}
              <div className="flex w-full flex-col md:w-[45%] md:border-l md:border-white/10">
                <div className="flex flex-1 flex-col p-6 md:p-8">
                  {/* Header row */}
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary text-white">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{deck.title}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{deck.isPublic ? "Public deck" : "Private deck"}</span>
                          {deck.forkedFromId && (
                            <span className="flex items-center gap-1 text-brand-secondary">
                              <ShoppingBag className="h-3 w-3" /> Purchased
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="mb-2 text-2xl font-bold text-white md:text-3xl">{deck.title}</h2>

                  {/* Deck details section */}
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Deck details
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-gray-400 transition hover:bg-white/5 hover:text-white"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied" : "Copy title"}
                    </button>
                  </div>

                  {/* Description */}
                  <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="text-sm leading-relaxed text-gray-300">
                      {deck.description || "No description provided."}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="mb-6 flex flex-wrap gap-2">
                    <span
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                        deck.isPublic
                          ? "border-brand-primary/30 bg-brand-primary/10 text-brand-primary"
                          : "border-white/10 bg-white/5 text-gray-400"
                      )}
                    >
                      {deck.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      {deck.isPublic ? "Public" : "Private"}
                    </span>
                    <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300">
                      <Layers className="h-3 w-3" />
                      {totalCards} {totalCards === 1 ? "card" : "cards"}
                    </span>
                    {studyableCount > 0 && (
                      <span className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-500">
                        <Clock className="h-3 w-3" />
                        {studyableCount} to study
                      </span>
                    )}
                  </div>

                  {/* Metadata grid */}
                  <div className="mb-6 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                      <div className="mb-1 text-gray-500">Created</div>
                      <div className="font-medium text-gray-200">{formatDeckDate(deck.createdAt)}</div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                      <div className="mb-1 text-gray-500">Total cards</div>
                      <div className="font-medium text-gray-200">{totalCards}</div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                      <div className="mb-1 text-gray-500">New</div>
                      <div className="font-medium text-brand-primary">{newCards}</div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                      <div className="mb-1 text-gray-500">Due</div>
                      <div className="font-medium text-amber-500">{dueCards}</div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-auto space-y-3">
                    <Link
                      href={studyHref}
                      onClick={onClose}
                      className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition hover:shadow-brand-primary/30"
                    >
                      <Sparkles className="h-4 w-4" />
                      Study this deck
                      <Play className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </Link>

                    <div className="grid grid-cols-3 gap-2">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose()
                            onEdit()
                          }}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose()
                            onDelete()
                          }}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
