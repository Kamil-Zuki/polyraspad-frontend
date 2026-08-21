import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import { AgentDashboardShell } from "@/components/dashboard/agent-chat/agent-dashboard-shell"

const mockSendMessage = vi.fn()
const mockClearThread = vi.fn()
const mockSelectThread = vi.fn()
const mockStartNewThread = vi.fn()
const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key: string) => {
      if (key === "agentChatPrompt1") return "Open Reader"
      return key
    }
    t.rich = (key: string) => key
    return t
  },
}))

vi.mock("@/lib/agent/use-agent-chat", () => ({
  useAgentChat: () => ({
    threads: [{ id: "t1", title: "First chat", updatedAt: "2026-07-01T10:00:00Z" }],
    activeThreadId: "t1",
    messages: [],
    isLoading: false,
    isSyncing: false,
    syncBannerMessage: null,
    sendMessage: mockSendMessage,
    clearThread: mockClearThread,
    selectThread: mockSelectThread,
    startNewThread: mockStartNewThread,
    aiAvailable: true,
    aiHint: null,
  }),
}))

vi.mock("@/components/dashboard/daily-goals", () => ({
  DailyGoals: () => <div data-testid="daily-goals">Goals</div>,
}))

vi.mock("@/components/dashboard/recent-decks", () => ({
  RecentDecks: () => <div data-testid="recent-decks">Decks</div>,
}))

vi.mock("@/components/dashboard/dashboard-progress-section", () => ({
  DashboardProgressSection: () => <div data-testid="progress-section">Progress</div>,
}))

describe("AgentDashboardShell", () => {
  beforeEach(() => {
    cleanup()
    mockSendMessage.mockReset()
    mockClearThread.mockReset()
    mockSelectThread.mockReset()
    mockStartNewThread.mockReset()
    mockPush.mockReset()
  })

  it("renders chat panel with stats below", () => {
    render(<AgentDashboardShell />)

    expect(screen.getByTestId("agent-command-center")).toBeInTheDocument()
    expect(screen.getByTestId("agent-empty-state")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Ask Study Copilot...")).toBeInTheDocument()
    expect(screen.getByText("What do you want to learn today?", { selector: "h3" })).toBeInTheDocument()

    const commandCenter = screen.getByTestId("agent-command-center")
    const statsBelow = screen.getByTestId("dashboard-stats-below")
    expect(commandCenter.compareDocumentPosition(statsBelow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    expect(screen.getByTestId("daily-goals")).toBeInTheDocument()
    expect(screen.getByTestId("recent-decks")).toBeInTheDocument()
    expect(screen.getByTestId("progress-section")).toBeInTheDocument()
  })

  it("dispatches suggested prompt through sendMessage", async () => {
    render(<AgentDashboardShell />)
    const buttons = screen.getAllByRole("button", { name: "Open Reader" })
    fireEvent.click(buttons[0]!)
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith("Open Reader")
    })
  })

  it("starts a new chat when New chat is clicked", async () => {
    render(<AgentDashboardShell />)
    fireEvent.click(screen.getByTestId("agent-new-chat-button"))
    await waitFor(() => {
      expect(mockStartNewThread).toHaveBeenCalledTimes(1)
    })
  })
})
