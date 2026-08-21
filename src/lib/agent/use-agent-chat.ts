"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useProjectContext } from "@/contexts/project-context"
import { useDeckTree } from "@/lib/react-query/queries"
import {
  agentMessageFromDto,
  createAgentMessage,
  type AgentMessage,
} from "@/lib/agent/agent-message"
import {
  AGENT_SYNC_BANNERS,
  loadAgentThreadCache,
  saveAgentThreadCache,
  type AgentSyncBannerKind,
} from "@/lib/agent/agent-thread-cache"
import { usePolyGuideLanguageTools } from "@/lib/polyguide/use-polyguide-language-tools"
import { loadStudyLanguagePair } from "@/lib/languages/study-language-preferences"
import {
  useAgentMessages,
  useAgentThreads,
  useArchiveAgentThread,
  useCreateAgentRun,
  useCreateAgentThread,
} from "@/lib/react-query/agent-queries"
import { apiClient } from "@/lib/api"

function findFirstDeckId(tree: { id: string; children?: unknown[] }[]): string | null {
  for (const node of tree) {
    if (!node.children?.length) return node.id
    const found = findFirstDeckId(node.children as { id: string; children?: unknown[] }[])
    if (found) return found
  }
  return null
}

function sortMessages(messages: AgentMessage[]) {
  return [...messages].sort((a, b) => a.createdAt - b.createdAt)
}

async function resolveActiveThreadId(
  projectId: string,
  currentThreadId: string | null,
  cachedThreads: Array<{ id: string }> | undefined,
  threadsErrored: boolean,
  createThread: (projectId: string) => Promise<{ id: string }>,
): Promise<string> {
  if (currentThreadId) return currentThreadId

  let existingThreadId = cachedThreads?.[0]?.id ?? null
  if (!existingThreadId && !threadsErrored) {
    try {
      const latestThreads = await apiClient.agent.listThreads(projectId)
      existingThreadId = latestThreads[0]?.id ?? null
    } catch {
      /* create below if still missing */
    }
  }

  if (existingThreadId) return existingThreadId

  const thread = await createThread(projectId)
  return thread.id
}

export function useAgentChat() {
  const { currentProject } = useProjectContext()
  const projectId = currentProject?.id ?? ""
  const sourceLang = currentProject?.sourceLang ?? loadStudyLanguagePair().sourceLanguage
  const targetLang = currentProject?.targetLang ?? loadStudyLanguagePair().targetLanguage
  const languageTools = usePolyGuideLanguageTools(sourceLang, targetLang)
  const { data: deckTree } = useDeckTree(projectId)

  const firstDeckId = useMemo(() => {
    if (!deckTree?.length) return null
    return findFirstDeckId(deckTree)
  }, [deckTree])

  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [threadId, setThreadId] = useState<string | null>(null)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [syncBanner, setSyncBanner] = useState<AgentSyncBannerKind | null>(null)
  const threadIdRef = useRef<string | null>(null)

  const {
    data: threads,
    isLoading: threadsLoading,
    isError: threadsError,
  } = useAgentThreads(projectId)

  const {
    data: messageList,
    isLoading: messagesLoading,
    isError: messagesError,
  } = useAgentMessages(activeThreadId, { enabled: !!activeThreadId })

  const createThreadMutation = useCreateAgentThread()
  const createRunMutation = useCreateAgentRun()
  const archiveThreadMutation = useArchiveAgentThread()

  const isSyncing =
    !!projectId &&
    (threadsLoading || (!!activeThreadId && messagesLoading && !threadsError && !messagesError))

  useEffect(() => {
    threadIdRef.current = threadId
  }, [threadId])

  useEffect(() => {
    if (!threads) return
    const threadIds = new Set(threads.map((t) => t.id))
    const fallback = threads[0]?.id ?? null
    setActiveThreadId((current) => {
      if (current && threadIds.has(current)) return current
      return fallback
    })
  }, [threads])

  useEffect(() => {
    if (!projectId) {
      setMessages([])
      setThreadId(null)
      setSyncBanner(null)
      return
    }

    const cache = loadAgentThreadCache(projectId)
    setMessages(cache.messages)
    setThreadId(cache.threadId)
    setSyncBanner(null)
  }, [projectId])

  useEffect(() => {
    if (!projectId) return

    if (threadsError || messagesError) {
      setSyncBanner("loadFallback")
      return
    }

    if (threads === undefined) return

    if (!activeThreadId) {
      setThreadId(null)
      setMessages([])
      saveAgentThreadCache(projectId, {
        threadId: null,
        messages: [],
        lastSyncedAt: Date.now(),
      })
      return
    }

    if (!messageList) return

    const loaded = sortMessages(messageList.items.map(agentMessageFromDto))
    setThreadId(activeThreadId)
    setMessages(loaded)
    saveAgentThreadCache(projectId, {
      threadId: activeThreadId,
      messages: loaded,
      lastSyncedAt: Date.now(),
    })
    setSyncBanner(null)
  }, [projectId, threads, activeThreadId, messageList, threadsError, messagesError])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || !projectId || isLoading) return

      const userMessage = createAgentMessage("user", trimmed)
      setMessages((prev) => {
        const next = [...prev, userMessage]
        saveAgentThreadCache(projectId, {
          threadId: threadIdRef.current,
          messages: next,
          lastSyncedAt: loadAgentThreadCache(projectId).lastSyncedAt,
        })
        return next
      })
      setIsLoading(true)

      try {
        const activeThreadId = await resolveActiveThreadId(
          projectId,
          threadIdRef.current,
          threads,
          threadsError,
          (id) => createThreadMutation.mutateAsync({ projectId: id }),
        )
        setThreadId(activeThreadId)
        threadIdRef.current = activeThreadId

        const assistantId = `optimistic-assistant-${Date.now()}`
        let assistantContent = ""
        let finalUserMessage = null
        let finalAssistantMessage = null

        setMessages((prev) => {
          const next = [...prev, createAgentMessage("assistant", "", { id: assistantId, isStreaming: true })]
          return next
        })

        const stream = apiClient.agent.createRunStream(activeThreadId, {
          projectId,
          userText: trimmed,
          sourceLang,
          targetLang,
          firstDeckId,
          isInitialGreeting: trimmed === "__INIT__" ? true : undefined,
        })

        for await (const { event, data } of stream) {
          if (event === "chunk") {
            assistantContent += data.chunk || ""
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: assistantContent } : m,
              ),
            )
          } else if (event === "final_result") {
            finalUserMessage = data.userMessage
            finalAssistantMessage = data.assistantMessage
          } else if (event === "error") {
            throw new Error(data.error || "Stream error")
          }
        }

        if (finalUserMessage && finalAssistantMessage) {
          const persistedUser = agentMessageFromDto(finalUserMessage)
          const persistedAssistant = agentMessageFromDto(finalAssistantMessage)

          setMessages((prev) => {
            const withoutOptimistic = prev.filter(
              (message) => message.id !== userMessage.id && message.id !== assistantId,
            )
            const next = sortMessages([...withoutOptimistic, persistedUser, persistedAssistant])
            saveAgentThreadCache(projectId, {
              threadId: activeThreadId,
              messages: next,
              lastSyncedAt: Date.now(),
            })
            return next
          })
        }
        setSyncBanner(null)
      } catch {
        saveAgentThreadCache(projectId, {
          threadId: threadIdRef.current,
          messages: sortMessages([
            ...loadAgentThreadCache(projectId).messages.filter(
              (message) => message.id !== userMessage.id,
            ),
            userMessage,
            createAgentMessage("assistant", "Something went wrong.", { isError: true }),
          ]),
          lastSyncedAt: loadAgentThreadCache(projectId).lastSyncedAt,
        })
        setMessages((prev) => [
          ...prev.filter((message) => message.id !== userMessage.id),
          userMessage,
          createAgentMessage("assistant", "Something went wrong.", { isError: true }),
        ])
        setSyncBanner("persistFailure")
      } finally {
        setIsLoading(false)
      }
    },
    [
      projectId,
      isLoading,
      threads,
      threadsError,
      createThreadMutation,
      createRunMutation,
      sourceLang,
      targetLang,
      firstDeckId,
    ],
  )

  const clearThread = useCallback(async () => {
    if (!projectId) return

    const currentThreadId = threadIdRef.current
    setMessages([])
    setThreadId(null)
    threadIdRef.current = null
    saveAgentThreadCache(projectId, {
      threadId: null,
      messages: [],
      lastSyncedAt: null,
    })

    if (!currentThreadId) return

    try {
      await archiveThreadMutation.mutateAsync({ threadId: currentThreadId, projectId })
      setSyncBanner(null)
    } catch {
      setSyncBanner("persistFailure")
    }
  }, [projectId, archiveThreadMutation])

  const selectThread = useCallback(
    (id: string) => {
      if (!projectId) return
      setActiveThreadId(id)
      setThreadId(id)
      threadIdRef.current = id
      saveAgentThreadCache(projectId, {
        threadId: id,
        messages: [],
        lastSyncedAt: null,
      })
      setMessages([])
      setSyncBanner(null)
    },
    [projectId]
  )

  const startNewThread = useCallback(async () => {
    if (!projectId) return

    setIsLoading(true)
    try {
      const thread = await createThreadMutation.mutateAsync({ projectId })
      selectThread(thread.id)
    } catch {
      setSyncBanner("persistFailure")
    } finally {
      setIsLoading(false)
    }
  }, [projectId, createThreadMutation, selectThread])

  // Fire a proactive greeting once when the thread is resolved but has no messages
  const greetingFiredRef = useRef(false)
  useEffect(() => {
    if (
      !isLoading &&
      !isSyncing &&
      projectId &&
      messages.length === 0 &&
      threadIdRef.current &&
      !greetingFiredRef.current
    ) {
      greetingFiredRef.current = true
      void sendMessage("__INIT__")
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isSyncing, projectId, messages.length])

  return {
    threads: threads ?? [],
    activeThreadId,
    messages,
    isLoading,
    isSyncing,
    syncBanner,
    syncBannerMessage: syncBanner ? AGENT_SYNC_BANNERS[syncBanner] : null,
    sendMessage,
    clearThread,
    selectThread,
    startNewThread,
    aiAvailable: languageTools.aiModels.length > 0 && !languageTools.aiLoadError,
    aiHint: languageTools.aiLoadError,
  }
}
