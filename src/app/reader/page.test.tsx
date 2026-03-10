import { vi, describe, it, expect, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import ReaderPage from "./page"
import { clientSideTokenize } from "./reader-utils"

// Мок API: capture и analyze
const captureCardMock = vi.fn()
const textAnalyzeMock = vi.fn()
vi.mock("@/lib/api", () => ({
  apiClient: {
    cards: { captureCard: (data: unknown) => captureCardMock(data) },
    text: { analyze: (params: { text: string }) => textAnalyzeMock(params) },
  },
}))

// Мок контекста проекта
const mockProject = { id: "proj-1", name: "Test Project" }
vi.mock("@/contexts/project-context", () => ({
  useProjectContext: () => ({
    currentProject: mockProject,
    setCurrentProject: vi.fn(),
    isLoading: false,
  }),
}))

// Мок дерева колод: одна листовая колода для выбора
const mockDeckTree = [
  { id: "deck-1", title: "My Deck", cardCount: 0, children: [] },
]
vi.mock("@/lib/react-query/deck-queries", () => ({
  useDeckTree: () => ({
    data: mockDeckTree,
    isLoading: false,
  }),
}))

// ProtectedRoute просто рендерит детей
vi.mock("@/components/auth/protected-route", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

function renderReader() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ReaderPage />
    </QueryClientProvider>
  )
}

describe("Reader page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Анализ текста возвращает токены с клиентского fallback (слова со статусом NEW)
    textAnalyzeMock.mockImplementation(({ text }: { text: string }) =>
      Promise.resolve(clientSideTokenize(text))
    )
  })

  it("should_save_mined_card_to_selected_deck_when_user_clicks_word", async () => {
    renderReader()

    // Выбор колоды для майнинга
    const deckSelect = screen.getByRole("combobox", { name: /choose deck/i })
    fireEvent.change(deckSelect, { target: { value: "deck-1" } })

    // Ввод текста и анализ
    const textarea = screen.getByPlaceholderText(/cat jumped over a fence/i)
    fireEvent.change(textarea, { target: { value: "The cat sat." } })
    const analyzeBtn = screen.getByRole("button", { name: /analyze/i })
    fireEvent.click(analyzeBtn)

    // Ждём появления токенов и клика по слову (cat — NEW)
    const catToken = await screen.findByText("cat")
    fireEvent.click(catToken)

    // Диалог майнинга: ввод перевода и сохранение (плейсхолдер только в диалоге)
    const dialog = screen.getByRole("dialog")
    const translationInput = within(dialog).getByPlaceholderText(/Чудище|Бегемот/i)
    fireEvent.change(translationInput, { target: { value: "Кот" } })
    const mineBtn = within(dialog).getByRole("button", { name: /\+ mine/i })
    fireEvent.click(mineBtn)

    // Карточка создана с выбранной колодой и метаданными источника (SR-VOC-03)
    await waitFor(() => {
      expect(captureCardMock).toHaveBeenCalledTimes(1)
    })
    const payload = captureCardMock.mock.calls[0][0]
    expect(payload).toMatchObject({
      projectId: "proj-1",
      deckId: "deck-1",
      sentence: "The cat sat.",
      targetWord: "cat",
      translation: "Кот",
      sourceMeta: expect.objectContaining({
        type: "TEXT",
        title: "Reader",
      }),
    })
  })
})
