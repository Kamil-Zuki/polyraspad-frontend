import type { AgentMessage } from "@/lib/agent/agent-message"

export const AGENT_THREAD_CACHE_PREFIX = "polyraspad.agentThread.v2"
export const AGENT_THREAD_MAX_MESSAGES = 100

export const AGENT_SYNC_BANNERS = {
  loadFallback:
    "Couldn't sync chat history. Showing messages saved on this device.",
  persistFailure:
    "Your message wasn't saved to the server yet. We'll retry when you're back online.",
} as const

export type AgentSyncBannerKind = keyof typeof AGENT_SYNC_BANNERS

export interface AgentThreadCache {
  threadId: string | null
  messages: AgentMessage[]
  lastSyncedAt: number | null
}

export function agentThreadCacheKey(projectId: string) {
  return `${AGENT_THREAD_CACHE_PREFIX}:${projectId}`
}

export function emptyAgentThreadCache(): AgentThreadCache {
  return { threadId: null, messages: [], lastSyncedAt: null }
}

export function loadAgentThreadCache(projectId: string): AgentThreadCache {
  if (typeof window === "undefined") return emptyAgentThreadCache()
  try {
    const raw = window.localStorage.getItem(agentThreadCacheKey(projectId))
    if (!raw) return emptyAgentThreadCache()
    const parsed = JSON.parse(raw) as AgentThreadCache
    if (!parsed || !Array.isArray(parsed.messages)) return emptyAgentThreadCache()
    return {
      threadId: parsed.threadId ?? null,
      messages: parsed.messages.slice(-AGENT_THREAD_MAX_MESSAGES),
      lastSyncedAt: parsed.lastSyncedAt ?? null,
    }
  } catch {
    return emptyAgentThreadCache()
  }
}

export function saveAgentThreadCache(projectId: string, cache: AgentThreadCache) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(
      agentThreadCacheKey(projectId),
      JSON.stringify({
        threadId: cache.threadId,
        messages: cache.messages.slice(-AGENT_THREAD_MAX_MESSAGES),
        lastSyncedAt: cache.lastSyncedAt,
      }),
    )
  } catch {
    /* ignore quota */
  }
}
