"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import { useBillingAccess, useBillingEntitlements } from "@/lib/react-query/billing-queries"

// ─── Entitlement keys ────────────────────────────────────────────────
// Keep in sync with BillingService seed data (SaaSPlan.Entitlements).
// Quota keys hold numeric limits; gate keys hold boolean toggles.

/** Numeric entitlement keys with their default (free-tier) fallback values. */
const QUOTA_DEFAULTS = {
  maxProjects: 3,
  maxCards: 500,
  aiRequestsPerDay: 10,
  textWorkspaceMaxBooks: 3,
} as const satisfies Record<string, number>

/** Boolean feature-gate keys. */
const GATE_KEYS = [
  "canUseGrammarTutor",
  "canUseAutoMine",
  "canUseVoiceAgent",
  "canUseSpeaking",
] as const

type QuotaKey = keyof typeof QUOTA_DEFAULTS
type GateKey = (typeof GATE_KEYS)[number]

// ─── Context shape ───────────────────────────────────────────────────

export interface EntitlementContextType {
  /** Current billing plan code, e.g. "free" | "pro". */
  planCode: string
  /** True while access / entitlements data is being fetched. */
  isLoading: boolean
  /** Convenience: planCode !== "free". */
  isPro: boolean

  // Quotas (numeric limits)
  maxProjects: number
  maxCards: number
  aiRequestsPerDay: number
  /** -1 means unlimited. */
  textWorkspaceMaxBooks: number

  // Feature gates (boolean)
  canUseGrammarTutor: boolean
  canUseAutoMine: boolean
  canUseVoiceAgent: boolean
  canUseSpeaking: boolean

  /** Generic helper: check if a quota key allows more usage. */
  hasQuota: (key: QuotaKey, currentUsage: number) => boolean
  /** Generic helper: is the given gate enabled? */
  isGateEnabled: (key: GateKey) => boolean
}

const EntitlementContext = createContext<EntitlementContextType | undefined>(undefined)

// ─── Helpers ─────────────────────────────────────────────────────────

function parseIntSafe(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback
  const parsed = parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

function parseBool(value: string | undefined): boolean {
  return value?.toLowerCase() === "true"
}

// ─── Provider ────────────────────────────────────────────────────────

export function EntitlementProvider({ children }: { children: ReactNode }) {
  const { data: access, isLoading: accessLoading } = useBillingAccess()
  const { data: entitlements, isLoading: entitlementsLoading } = useBillingEntitlements()

  const value = useMemo<EntitlementContextType>(() => {
    const ent = entitlements?.entitlements ?? {}
    const planCode = access?.planCode ?? "free"

    // Parse quotas
    const maxProjects = parseIntSafe(ent.maxProjects, QUOTA_DEFAULTS.maxProjects)
    const maxCards = parseIntSafe(ent.maxCards, QUOTA_DEFAULTS.maxCards)
    const aiRequestsPerDay = parseIntSafe(ent.aiRequestsPerDay, QUOTA_DEFAULTS.aiRequestsPerDay)
    const textWorkspaceMaxBooks = parseIntSafe(ent.textWorkspaceMaxBooks, QUOTA_DEFAULTS.textWorkspaceMaxBooks)

    // Parse gates
    const canUseGrammarTutor = parseBool(ent.canUseGrammarTutor)
    const canUseAutoMine = parseBool(ent.canUseAutoMine)
    const canUseVoiceAgent = parseBool(ent.canUseVoiceAgent)
    const canUseSpeaking = parseBool(ent.canUseSpeaking)

    const quotaMap: Record<QuotaKey, number> = {
      maxProjects,
      maxCards,
      aiRequestsPerDay,
      textWorkspaceMaxBooks,
    }

    const gateMap: Record<GateKey, boolean> = {
      canUseGrammarTutor,
      canUseAutoMine,
      canUseVoiceAgent,
      canUseSpeaking,
    }

    return {
      planCode,
      isLoading: accessLoading || entitlementsLoading,
      isPro: planCode !== "free",
      maxProjects,
      maxCards,
      aiRequestsPerDay,
      textWorkspaceMaxBooks,
      canUseGrammarTutor,
      canUseAutoMine,
      canUseVoiceAgent,
      canUseSpeaking,
      hasQuota: (key: QuotaKey, currentUsage: number) => {
        const limit = quotaMap[key]
        if (limit === -1) return true // unlimited
        return currentUsage < limit
      },
      isGateEnabled: (key: GateKey) => gateMap[key],
    }
  }, [access, entitlements, accessLoading, entitlementsLoading])

  return (
    <EntitlementContext.Provider value={value}>
      {children}
    </EntitlementContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useEntitlements() {
  const context = useContext(EntitlementContext)
  if (context === undefined) {
    throw new Error("useEntitlements must be used within an EntitlementProvider")
  }
  return context
}
