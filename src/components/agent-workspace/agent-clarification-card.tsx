"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import type { AgentClarificationMetadata } from "@/lib/agent/agent-message"

interface AgentClarificationCardProps {
  clarification: AgentClarificationMetadata
  onConfirm: (parameters: Record<string, unknown>) => void
  onCancel?: () => void
}

export function AgentClarificationCard({
  clarification,
  onConfirm,
  onCancel,
}: AgentClarificationCardProps) {
  const initialThreshold =
    typeof clarification.parameters.threshold === "number"
      ? clarification.parameters.threshold
      : 8
  const initialIncludeMissingMedia =
    typeof clarification.parameters.includeMissingMedia === "boolean"
      ? clarification.parameters.includeMissingMedia
      : true

  const [threshold, setThreshold] = useState(initialThreshold)
  const [includeMissingMedia, setIncludeMissingMedia] = useState(initialIncludeMissingMedia)

  return (
    <div className="mt-3 rounded-xl border border-brand-primary/30 bg-brand-primary/10 p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Leech threshold (lapses)
          </span>
          <input
            type="number"
            min={1}
            value={threshold}
            onChange={(e) => setThreshold(Math.max(1, Number(e.target.value)))}
            className="w-full bg-app-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary"
          />
        </label>
        <label className="flex items-center gap-3 text-sm text-gray-300 select-none sm:pt-5">
          <input
            type="checkbox"
            checked={includeMissingMedia}
            onChange={(e) => setIncludeMissingMedia(e.target.checked)}
            className="h-4 w-4 rounded border-white/10 bg-app-bg text-brand-primary"
          />
          Include missing media
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onConfirm({ threshold, includeMissingMedia })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-white hover:brightness-110 transition"
        >
          <Check className="h-4 w-4" />
          Run
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-gray-300 hover:bg-white/5 transition"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
