"use client"

import { cn } from "@/lib/utils"
import { ALL_COLLECTION_ID, UNSORTED_COLLECTION_ID } from "@/app/reader/reader-constants"
import type { ReaderCollection } from "@/app/reader/library-storage"

interface CollectionSidebarProps {
  booksCount: number
  collections: ReaderCollection[]
  sharedCollections: ReaderCollection[]
  selectedCollectionId: string
  collectionDraftName: string
  isSavingCollection: boolean
  dropTargetCollectionId: string | null
  onSelectCollection: (id: string) => void
  onDraftNameChange: (name: string) => void
  onSaveCollection: () => void
  onClearDraft: () => void
  onCopyShareLink: (collectionId: string) => void
  onDropBook: (bookId: string, collectionId: string) => void
  onDragTargetChange: (collectionId: string | null) => void
  onDragEnd: () => void
}

interface StaticCollectionOption {
  id: string
  name: string
  subtitle: string
  count: number
  accent: string
}

export function CollectionSidebar({
  booksCount,
  collections,
  sharedCollections,
  selectedCollectionId,
  collectionDraftName,
  isSavingCollection,
  dropTargetCollectionId,
  onSelectCollection,
  onDraftNameChange,
  onSaveCollection,
  onClearDraft,
  onCopyShareLink,
  onDropBook,
  onDragTargetChange,
  onDragEnd,
}: CollectionSidebarProps) {
  const staticCollections: StaticCollectionOption[] = [
    {
      id: ALL_COLLECTION_ID,
      name: "All books",
      subtitle: "Entire project library",
      count: booksCount,
      accent: "from-emerald-400/20 to-transparent",
    },
    {
      id: UNSORTED_COLLECTION_ID,
      name: "Unsorted",
      subtitle: "Needs triage",
      count: 0,
      accent: "from-amber-400/20 to-transparent",
    },
  ]

  return (
    <aside className="space-y-5 lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:custom-scroll">
      <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Create collection</p>
            <h3 className="mt-2 text-lg font-semibold text-white">New working set</h3>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
            <i className="fas fa-layer-group" />
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Use collections for genres, study themes, imported courses, or people you want to share with.
        </p>
        <div className="mt-4 space-y-3">
          <input
            type="text"
            value={collectionDraftName}
            onChange={(event) => onDraftNameChange(event.target.value)}
            placeholder="e.g. Crime novels, YouTube interviews"
            className="w-full rounded-2xl border border-white/10 bg-[#070d17] px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-300/70 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void onSaveCollection()}
              disabled={!collectionDraftName.trim() || isSavingCollection}
              className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingCollection ? "Saving..." : "Save collection"}
            </button>
            <button
              type="button"
              onClick={onClearDraft}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300 hover:bg-white/5"
            >
              Clear
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Owned collections</p>
            <h3 className="mt-2 text-lg font-semibold text-white">Project library</h3>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
            {collections.length} collections
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {staticCollections.map((collection) => {
            const isSelected = selectedCollectionId === collection.id
            return (
              <button
                key={collection.id}
                type="button"
                onClick={() => onSelectCollection(collection.id)}
                className={`group relative w-full overflow-hidden rounded-[24px] border px-4 py-4 text-left transition ${
                  isSelected
                    ? "border-emerald-300/60 bg-emerald-300/10 text-white shadow-[0_16px_30px_rgba(0,0,0,0.22)]"
                    : "border-white/8 bg-[#0a111b] text-slate-200 hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${collection.accent} opacity-80`} />
                <div className="relative flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{collection.name}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">{collection.subtitle}</div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-200">
                    {collection.id === UNSORTED_COLLECTION_ID
                      ? booksCount
                      : collection.count}
                  </div>
                </div>
              </button>
            )
          })}

          {collections.map((collection) => {
            const isSelected = selectedCollectionId === collection.id
            const isDropTarget = dropTargetCollectionId === collection.id
            return (
              <div
                key={collection.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectCollection(collection.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onSelectCollection(collection.id)
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  onDragTargetChange(collection.id)
                }}
                onDragLeave={() => onDragTargetChange(null)}
                onDrop={(e) => {
                  e.preventDefault()
                  const bookId = e.dataTransfer.getData("text/plain")
                  if (bookId) onDropBook(bookId, collection.id)
                  onDragTargetChange(null)
                }}
                className={cn(
                  "w-full cursor-pointer rounded-[24px] border px-4 py-4 text-left transition",
                  isSelected
                    ? "border-emerald-300/60 bg-emerald-300/10 text-white shadow-[0_16px_30px_rgba(0,0,0,0.22)]"
                    : "border-white/8 bg-[#0a111b] text-slate-200 hover:border-white/20 hover:bg-white/[0.04]",
                  isDropTarget && "ring-2 ring-emerald-400/70",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{collection.name}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">
                      {collection.bookCount} book{collection.bookCount === 1 ? "" : "s"} · drop books here
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCopyShareLink(collection.id)
                    }}
                    className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10"
                    title="Copy share link"
                    aria-label="Share collection"
                  >
                    <i className="fas fa-share-nodes text-xs" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {sharedCollections.length > 0 ? (
        <section className="rounded-[28px] border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(10,31,43,0.88),rgba(8,18,31,0.94))] p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-200/55">Shared with you</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Borrowed collections</h3>
            </div>
            <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100/85">
              {sharedCollections.length}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {sharedCollections.map((collection) => {
              const isSelected = selectedCollectionId === collection.id
              return (
                <button
                  key={collection.id}
                  type="button"
                  onClick={() => onSelectCollection(collection.id)}
                  className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                    isSelected
                      ? "border-cyan-300/60 bg-cyan-300/12 text-white shadow-[0_16px_30px_rgba(0,0,0,0.22)]"
                      : "border-white/8 bg-[#081019] text-slate-200 hover:border-cyan-300/25 hover:bg-cyan-300/[0.06]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{collection.name}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">
                        {collection.ownerUserName || collection.ownerEmail} · {collection.bookCount} book
                        {collection.bookCount === 1 ? "" : "s"}
                      </div>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] text-slate-200">
                      {collection.canEdit ? "Can edit" : "View only"}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      ) : null}
    </aside>
  )
}
