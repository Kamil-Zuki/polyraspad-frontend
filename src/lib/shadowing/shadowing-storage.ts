"use client"

/**
 * Local persistence for shadowing attempts.
 *
 * NOTE: This is a frontend-only MVP store. Once the backend contract
 * (POST /api/Cards/{cardId}/shadowing-attempts) is implemented, swap this
 * for apiClient.shadowing.saveAttempt() calls.
 */

export interface ShadowingAttempt {
  id: string
  cardId?: string | null
  sentence: string
  sourceType?: "card" | "book" | "reader" | null
  sourceId?: string | null
  sourceTitle?: string | null
  rating: 1 | 2 | 3
  /** ISO timestamp */
  createdAt: string
}

const STORAGE_KEY = "polyraspad-shadowing-attempts"
const MAX_ATTEMPTS = 500

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function readAttempts(): ShadowingAttempt[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is ShadowingAttempt =>
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.sentence === "string" &&
        (item.rating === 1 || item.rating === 2 || item.rating === 3) &&
        typeof item.createdAt === "string"
    )
  } catch {
    return []
  }
}

function writeAttempts(attempts: ShadowingAttempt[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts))
  } catch {
    /* ignore quota/storage errors */
  }
}

export function saveShadowingAttempt(
  attempt: Omit<ShadowingAttempt, "id" | "createdAt">
): ShadowingAttempt {
  const attempts = readAttempts()
  const entry: ShadowingAttempt = {
    ...attempt,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  const next = [entry, ...attempts].slice(0, MAX_ATTEMPTS)
  writeAttempts(next)
  return entry
}

export function getShadowingAttempts(filter?: {
  cardId?: string
  sentence?: string
}): ShadowingAttempt[] {
  let attempts = readAttempts()
  if (filter?.cardId) {
    attempts = attempts.filter((a) => a.cardId === filter.cardId)
  }
  if (filter?.sentence) {
    attempts = attempts.filter((a) => a.sentence === filter.sentence)
  }
  return attempts.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function deleteShadowingAttempt(id: string): boolean {
  const attempts = readAttempts()
  const next = attempts.filter((a) => a.id !== id)
  if (next.length === attempts.length) return false
  writeAttempts(next)
  return true
}
