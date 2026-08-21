"use client"

import { ExternalLink } from "lucide-react"
import { AgentActionCardView } from "@/components/dashboard/agent-chat/agent-action-card"
import type { AgentActionCard } from "@/lib/agent/agent-message"

interface AgentResultCardProps {
  actions: AgentActionCard[]
  onAction: (action: AgentActionCard) => void
}

export function AgentResultCard({ actions, onAction }: AgentResultCardProps) {
  return (
    <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
        <ExternalLink className="h-4 w-4" />
        Actions
      </div>
      <div className="space-y-2">
        {actions.map((action) => (
          <AgentActionCardView key={action.id} action={action} onAction={onAction} />
        ))}
      </div>
    </div>
  )
}
