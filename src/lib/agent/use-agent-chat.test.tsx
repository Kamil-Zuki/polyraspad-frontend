import { beforeEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { createAgentMessage } from "@/lib/agent/agent-message"
import {
  agentThreadCacheKey,
  loadAgentThreadCache,
} from "@/lib/agent/agent-thread-cache"
import { useAgentChat } from "@/lib/agent/use-agent-chat"

const mockCreateThread = vi.fn()
const mockCreateRun = vi.fn()
const mockArchiveThread = vi.fn()

let mockThreadsState: {
  data: Array<{ id: string; projectId: string; title: string }> | undefined
  isLoading: boolean
  isError: boolean
} = {
  data: undefined,
  isLoading: false,
  isError: false,
}

let mockMessagesState: {
  data: { items: Array<{ id: string; role: string; content: string; createdAt: string }> } | undefined
  isLoading: boolean
  isError: boolean
} = {
  data: undefined,
  isLoading: false,
  isError: false,
}

vi.mock("@/contexts/project-context", () => ({
  useProjectContext: () => ({
    currentProject: {
      id: "project-1",
      title: "English",
      sourceLang: "en",
      targetLang: "ru",
    },
  }),
}))

vi.mock("@/lib/react-query/queries", () => ({
  useDeckTree: () => ({ data: [] }),
}))

vi.mock("@/lib/polyguide/use-polyguide-language-tools", () => ({
  usePolyGuideLanguageTools: () => ({
    sourceLang: "en",
    targetLang: "ru",
    ollamaModel: "gpt-test",
    aiModels: ["gpt-test"],
    aiLoadError: null,
    translateText: vi.fn(),
    lookupDictionary: vi.fn(),
  }),
}))

vi.mock("@/lib/react-query/agent-queries", () => ({
  useAgentThreads: () => mockThreadsState,
  useAgentMessages: () => mockMessagesState,
  useCreateAgentThread: () => ({
    mutateAsync: mockCreateThread,
  }),
  useCreateAgentRun: () => ({
    mutateAsync: mockCreateRun,
  }),
  useArchiveAgentThread: () => ({
    mutateAsync: mockArchiveThread,
  }),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe("useAgentChat", () => {
  beforeEach(() => {
    window.localStorage.clear()
    mockCreateThread.mockReset()
    mockCreateRun.mockReset()
    mockArchiveThread.mockReset()

    mockThreadsState = {
      data: undefined,
      isLoading: false,
      isError: false,
    }
    mockMessagesState = {
      data: undefined,
      isLoading: false,
      isError: false,
    }
  })

  it("loads backend messages when an active thread exists", async () => {
    mockThreadsState = {
      data: [{ id: "thread-1", projectId: "project-1", title: "Hello" }],
      isLoading: false,
      isError: false,
    }
    mockMessagesState = {
      data: {
        items: [
          {
            id: "msg-1",
            role: "user",
            content: "Hello",
            createdAt: "2026-05-24T10:00:00.000Z",
          },
        ],
      },
      isLoading: false,
      isError: false,
    }

    const { result } = renderHook(() => useAgentChat(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1)
    })

    expect(result.current.messages[0]?.content).toBe("Hello")
    expect(result.current.syncBanner).toBeNull()
    expect(loadAgentThreadCache("project-1").threadId).toBe("thread-1")
  })

  it("shows load fallback banner when backend sync fails", async () => {
    window.localStorage.setItem(
      agentThreadCacheKey("project-1"),
      JSON.stringify({
        threadId: "cached-thread",
        messages: [createAgentMessage("user", "Cached hello")],
        lastSyncedAt: 100,
      }),
    )

    mockThreadsState = {
      data: undefined,
      isLoading: false,
      isError: true,
    }

    const { result } = renderHook(() => useAgentChat(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.syncBanner).toBe("loadFallback")
    })

    expect(result.current.messages[0]?.content).toBe("Cached hello")
    expect(result.current.syncBannerMessage).toContain("Couldn't sync chat history")
  })

  it("executes a server-backed run when sending a message", async () => {
    mockCreateThread.mockResolvedValueOnce({ id: "thread-new", projectId: "project-1" })
    mockCreateRun.mockResolvedValueOnce({
      run: { id: "run-1" },
      userMessage: {
        id: "server-user",
        role: "user",
        content: "Open Reader",
        createdAt: "2026-05-24T10:00:00.000Z",
      },
      assistantMessage: {
        id: "server-assistant",
        role: "assistant",
        content: "Opening Reader.",
        createdAt: "2026-05-24T10:00:01.000Z",
      },
    })

    const { result } = renderHook(() => useAgentChat(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.sendMessage("Open Reader")
    })

    expect(mockCreateThread).toHaveBeenCalledWith({ projectId: "project-1" })
    expect(mockCreateRun).toHaveBeenCalledWith({
      threadId: "thread-new",
      request: expect.objectContaining({
        projectId: "project-1",
        userText: "Open Reader",
        sourceLang: "en",
        targetLang: "ru",
      }),
    })
    expect(result.current.messages.some((message) => message.id === "server-assistant")).toBe(true)
    expect(result.current.syncBanner).toBeNull()
  })

  it("keeps optimistic messages and shows persist failure banner when run save fails", async () => {
    mockCreateThread.mockResolvedValueOnce({ id: "thread-new", projectId: "project-1" })
    mockCreateRun.mockRejectedValueOnce(new Error("offline"))

    const { result } = renderHook(() => useAgentChat(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.sendMessage("Translate this")
    })

    expect(result.current.messages).toHaveLength(2)
    expect(result.current.syncBanner).toBe("persistFailure")
    expect(result.current.syncBannerMessage).toContain("wasn't saved to the server")
  })

  it("archives the active thread on clear chat", async () => {
    mockThreadsState = {
      data: [{ id: "thread-1", projectId: "project-1", title: "Hello" }],
      isLoading: false,
      isError: false,
    }
    mockMessagesState = {
      data: {
        items: [
          {
            id: "msg-1",
            role: "user",
            content: "Hello",
            createdAt: "2026-05-24T10:00:00.000Z",
          },
        ],
      },
      isLoading: false,
      isError: false,
    }
    mockArchiveThread.mockResolvedValueOnce("project-1")

    const { result } = renderHook(() => useAgentChat(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1)
    })

    await act(async () => {
      await result.current.clearThread()
    })

    expect(mockArchiveThread).toHaveBeenCalledWith({
      threadId: "thread-1",
      projectId: "project-1",
    })
    expect(result.current.messages).toHaveLength(0)
    expect(loadAgentThreadCache("project-1").threadId).toBeNull()
  })
})
