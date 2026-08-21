"use client"

import { ArrowRight, BookMarked, BookOpen, ExternalLink, Layers, Mic, Pencil } from "lucide-react"
import type { AgentActionCard } from "@/lib/agent/agent-message"

interface AgentActionCardViewProps {
  action: AgentActionCard
  onAction: (action: AgentActionCard) => void
}

function actionIcon(action: AgentActionCard) {
  if (action.kind === "open_editor_draft") return Pencil
  if (action.kind === "start_study") return Layers
  if (action.href.startsWith("/reader")) return BookOpen
  if (action.href.startsWith("/library")) return BookMarked
  if (action.href.startsWith("/shadowing")) return Mic
  if (action.href.startsWith("/vocabulary")) return BookOpen
  return ExternalLink
}

export function AgentActionCardView({ action, onAction }: AgentActionCardViewProps) {
  const Icon = actionIcon(action)

  return (
    <button
      type="button"
      onClick={() => onAction(action)}
      className="w-full text-left rounded-xl border border-white/10 bg-app-bg/70 hover:border-brand-primary/30 hover:bg-brand-primary/5 transition p-3 group"
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-brand-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white group-hover:text-brand-primary transition-colors">
            {action.title}
          </div>
          {action.description && (
            <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
          )}
          <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-primary">
            {action.label}
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </div>
    </button>
  )
}
