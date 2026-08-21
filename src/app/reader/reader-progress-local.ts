import { readerProgressLocalKey } from "@/app/reader/reader-constants"

export function getLocalLastReadPage(bookId: string): number | undefined {
  if (typeof window === "undefined") return undefined
  const raw = localStorage.getItem(readerProgressLocalKey(bookId))
  if (!raw) return undefined
  const page = Number.parseInt(raw, 10)
  return Number.isFinite(page) && page >= 1 ? page : undefined
}

export function setLocalLastReadPage(bookId: string, page: number): void {
  if (typeof window === "undefined") return
  localStorage.setItem(readerProgressLocalKey(bookId), String(Math.max(1, page)))
}

/** Prefer the furthest saved position from API metadata or local fallback. */
export function resolveResumePage(
  book: { id: string; lastReadPage?: number },
  maxPage: number,
): number {
  const local = getLocalLastReadPage(book.id) ?? 0
  const remote = book.lastReadPage ?? 0
  const saved = Math.max(remote, local, 1)
  return Math.min(saved, Math.max(maxPage, 1))
}
