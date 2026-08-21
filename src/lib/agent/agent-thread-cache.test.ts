import { beforeEach, describe, expect, it } from "vitest"
import { createAgentMessage } from "@/lib/agent/agent-message"
import {
  AGENT_THREAD_CACHE_PREFIX,
  AGENT_THREAD_MAX_MESSAGES,
  agentThreadCacheKey,
  loadAgentThreadCache,
  saveAgentThreadCache,
} from "@/lib/agent/agent-thread-cache"

describe("agent thread cache", () => {
  const projectId = "project-1"

  beforeEach(() => {
    window.localStorage.clear()
  })

  it("stores threadId, messages, and lastSyncedAt", () => {
    const messages = [createAgentMessage("user", "Hello")]
    saveAgentThreadCache(projectId, {
      threadId: "thread-1",
      messages,
      lastSyncedAt: 123,
    })

    expect(loadAgentThreadCache(projectId)).toEqual({
      threadId: "thread-1",
      messages,
      lastSyncedAt: 123,
    })
    expect(agentThreadCacheKey(projectId)).toContain(AGENT_THREAD_CACHE_PREFIX)
    expect(window.localStorage.getItem(agentThreadCacheKey(projectId))).toContain("thread-1")
  })

  it("caps cached messages at 100", () => {
    const messages = Array.from({ length: 120 }, (_, index) =>
      createAgentMessage("user", `Message ${index}`),
    )

    saveAgentThreadCache(projectId, {
      threadId: "thread-1",
      messages,
      lastSyncedAt: Date.now(),
    })

    expect(loadAgentThreadCache(projectId).messages).toHaveLength(AGENT_THREAD_MAX_MESSAGES)
    expect(loadAgentThreadCache(projectId).messages[0]?.content).toBe("Message 20")
  })
})
