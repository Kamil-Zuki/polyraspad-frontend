"use client"

import { useState } from "react"
import { CheckCircle2, ChevronDown, ChevronRight, Loader2, XCircle } from "lucide-react"
import type { AutomationJobDto } from "@/lib/api/types"
import type { AgentExecutionMetadata } from "@/lib/agent/agent-message"
import { cn } from "@/lib/utils"

interface AgentExecutionCardProps {
  job?: AutomationJobDto | null
  execution?: AgentExecutionMetadata
}

export function AgentExecutionCard({ job, execution }: AgentExecutionCardProps) {
  const [expanded, setExpanded] = useState(false)

  const status = job?.status ?? execution?.status ?? "RUNNING"
  const progress = job?.progressPercent ?? execution?.progressPercent ?? 0
  const logs = job?.logs ?? execution?.logs ?? []
  const isRunning = status === "RUNNING" || status === "QUEUED"
  const isCompleted = status === "COMPLETED"
  const isFailed = status === "FAILED"

  return (
    <div className="mt-3 rounded-xl border border-app-border bg-app-surface p-4 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          {isRunning && <Loader2 className="h-4 w-4 text-brand-primary animate-spin" />}
          {isCompleted && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          {isFailed && <XCircle className="h-4 w-4 text-red-400" />}
          <span className={cn("font-medium", isFailed ? "text-red-200" : "text-white")}>
            {isRunning ? "Cooking" : isCompleted ? "Done" : "Failed"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition"
        >
          {logs.length} steps
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500",
              isFailed ? "bg-red-500" : isCompleted ? "bg-emerald-500" : "bg-brand-primary",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {expanded && logs.length > 0 && (
        <div className="rounded-lg border border-white/5 bg-app-bg p-3 space-y-1 max-h-60 overflow-y-auto custom-scroll">
          {logs.map((log, index) => (
            <p key={index} className="text-xs text-gray-300 font-mono">
              {log}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
