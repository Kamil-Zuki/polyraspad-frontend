import { beforeEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useAgentWorkspace } from "@/lib/agent/use-agent-workspace"

const mockCreateThread = vi.fn()
const mockCreateRun = vi.fn()
const mockPersistRun = vi.fn()
const mockCreateJob = vi.fn()

let mockThreadsState: {
  data: Array<{ id: string; projectId: string; title: string; updatedAt: string }> | undefined
  isLoading: boolean
  isError: boolean
} = {
  data: undefined,
  isLoading: false,
  isError: false,
}

let mockMessagesState: {
  data: { items: Array<{ id: string; role: string; content: string; createdAt: string; metadataJson?: string | null }> } | undefined
  isLoading: boolean
  isError: boolean
} = {
  data: undefined,
  isLoading: false,
  isError: false,
}

let mockJobState: {
  data: { id: string; status: string; progressPercent: number; logs: string[]; result?: Record<string, unknown> | null; lastError?: string | null } | undefined
} = {
  data: undefined,
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

vi.mock("@/lib/react-query/agent-queries", () => ({
  useAgentThreads: () => mockThreadsState,
  useAgentMessages: () => mockMessagesState,
  useCreateAgentThread: () => ({
    mutateAsync: mockCreateThread,
  }),
  usePersistAgentRun: () => ({
    mutateAsync: mockPersistRun,
  }),
  useCreateAgentRun: () => ({
    mutateAsync: mockCreateRun,
  }),
  useArchiveAgentThread: () => ({
    mutateAsync: vi.fn(),
  }),
}))

vi.mock("@/lib/react-query/automation-queries", () => ({
  useCreateAutomationJob: () => ({
    mutateAsync: mockCreateJob,
  }),
  useAutomationJob: () => mockJobState,
  useRetryAutomationJob: () => ({
    mutateAsync: vi.fn(),
  }),
  useResumeAutomationJob: () => ({
    mutateAsync: vi.fn(),
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

describe("useAgentWorkspace", () => {
  beforeEach(() => {
    mockCreateThread.mockReset()
    mockCreateRun.mockReset()
    mockPersistRun.mockReset()
    mockCreateJob.mockReset()

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
    mockJobState = {
      data: undefined,
    }
  })

  it("returns Card Janitor agent and idle status", () => {
    const { result } = renderHook(() => useAgentWorkspace("card-janitor"), {
      wrapper: createWrapper(),
    })

    expect(result.current.agent?.id).toBe("card-janitor")
    expect(result.current.status).toBe("idle")
    expect(result.current.messages).toHaveLength(0)
  })

  it("persists a confirmation message when the user sends a request", async () => {
    mockCreateThread.mockResolvedValueOnce({ id: "thread-new", projectId: "project-1" })
    mockPersistRun.mockResolvedValueOnce({
      run: { id: "run-1" },
      userMessage: { id: "user-1", role: "user", content: "[card-janitor] Clean up", createdAt: "2026-05-24T10:00:00.000Z" },
      assistantMessage: {
        id: "assistant-1",
        role: "assistant",
        content: "I'll run Card Janitor with leech threshold 8 and include missing media. Ready to start?",
        createdAt: "2026-05-24T10:00:01.000Z",
      },
    })

    const { result } = renderHook(() => useAgentWorkspace("card-janitor"), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.sendMessage("Clean up")
    })

    expect(mockCreateThread).toHaveBeenCalledWith({
      projectId: "project-1",
      agentId: "card-janitor",
    })
    expect(mockPersistRun).toHaveBeenCalledWith(
      expect.objectContaining({
        threadId: "thread-new",
        request: expect.objectContaining({
          projectId: "project-1",
          userMessage: expect.objectContaining({ content: "Clean up" }),
          assistantMessage: expect.objectContaining({
            content: "I'll run Card Janitor with leech threshold 8 and include missing media. Ready to start?",
          }),
        }),
      }),
    )
    expect(result.current.status).toBe("confirming")
  })

  it("calls the LLM run when the user sends a general chat message", async () => {
    mockCreateThread.mockResolvedValueOnce({ id: "thread-new", projectId: "project-1" })
    mockCreateRun.mockResolvedValueOnce({
      run: { id: "run-1" },
      userMessage: { id: "user-1", role: "user", content: "How are you?", createdAt: "2026-05-24T10:00:00.000Z" },
      assistantMessage: {
        id: "assistant-1",
        role: "assistant",
        content: "I'm doing well, thanks for asking!",
        createdAt: "2026-05-24T10:00:01.000Z",
      },
    })

    const { result } = renderHook(() => useAgentWorkspace("card-janitor"), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.sendMessage("How are you?")
    })

    expect(mockCreateThread).toHaveBeenCalledWith({
      projectId: "project-1",
      agentId: "card-janitor",
    })
    expect(mockCreateRun).toHaveBeenCalledWith(
      expect.objectContaining({
        threadId: "thread-new",
        request: expect.objectContaining({
          projectId: "project-1",
          userText: "How are you?",
        }),
      }),
    )
    expect(mockPersistRun).not.toHaveBeenCalled()
    expect(result.current.status).toBe("idle")
  })
})
