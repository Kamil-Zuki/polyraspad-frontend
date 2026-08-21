"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useProjectContext } from "@/contexts/project-context"
import {
  useAgentMessages,
  useAgentThreads,
  useCreateAgentRun,
  useCreateAgentThread,
  usePersistAgentRun,
  useArchiveAgentThread,
} from "@/lib/react-query/agent-queries"
import {
  useCreateAutomationJob,
  useAutomationJob,
} from "@/lib/react-query/automation-queries"
import {
  agentMessageFromDto,
  createAgentMessage,
  toAgentMessageInput,
  type AgentMessage,
} from "@/lib/agent/agent-message"
import {
  getAgentById,
  isAgentCancellation,
  isAgentConfirmation,
  isAgentJobRequest,
  resolveAgentResultActions,
  type AgentDefinition,
} from "@/lib/agent/agent-catalog"
import type {
  AgentDomainDecisionDto,
  AgentToolCallDto,
  CreateAgentRunRequestDto,
} from "@/lib/api/types"

export type AgentWorkspaceStatus =
  | "idle"
  | "confirming"
  | "running"
  | "completed"
  | "failed"

export interface CardJanitorPayload {
  threshold: number
  includeMissingMedia: boolean
}

function extractCardJanitorPayload(
  text: string,
  defaults: CardJanitorPayload,
): CardJanitorPayload {
  const thresholdMatch =
    text.match(/(?:threshold|порог|lapses?)\s*(?:=|:)?\s*(\d+)/i) ||
    text.match(/(\d+)\s*(?:threshold|порог|lapses?)/i)

  const threshold = thresholdMatch
    ? Math.max(1, parseInt(thresholdMatch[1], 10))
    : defaults.threshold

  const skipMedia = /(skip|no|without|без)\s+(?:missing\s+)?media/i.test(text)
  const includeMedia = /(include|with|missing\s+media|медиа)/i.test(text)

  let includeMissingMedia = defaults.includeMissingMedia
  if (skipMedia) includeMissingMedia = false
  if (includeMedia) includeMissingMedia = true

  return { threshold, includeMissingMedia }
}

function formatConfirmText(payload: CardJanitorPayload): string {
  return `I'll run Card Janitor with leech threshold ${payload.threshold} and ${
    payload.includeMissingMedia ? "include" : "skip"
  } missing media. Ready to start?`
}

function formatSummaryText(
  result: Record<string, unknown> | null,
  payload: CardJanitorPayload,
): string {
  if (!result) return "Card Janitor finished."
  const leechCount = typeof result.leechCount === "number" ? result.leechCount : 0
  const missingMediaCount =
    typeof result.missingMediaCount === "number" ? result.missingMediaCount : 0
  const duplicateCount =
    typeof result.duplicateCount === "number" ? result.duplicateCount : 0
  const emptyNoteCount =
    typeof result.emptyNoteCount === "number" ? result.emptyNoteCount : 0

  const lines = [
    "Done. Here's what Card Janitor found:",
    `• ${leechCount} leech card(s) (threshold ≥ ${payload.threshold})`,
  ]
  if (payload.includeMissingMedia) {
    lines.push(`• ${missingMediaCount} card(s) missing media`)
  }
  lines.push(`• ${duplicateCount} duplicate(s)`, `• ${emptyNoteCount} empty note(s)`)
  return lines.join("\n")
}

function buildDomainDecision(): AgentDomainDecisionDto {
  return {
    allowed: true,
    category: "automation",
    reason: "open_agent_automation",
  }
}

function buildPersistRequest(
  projectId: string,
  userMessage: AgentMessage,
  assistantMessage: AgentMessage,
  toolCalls: AgentToolCallDto[] = [],
): CreateAgentRunRequestDto {
  return {
    projectId,
    userMessage: toAgentMessageInput(userMessage),
    assistantMessage: toAgentMessageInput(assistantMessage),
    domainDecision: buildDomainDecision(),
    toolCalls,
    model: null,
  }
}

export function useAgentWorkspace(agentId: string) {
  const agent = useMemo(() => getAgentById(agentId), [agentId])
  const { currentProject } = useProjectContext()
  const projectId = currentProject?.id ?? ""

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [status, setStatus] = useState<AgentWorkspaceStatus>("idle")
  const [pendingPayload, setPendingPayload] = useState<CardJanitorPayload | null>(null)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [optimisticMessage, setOptimisticMessage] = useState<AgentMessage | null>(null)
  const [localErrorMessages, setLocalErrorMessages] = useState<AgentMessage[]>([])
  const finalizedJobIdsRef = useRef<Set<string>>(new Set())
  const isSendingRef = useRef(false)

  const {
    data: threads,
    isLoading: threadsLoading,
    isError: threadsError,
  } = useAgentThreads(projectId, { enabled: !!projectId && !!agent, agentId: agent?.id })

  const {
    data: messageList,
    isLoading: messagesLoading,
    isError: messagesError,
  } = useAgentMessages(activeThreadId)

  const serverMessages = useMemo(() => {
    if (!messageList) return []
    return messageList.items.map(agentMessageFromDto)
  }, [messageList])

  const messages = useMemo(() => {
    if (optimisticMessage) return [...serverMessages, optimisticMessage]
    if (serverMessages.length > 0) return serverMessages
    return localErrorMessages
  }, [serverMessages, optimisticMessage, localErrorMessages])

  const createThreadMutation = useCreateAgentThread()
  const createRunMutation = useCreateAgentRun()
  const persistRunMutation = usePersistAgentRun()
  const createJobMutation = useCreateAutomationJob()
  const archiveThreadMutation = useArchiveAgentThread()
  const { data: activeJob } = useAutomationJob(activeJobId ?? undefined)

  const isLoading =
    threadsLoading ||
    messagesLoading ||
    createThreadMutation.isPending ||
    createRunMutation.isPending ||
    persistRunMutation.isPending ||
    createJobMutation.isPending ||
    isSendingRef.current

  useEffect(() => {
    if (!activeJobId || !activeJob || status !== "running") return

    if (activeJob.status === "COMPLETED" && !finalizedJobIdsRef.current.has(activeJobId)) {
      finalizedJobIdsRef.current.add(activeJobId)
      void persistFinalResult(activeJobId, activeJob.result ?? null, false)
    }

    if (activeJob.status === "FAILED" && !finalizedJobIdsRef.current.has(activeJobId)) {
      finalizedJobIdsRef.current.add(activeJobId)
      void persistFinalResult(activeJobId, null, true, activeJob.lastError)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJob, activeJobId, status])

  async function persistFinalResult(
    jobId: string,
    result: Record<string, unknown> | null,
    failed: boolean,
    lastError?: string | null,
  ) {
    if (!projectId || !agent || !activeThreadId) return

    try {
      const fallbackPayload = agent.defaultPayload as unknown as CardJanitorPayload
      const payload = pendingPayload ?? fallbackPayload

      const systemMessage = createAgentMessage(
        "system",
        `[${agent.id}] job ${jobId} ${failed ? "failed" : "completed"}`,
      )
      const assistantContent = failed
        ? `Card Janitor failed${lastError ? `: ${lastError}` : "."}`
        : formatSummaryText(result, payload)

      const assistantMessage = createAgentMessage("assistant", assistantContent, {
        isError: failed,
        result: failed
          ? undefined
          : {
              agentId: agent.id,
              jobId,
              result,
            },
        actions: failed ? undefined : resolveAgentResultActions(agent, result),
      })

      const toolCall: AgentToolCallDto = {
        toolName: agent.jobType,
        inputJson: JSON.stringify(payload),
        outputJson: failed
          ? JSON.stringify({ error: lastError ?? "unknown" })
          : JSON.stringify(result ?? {}),
        status: failed ? "failed" : "completed",
      }

      await persistRunMutation.mutateAsync({
        threadId: activeThreadId,
        request: buildPersistRequest(projectId, systemMessage, assistantMessage, [toolCall]),
      })

      setStatus(failed ? "failed" : "completed")
    } catch {
      setStatus("failed")
    }
  }

  const resolveThreadId = useCallback(async (): Promise<string | null> => {
    if (activeThreadId) return activeThreadId
    if (!projectId || !agent) return null
    const thread = await createThreadMutation.mutateAsync({
      projectId,
      agentId: agent.id,
    })
    setActiveThreadId(thread.id)
    return thread.id
  }, [activeThreadId, projectId, agent, createThreadMutation])

  const persistConfirmation = useCallback(
    async (text: string, threadId?: string) => {
      if (!projectId || !agent) return

      const payload = extractCardJanitorPayload(
        text,
        agent.defaultPayload as unknown as CardJanitorPayload,
      )

      const userMessage = createAgentMessage("user", text)
      const assistantMessage = createAgentMessage(
        "assistant",
        formatConfirmText(payload),
        {
          clarification: {
            agentId: agent.id,
            type: "confirm",
            parameters: payload as unknown as Record<string, unknown>,
          },
        },
      )

      const activeThreadId = threadId ?? (await resolveThreadId())
      if (!activeThreadId) throw new Error("No thread")

      await persistRunMutation.mutateAsync({
        threadId: activeThreadId,
        request: buildPersistRequest(projectId, userMessage, assistantMessage),
      })

      setPendingPayload(payload)
      setStatus("confirming")
      setActiveThreadId(activeThreadId)
    },
    [projectId, agent, resolveThreadId, persistRunMutation],
  )

  const sendChatMessage = useCallback(
    async (text: string, threadId?: string, isInitialGreeting?: boolean) => {
      if (!projectId || !agent) return

      const activeThreadId = threadId ?? (await resolveThreadId())
      if (!activeThreadId) throw new Error("No thread")

      await createRunMutation.mutateAsync({
        threadId: activeThreadId,
        request: {
          projectId,
          userText: text,
          ...(isInitialGreeting ? { isInitialGreeting: true } : {}),
        },
      })

      setStatus("idle")
      setActiveThreadId(activeThreadId)
    },
    [projectId, agent, resolveThreadId, createRunMutation],
  )

  const confirmRun = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!projectId || !agent || !activeThreadId) return

      const cardPayload: CardJanitorPayload = {
        threshold:
          typeof payload.threshold === "number"
            ? payload.threshold
            : ((agent.defaultPayload.threshold as number) ?? 8),
        includeMissingMedia:
          typeof payload.includeMissingMedia === "boolean"
            ? payload.includeMissingMedia
            : ((agent.defaultPayload.includeMissingMedia as boolean) ?? true),
      }

      setPendingPayload(cardPayload)
      setStatus("running")

      try {
        const job = await createJobMutation.mutateAsync({
          type: agent.jobType,
          projectId,
          payload: cardPayload as unknown as Record<string, unknown>,
        })

        setActiveJobId(job.id)

        const userMessage = createAgentMessage("user", "Run the cleanup")
        const assistantMessage = createAgentMessage("assistant", "Starting Card Janitor…", {
          execution: {
            agentId: agent.id,
            jobId: job.id,
            status: job.status,
            progressPercent: job.progressPercent,
            logs: job.logs ?? [],
          },
        })

        await persistRunMutation.mutateAsync({
          threadId: activeThreadId,
          request: buildPersistRequest(projectId, userMessage, assistantMessage, [
            {
              toolName: agent.jobType,
              inputJson: JSON.stringify(cardPayload),
              outputJson: JSON.stringify({ jobId: job.id }),
              status: "completed",
            },
          ]),
        })
      } catch {
        setStatus("failed")
      }
    },
    [projectId, agent, activeThreadId, createJobMutation, persistRunMutation],
  )

  const cancelRun = useCallback(() => {
    setStatus("idle")
    setPendingPayload(null)
    setActiveJobId(null)
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || !projectId || !agent || isSendingRef.current) return

      isSendingRef.current = true
      const userMsg = createAgentMessage("user", trimmed)
      setOptimisticMessage(userMsg)
      setLocalErrorMessages([])

      try {
        if (status === "confirming") {
          if (isAgentConfirmation(trimmed)) {
            await confirmRun(
              (pendingPayload ?? agent.defaultPayload) as Record<string, unknown>,
            )
            return
          }

          if (isAgentCancellation(trimmed)) {
            cancelRun()
            return
          }

          if (isAgentJobRequest(trimmed, agent)) {
            await persistConfirmation(trimmed)
            return
          }

          await sendChatMessage(trimmed)
          return
        }

        if (isAgentJobRequest(trimmed, agent)) {
          await persistConfirmation(trimmed)
          return
        }

        await sendChatMessage(trimmed)
      } catch (err: unknown) {
        setStatus("failed")
        const errorMessageText = err instanceof Error ? err.message : "Failed to communicate with AI agent."
        setLocalErrorMessages([
          userMsg,
          createAgentMessage("assistant", `[System: Произошла ошибка при обращении к AI-агенту: ${errorMessageText}]`, { isError: true })
        ])
      } finally {
        setOptimisticMessage(null)
        isSendingRef.current = false
      }
    },
    [
      projectId,
      agent,
      status,
      pendingPayload,
      confirmRun,
      cancelRun,
      persistConfirmation,
      sendChatMessage,
    ],
  )

  const startNewThread = useCallback(async () => {
    if (!projectId || !agent) return
    const thread = await createThreadMutation.mutateAsync({
      projectId,
      agentId: agent.id,
    })
    setActiveThreadId(thread.id)
    setStatus("idle")
    setPendingPayload(null)
    setActiveJobId(null)
    setLocalErrorMessages([])
    finalizedJobIdsRef.current.clear()
  }, [projectId, agent, createThreadMutation])

  const selectThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId)
    setStatus("idle")
    setPendingPayload(null)
    setActiveJobId(null)
    setLocalErrorMessages([])
    finalizedJobIdsRef.current.clear()
  }, [])

  const deleteThread = useCallback(async (threadId: string) => {
    if (!projectId) return
    await archiveThreadMutation.mutateAsync({ threadId, projectId })
    if (activeThreadId === threadId) {
      setActiveThreadId(null)
      setStatus("idle")
      setPendingPayload(null)
      setActiveJobId(null)
      setLocalErrorMessages([])
      finalizedJobIdsRef.current.clear()
    }
  }, [projectId, activeThreadId, archiveThreadMutation])

  /**
   * Triggers a proactive greeting run when the chat opens with an empty thread.
   * The backend will fetch the daily plan and instruct the LLM to produce
   * a personalized welcome message based on the learner's current state.
   */
  const triggerProactiveGreeting = useCallback(async () => {
    if (!projectId || !agent || isLoading) return
    try {
      await sendChatMessage("__INIT__", undefined, true)
    } catch {
      // Silently fail — not critical
    }
  }, [projectId, agent, isLoading, sendChatMessage])

  return {
    agent,
    projectId,
    threads: threads ?? [],
    messages,
    activeThreadId,
    status,
    pendingPayload,
    activeJob,
    isLoading: isLoading || archiveThreadMutation.isPending,
    threadsError,
    messagesError,
    sendMessage,
    confirmRun,
    cancelRun,
    startNewThread,
    selectThread,
    deleteThread,
    triggerProactiveGreeting,
  }
}
