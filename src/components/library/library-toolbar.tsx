"use client"

import { Search, LayoutGrid, List, SortAsc, FilePlus, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

export type LibrarySortKey = "recent" | "added" | "title"

interface LibraryToolbarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  sort: LibrarySortKey
  onSortChange: (value: LibrarySortKey) => void
  viewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
  isBusy: boolean
  isUploading: boolean
  onUploadClick: () => void
  onOpenTextWorkspace: () => void
  resultCount: number
  totalCount: number
}

const sortLabels: Record<LibrarySortKey, string> = {
  recent: "Recently opened",
  added: "Recently added",
  title: "Title",
}

export function LibraryToolbar({
  searchQuery,
  onSearchChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  isBusy,
  isUploading,
  onUploadClick,
  onOpenTextWorkspace,
  resultCount,
  totalCount,
}: LibraryToolbarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between md:p-5">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title or filename..."
            className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-brand-primary/50 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <SortAsc className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as LibrarySortKey)}
              className="h-10 appearance-none rounded-xl border border-white/10 bg-black/20 pl-9 pr-8 text-sm text-white focus:border-brand-primary/50 focus:outline-none"
            >
              <option value="recent">{sortLabels.recent}</option>
              <option value="added">{sortLabels.added}</option>
              <option value="title">{sortLabels.title}</option>
            </select>
          </div>

          <div className="flex items-center rounded-xl border border-white/10 bg-black/20 p-1">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              title="Grid view"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition",
                viewMode === "grid"
                  ? "bg-brand-primary/20 text-brand-primary"
                  : "text-gray-400 hover:text-white",
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              title="List view"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition",
                viewMode === "list"
                  ? "bg-brand-primary/20 text-brand-primary"
                  : "text-gray-400 hover:text-white",
              )}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="hidden text-xs text-gray-500 md:inline">
          {searchQuery.trim() ? `${resultCount} of ${totalCount} books` : `${totalCount} books`}
        </span>
        <button
          type="button"
          onClick={onUploadClick}
          disabled={isBusy}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary/90 disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <i className="fas fa-spinner fa-spin text-xs" />
              Importing…
            </>
          ) : (
            <>
              <FilePlus className="h-4 w-4" />
              Import book
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onOpenTextWorkspace}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
        >
          <FileText className="h-4 w-4" />
          Text workspace
        </button>
      </div>
    </div>
  )
}
