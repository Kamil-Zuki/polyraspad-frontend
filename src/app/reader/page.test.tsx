import { describe, it, expect, vi, beforeEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import ReaderPage from "./page"
import { apiClient } from "@/lib/api"

vi.mock("@/lib/api", () => ({
  apiClient: {
    text: { analyze: vi.fn() },
    cards: { captureCard: vi.fn() },
  },
}))

vi.mock("@/contexts/project-context", () => ({
  useProjectContext: vi.fn(),
}))

vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    isLoading: false,
  })),
}))

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

import { useProjectContext } from "@/contexts/project-context"

function renderReaderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ReaderPage />
    </QueryClientProvider>
  )
}

const mockProject = {
  id: "proj-1",
  userId: "user-1",
  title: "Test Project",
  sourceLang: "en",
  targetLang: "ru",
  isArchived: false,
  createdAt: "2025-01-01T00:00:00Z",
}

describe("ReaderPage", () => {
  beforeEach(() => {
    vi.mocked(useProjectContext).mockReturnValue({
      currentProject: null,
      setCurrentProject: vi.fn(),
      isLoading: false,
    } as ReturnType<typeof useProjectContext>)
    vi.mocked(apiClient.text.analyze).mockReset()
    vi.mocked(apiClient.cards.captureCard).mockReset()
  })

  it("should_show_select_project_when_no_project", () => {
    renderReaderPage()
    expect(screen.getByText("Select a project")).toBeInTheDocument()
  })

  it("should_call_analyze_api_when_analyze_clicked_with_text", async () => {
    vi.mocked(useProjectContext).mockReturnValue({
      currentProject: mockProject,
      setCurrentProject: vi.fn(),
      isLoading: false,
    } as ReturnType<typeof useProjectContext>)

    vi.mocked(apiClient.text.analyze).mockResolvedValue({
      tokens: [],
      stats: { uniqueWords: 0, knownPercentage: 0 },
    })

    renderReaderPage()
    const textarea = screen.getByPlaceholderText(/The cat jumped over a fence/)
    const analyzeBtn = screen.getByRole("button", { name: /Analyze/ })

    fireEvent.change(textarea, { target: { value: "Hello world" } })
    fireEvent.click(analyzeBtn)

    await waitFor(() => {
      expect(apiClient.text.analyze).toHaveBeenCalledWith({
        projectId: mockProject.id,
        text: "Hello world",
      })
    })
  })

  it("should_open_mine_modal_when_clicking_new_word", async () => {
    vi.mocked(useProjectContext).mockReturnValue({
      currentProject: mockProject,
      setCurrentProject: vi.fn(),
      isLoading: false,
    } as ReturnType<typeof useProjectContext>)

    vi.mocked(apiClient.text.analyze).mockResolvedValue({
      tokens: [
        { text: "The", type: "WORD", status: "KNOWN" },
        { text: " ", type: "SPACE" },
        { text: "behemoth", type: "WORD", status: "NEW" },
        { text: " ", type: "SPACE" },
        { text: "rose", type: "WORD", status: "KNOWN" },
        { text: ".", type: "PUNCTUATION" },
      ],
      stats: { uniqueWords: 3, knownPercentage: 66 },
    })

    renderReaderPage()
    const textarea = screen.getByPlaceholderText(/The cat jumped over a fence/)
    fireEvent.change(textarea, { target: { value: "The behemoth rose." } })
    fireEvent.click(screen.getByRole("button", { name: /Analyze/ }))

    await waitFor(() => {
      expect(screen.getByText("behemoth")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("behemoth"))

    expect(screen.getByRole("dialog", { name: /Mine card/ })).toBeInTheDocument()
    expect(screen.getByText("Mine card")).toBeInTheDocument()
  })

  it("should_call_capture_api_with_correct_dto_when_mine_submitted", async () => {
    vi.mocked(useProjectContext).mockReturnValue({
      currentProject: mockProject,
      setCurrentProject: vi.fn(),
      isLoading: false,
    } as ReturnType<typeof useProjectContext>)

    vi.mocked(apiClient.text.analyze).mockResolvedValue({
      tokens: [
        { text: "The", type: "WORD", status: "KNOWN" },
        { text: " ", type: "SPACE" },
        { text: "behemoth", type: "WORD", status: "NEW" },
        { text: " ", type: "SPACE" },
        { text: "rose", type: "WORD", status: "KNOWN" },
        { text: ".", type: "PUNCTUATION" },
      ],
      stats: { uniqueWords: 3, knownPercentage: 66 },
    })

    vi.mocked(apiClient.cards.captureCard).mockResolvedValue({
      id: "card-1",
      deckId: "deck-1",
      creatorId: "user-1",
      sentence: "The behemoth rose.",
      translation: "Чудище",
      targetWord: "behemoth",
      srsStatus: "NEW",
      createdAt: "2025-01-01T00:00:00Z",
    } as any)

    renderReaderPage()

    const sourceTitleInput = screen.getByPlaceholderText(/e.g. Article: Mythical Creatures/)
    fireEvent.change(sourceTitleInput, { target: { value: "Test Article" } })

    const textarea = screen.getByPlaceholderText(/The cat jumped over a fence/)
    fireEvent.change(textarea, { target: { value: "The behemoth rose." } })
    fireEvent.click(screen.getByRole("button", { name: /Analyze/ }))

    await waitFor(() => {
      expect(screen.getByText("behemoth")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("behemoth"))

    await waitFor(() => {
      expect(screen.getByText("Mine card")).toBeInTheDocument()
    })

    const translationInput = screen.getByPlaceholderText(/e.g. Чудище/)
    fireEvent.change(translationInput, { target: { value: "Чудище" } })

    const mineBtn = screen.getByRole("button", { name: "+ Mine" })
    fireEvent.click(mineBtn)

    await waitFor(() => {
      expect(apiClient.cards.captureCard).toHaveBeenCalledWith({
        projectId: mockProject.id,
        sentence: "The behemoth rose.",
        targetWord: "behemoth",
        translation: "Чудище",
        sourceMeta: { type: "TEXT", title: "Test Article" },
      })
    })
  })

  it("should_show_success_message_when_capture_succeeds", async () => {
    vi.mocked(useProjectContext).mockReturnValue({
      currentProject: mockProject,
      setCurrentProject: vi.fn(),
      isLoading: false,
    } as ReturnType<typeof useProjectContext>)

    vi.mocked(apiClient.text.analyze).mockResolvedValue({
      tokens: [
        { text: "The", type: "WORD", status: "KNOWN" },
        { text: " ", type: "SPACE" },
        { text: "behemoth", type: "WORD", status: "NEW" },
        { text: " ", type: "SPACE" },
        { text: "rose", type: "WORD", status: "KNOWN" },
        { text: ".", type: "PUNCTUATION" },
      ],
      stats: { uniqueWords: 3, knownPercentage: 66 },
    })

    vi.mocked(apiClient.cards.captureCard).mockResolvedValue({
      id: "card-1",
      deckId: "deck-1",
      creatorId: "user-1",
      sentence: "The behemoth rose.",
      translation: "Чудище",
      targetWord: "behemoth",
      srsStatus: "NEW",
      createdAt: "2025-01-01T00:00:00Z",
    } as any)

    renderReaderPage()

    const textarea = screen.getByPlaceholderText(/The cat jumped over a fence/)
    fireEvent.change(textarea, { target: { value: "The behemoth rose." } })
    fireEvent.click(screen.getByRole("button", { name: /Analyze/ }))

    await waitFor(() => {
      expect(screen.getByText("behemoth")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("behemoth"))

    await waitFor(() => {
      expect(screen.getByText("Mine card")).toBeInTheDocument()
    })

    const translationInput = screen.getByPlaceholderText(/e.g. Чудище/)
    fireEvent.change(translationInput, { target: { value: "Чудище" } })

    const mineBtn = screen.getByRole("button", { name: "+ Mine" })
    fireEvent.click(mineBtn)

    await waitFor(() => {
      expect(screen.getByText(/Card saved to Inbox|saved/i)).toBeInTheDocument()
    })
  })
})
