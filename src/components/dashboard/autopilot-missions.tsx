"use client"

import { useProjectContext } from "@/contexts/project-context"
import { useAutopilotPlan } from "@/hooks/use-autopilot"
import { Loader2, Rocket, PlayCircle, BookOpen, Mic } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function AutopilotMissionsCard() {
  const { currentProject } = useProjectContext()
  const projectId = currentProject?.id || null

  const { data: plan, isLoading } = useAutopilotPlan(projectId)

  if (!projectId) return null

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "reading":
        return <BookOpen className="w-5 h-5 text-blue-400" />
      case "fsrs":
        return <PlayCircle className="w-5 h-5 text-green-400" />
      case "knowledge_check":
        return <Mic className="w-5 h-5 text-purple-400" />
      default:
        return <Rocket className="w-5 h-5 text-gray-400" />
    }
  }

  const getTaskColor = (type: string) => {
    switch (type) {
      case "reading":
        return "border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-500/40"
      case "fsrs":
        return "border-green-500/20 bg-green-500/10 hover:bg-green-500/20 hover:border-green-500/40"
      case "knowledge_check":
        return "border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 hover:border-purple-500/40"
      default:
        return "border-gray-500/20 bg-gray-500/10 hover:bg-gray-500/20"
    }
  }

  return (
    <div className="glass-panel border-brand-primary/20 p-6 md:p-8 relative overflow-hidden flex flex-col group rounded-3xl">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Rocket className="w-32 h-32 text-brand-primary transform rotate-45 group-hover:scale-110 transition-transform duration-1000" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30">
            <Rocket className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Daily Missions</h2>
            <p className="text-sm text-gray-400">Your AI-generated learning plan for today</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          </div>
        ) : !plan?.tasks || plan.tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No missions for today! You are all caught up.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {plan.tasks.map((task, i) => (
              <Link
                key={i}
                href={task.actionUrl}
                className={cn(
                  "flex flex-col p-5 rounded-2xl border transition-all duration-300",
                  getTaskColor(task.taskType),
                  task.isCompleted && "opacity-50 grayscale pointer-events-none"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl bg-black/20">
                    {getTaskIcon(task.taskType)}
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/30 text-white border border-white/10">
                    {task.durationMinutes} min
                  </span>
                </div>
                <h3 className="font-bold text-white mb-1 line-clamp-1">{task.title}</h3>
                <p className="text-xs text-gray-400 line-clamp-2 mt-auto">{task.description}</p>
                
                {task.isCompleted && (
                  <div className="mt-4 flex items-center justify-center text-xs font-bold text-green-400 bg-green-400/10 py-1.5 rounded-lg">
                    <i className="fas fa-check-circle mr-1.5"></i> Completed
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
