"use client"

import { type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Lock, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEntitlements } from "@/contexts/entitlement-context"

// ─── Types ───────────────────────────────────────────────────────────

type GateMode =
  /** Render children with a blurred overlay + lock badge + upgrade CTA. */
  | "overlay"
  /** Render `fallback` instead of children. */
  | "replace"
  /** Render nothing. */
  | "hidden"
  /** Render children but visually disable (pointer-events: none, opacity). */
  | "disabled"

interface PaywallGateProps {
  /**
   * Plan code required to unlock this gate (e.g. "pro").
   * If the user's planCode matches or exceeds, children are rendered normally.
   */
  requires?: string
  /**
   * Boolean feature gate key from entitlements (e.g. "canUseGrammarTutor").
   * Checked only when `requires` is not provided or also matched.
   */
  gate?: "canUseGrammarTutor" | "canUseAutoMine" | "canUseVoiceAgent" | "canUseSpeaking"
  /** How to handle blocked access. Default: "overlay". */
  mode?: GateMode
  /** Fallback node for "replace" mode. */
  fallback?: ReactNode
  /** Override the upgrade message shown in overlay/disabled modes. */
  upgradeMessage?: string
  /** Additional CSS class for the wrapper. */
  className?: string
  children: ReactNode
}

// ─── Plan hierarchy (for `requires` comparison) ──────────────────────

const PLAN_RANK: Record<string, number> = {
  free: 0,
  pro: 1,
  ultimate: 2,
}

function hasPlanAccess(userPlan: string, requiredPlan: string): boolean {
  const userRank = PLAN_RANK[userPlan] ?? 0
  const requiredRank = PLAN_RANK[requiredPlan] ?? 1
  return userRank >= requiredRank
}

// ─── Component ───────────────────────────────────────────────────────

export function PaywallGate({
  requires,
  gate,
  mode = "overlay",
  fallback,
  upgradeMessage,
  className,
  children,
}: PaywallGateProps) {
  const { planCode, isGateEnabled, isLoading } = useEntitlements()
  const router = useRouter()

  // While loading, render children in a skeleton-like state to avoid layout shift
  if (isLoading) {
    return <div className={cn("animate-pulse opacity-50", className)}>{children}</div>
  }

  // Determine access
  const planAllowed = requires ? hasPlanAccess(planCode, requires) : true
  const gateAllowed = gate ? isGateEnabled(gate) : true
  const hasAccess = planAllowed && gateAllowed

  if (hasAccess) {
    return <>{children}</>
  }

  // ── Blocked states ──

  const message = upgradeMessage ?? `Upgrade to ${requires ?? "Pro"} to unlock this feature`

  switch (mode) {
    case "hidden":
      return null

    case "replace":
      return <>{fallback ?? <DefaultUpgradeCTA message={message} />}</>

    case "disabled":
      return (
        <div
          className={cn("relative group", className)}
          title={message}
        >
          <div className="pointer-events-none opacity-40 select-none">
            {children}
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="flex items-center gap-1.5 rounded-full bg-violet-500/90 px-3 py-1 text-xs font-medium text-white shadow-lg backdrop-blur-sm">
              <Lock className="h-3 w-3" />
              Pro
            </span>
          </div>
        </div>
      )

    case "overlay":
    default:
      return (
        <div className={cn("relative overflow-hidden rounded-lg", className)}>
          {/* Blurred preview of the gated content */}
          <div className="pointer-events-none select-none blur-[2px] opacity-60" aria-hidden>
            {children}
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-[1px] rounded-lg">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/30">
              <Lock className="h-5 w-5 text-violet-400" />
            </div>
            <p className="text-sm text-gray-300 text-center max-w-[240px] leading-snug">
              {message}
            </p>
            <button
              type="button"
              onClick={() => router.push("/billing")}
              className="flex items-center gap-1.5 rounded-full bg-violet-600 hover:bg-violet-500 px-4 py-1.5 text-xs font-medium text-white transition-colors shadow-md"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Upgrade
            </button>
          </div>
        </div>
      )
  }
}

// ─── Default fallback for "replace" mode ─────────────────────────────

function DefaultUpgradeCTA({ message }: { message: string }) {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-white/10 bg-app-surface p-6 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-violet-500/15 border border-violet-500/25">
        <Lock className="h-6 w-6 text-violet-400" />
      </div>
      <p className="text-sm text-gray-400 max-w-[280px]">{message}</p>
      <button
        type="button"
        onClick={() => router.push("/billing")}
        className="flex items-center gap-1.5 rounded-full bg-violet-600 hover:bg-violet-500 px-5 py-2 text-sm font-medium text-white transition-colors"
      >
        <Sparkles className="h-4 w-4" />
        Перейти на Pro
      </button>
    </div>
  )
}
