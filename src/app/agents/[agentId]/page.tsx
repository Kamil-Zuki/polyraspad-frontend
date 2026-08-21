"use client"

import { use, useEffect, useRef } from "react"
import { notFound, useSearchParams, useRouter } from "next/navigation"
import { useAgentWorkspace } from "@/lib/agent/use-agent-workspace"
import { AgentWorkspaceShell } from "@/components/agent-workspace/agent-workspace-shell"
import { PaywallGate } from "@/components/billing/paywall-gate"

interface AgentPageProps {
  params: Promise<{ agentId: string }>
}

export default function AgentPage({ params }: AgentPageProps) {
  const { agentId } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const handledStartRef = useRef(false)
  const workspace = useAgentWorkspace(agentId)

  const selectThread = workspace.selectThread
  const sendMessage = workspace.sendMessage
  const hasAgent = !!workspace.agent
  const hasProject = !!workspace.projectId
  const activeThreadId = workspace.activeThreadId

  useEffect(() => {
    if (!hasAgent || !hasProject) return

    const threadId = searchParams.get("thread")
    const startText = searchParams.get("start")

    if (threadId) {
      selectThread(threadId)
      router.replace(`/agents/${agentId}`)
      return
    }

    if (startText && !activeThreadId && !handledStartRef.current) {
      handledStartRef.current = true
      void sendMessage(startText)
      router.replace(`/agents/${agentId}`)
    }
  }, [searchParams, hasAgent, hasProject, activeThreadId, agentId, router, selectThread, sendMessage])

  if (!workspace.agent) {
    notFound()
    return null
  }

  if (!workspace.projectId) {
    return (
      <div className="flex h-[calc(100vh-16rem)] items-center justify-center text-gray-400">
        Select a project from the sidebar to chat with {workspace.agent.name}.
      </div>
    )
  }

  if (workspace.threadsError || workspace.messagesError) {
    return (
      <div className="flex h-[calc(100vh-16rem)] items-center justify-center text-red-400">
        Failed to load chat history. Try a new chat.
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl h-full flex flex-col overflow-hidden">
      <PaywallGate gate="canUseVoiceAgent" mode="replace">
        <AgentWorkspaceShell
          agent={workspace.agent}
          threads={workspace.threads}
          activeThreadId={workspace.activeThreadId}
          messages={workspace.messages}
          status={workspace.status}
          activeJob={workspace.activeJob}
          isLoading={workspace.isLoading}
          onSend={workspace.sendMessage}
          onConfirm={workspace.confirmRun}
          onCancel={workspace.cancelRun}
          onStartNewThread={workspace.startNewThread}
          onSelectThread={workspace.selectThread}
          onDeleteThread={workspace.deleteThread}
        />
      </PaywallGate>
    </div>
  )
}
