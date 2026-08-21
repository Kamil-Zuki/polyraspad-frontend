"use client"

import { useEffect, useState } from "react"
import { useProjectContext } from "@/contexts/project-context"
import { useAgentWorkspace } from "@/lib/agent/use-agent-workspace"
import { AgentWorkspaceShell } from "@/components/agent-workspace/agent-workspace-shell"
import { BrainCircuit, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"

import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function PlacementTestPage() {
  const { currentProject } = useProjectContext()
  const workspace = useAgentWorkspace("placement-copilot")
  const [threadInitialized, setThreadInitialized] = useState(false)
  const queryClient = useQueryClient()
  const router = useRouter()
  
  const createThreadMutation = useMutation({
    mutationFn: (projectId: string) => 
      apiClient.agent.createThread({
        projectId,
        agentId: "placement-copilot"
      }),
    onSuccess: (thread) => {
      workspace.selectThread(thread.id)
      setThreadInitialized(true)
    }
  })

  const [greetingTriggered, setGreetingTriggered] = useState(false)

  useEffect(() => {
    if (threadInitialized && !workspace.isLoading && workspace.messages.length === 0 && !greetingTriggered) {
      setGreetingTriggered(true)
      workspace.triggerProactiveGreeting()
    }
  }, [threadInitialized, workspace.isLoading, workspace.messages.length, greetingTriggered, workspace])

  useEffect(() => {
    // Check if the agent successfully set the CEFR level
    const hasSuccess = workspace.messages.some(msg => 
      msg.toolCalls?.some(tc => tc.name === "set_cefr_placement" && tc.status === "success")
    )

    if (hasSuccess) {
      toast.success("Ваш уровень определен! Уроки разблокированы.")
      queryClient.invalidateQueries({ queryKey: ["curriculum"] })
      router.push("/lessons")
    }
  }, [workspace.messages, queryClient, router])

  useEffect(() => {
    if (!currentProject || threadInitialized || createThreadMutation.isPending || createThreadMutation.isSuccess) return
    createThreadMutation.mutate(currentProject.id)
  }, [currentProject, threadInitialized, createThreadMutation])

  if (!currentProject) {
    return <div className="p-8 text-center text-gray-400">Please select a project first.</div>
  }

  return (
    <div className="flex flex-col h-full bg-app-background relative">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5 bg-app-surface/50 backdrop-blur-md z-10 shrink-0">
        <Link 
          href="/lessons"
          className="p-2 hover:bg-white/5 rounded-full transition-colors group"
        >
          <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-white" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <BrainCircuit className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">AI Placement Test</h1>
            <p className="text-sm text-purple-400">Find your perfect starting point</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 relative">
        {createThreadMutation.isPending && !threadInitialized ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-gray-400 text-sm animate-pulse">Initializing your diagnostic test...</p>
          </div>
        ) : (
          <AgentWorkspaceShell
            agent={workspace.agent!}
            threads={[]} 
            activeThreadId={workspace.activeThreadId}
            messages={workspace.messages}
            status={workspace.status}
            activeJob={null}
            isLoading={workspace.isLoading}
            onSend={workspace.sendMessage}
            onConfirm={workspace.confirmRun}
            onCancel={workspace.cancelRun}
            onStartNewThread={() => {}}
            onSelectThread={() => {}}
            lessonThreadId={workspace.activeThreadId}
          />
        )}
      </div>
    </div>
  )
}
