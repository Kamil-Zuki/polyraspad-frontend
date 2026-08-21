import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, fireEvent, cleanup, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import ReaderPage from "./page"
import { clientSideTokenize } from "./reader-utils"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"
import { STUDY_LANGUAGE_STORAGE_KEY } from "@/lib/languages/study-language-preferences"

// Мок API: capture, analyze, terms
const captureCardMock = vi.fn()
const textAnalyzeMock = vi.fn()
const translateIntegrationMock = vi.fn().mockResolvedValue({ translatedText: "" })
const searchDuplicatesMock = vi.fn()
const markKnownMock = vi.fn()
const createOrUpdateTermMock = vi.fn()
const ignoreTermMock = vi.fn()
const getReaderLibraryMock = vi.fn()
const getReaderCollectionsMock = vi.fn()
const getSharedReaderCollectionsMock = vi.fn()
const saveReaderCollectionMock = vi.fn()
const fetchDocumentBytesMock = vi.fn()
const generateAudioMock = vi.fn().mockResolvedValue({ url: "https://cdn.example/audio.mp3" })
vi.mock("@/lib/api", () => ({
  apiClient: {
    cards: {
      captureCard: (data: unknown) => captureCardMock(data),
    },
    text: { analyze: (params: unknown) => textAnalyzeMock(params) },
    terms: {
      searchDuplicates: (data: unknown) => searchDuplicatesMock(data),
      markKnown: (data: unknown) => markKnownMock(data),
      createOrUpdate: (data: unknown) => createOrUpdateTermMock(data),
      ignore: (data: unknown) => ignoreTermMock(data),
      bulkMarkKnown: vi.fn().mockResolvedValue({ updatedCount: 0 }),
    },
    integrations: {
      translate: (params: unknown) => translateIntegrationMock(params),
      lookupDictionary: vi.fn().mockResolvedValue({
        provider: "stub",
        word: "cat",
        phonetic: "/kæt/",
        meanings: [{ partOfSpeech: "noun", definitions: ["felis catus"] }],
      }),
    },
  },
}))

vi.mock("@/lib/api/ollama-client", () => ({
  fetchMiningDraftClient: vi.fn().mockResolvedValue({
    targetTranslationInContext: "Кот",
    sentenceTranslation: "Кот сидел.",
    dictionaryLemmaHint: "cat",
  }),
}))

vi.mock("@/lib/api/media-client", () => ({
  uploadDocument: vi.fn(),
  fetchDocumentBytes: (...args: unknown[]) => fetchDocumentBytesMock(...args),
  formatGenerateAudioUserMessage: (e: unknown) =>
    e instanceof Error ? e.message : "Audio generation failed.",
  getReaderLibrary: (...args: unknown[]) => getReaderLibraryMock(...args),
  getReaderCollections: (...args: unknown[]) => getReaderCollectionsMock(...args),
  getSharedReaderCollections: (...args: unknown[]) => getSharedReaderCollectionsMock(...args),
  saveReaderLibraryBook: vi.fn(),
  deleteReaderLibraryBook: vi.fn(),
  saveReaderCollection: (...args: unknown[]) => saveReaderCollectionMock(...args),
  deleteReaderCollection: vi.fn(),
  shareReaderCollection: vi.fn(),
  unshareReaderCollection: vi.fn(),
  generateAudio: (...args: unknown[]) => generateAudioMock(...args),
}))

// Мок контекста проекта
const mockProject = { id: "proj-1", name: "Test Project", title: "Test Project", sourceLang: "en" }
vi.mock("@/contexts/project-context", () => ({
  useProjectContext: () => ({
    currentProject: mockProject,
    setCurrentProject: vi.fn(),
    isLoading: false,
  }),
}))

const routerReplaceMock = vi.fn()
const routerPushMock = vi.fn()
const readerSearchParams = new URLSearchParams()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: (url: string) => {
      routerReplaceMock(url)
      const queryIndex = url.indexOf("?")
      if (queryIndex < 0) return
      const params = new URLSearchParams(url.slice(queryIndex + 1))
      for (const key of [...readerSearchParams.keys()]) {
        readerSearchParams.delete(key)
      }
      params.forEach((value, key) => {
        readerSearchParams.set(key, value)
      })
    },
    push: (url: string) => {
      routerPushMock(url)
    },
  }),
  useSearchParams: () => readerSearchParams,
}))

vi.mock("@/lib/react-query/deck-queries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/react-query/deck-queries")>()
  return {
    ...actual,
    useDeckTree: vi.fn(() => ({
      data: [
        { id: "deck-inbox", title: "Inbox", cardCount: 1, children: [] },
        { id: "deck-verbs", title: "Verbs", cardCount: 0, children: [] },
      ],
      isPending: false,
      isFetched: true,
      isError: false,
    })),
    useDeck: vi.fn((deckId: string) =>
      deckId
        ? {
            data: {
              id: deckId,
              projectId: "proj-1",
              parentDeckId: null,
              ownerId: "user-1",
              title: "Inbox",
              description: null,
              coverImageUrl: null,
              isPublic: false,
              contributionPolicy: 0,
              licenseType: 0,
              forkedFromId: null,
              cardCount: 1,
              createdAt: new Date().toISOString(),
              stats: {
                newCardsCount: 0,
                learningCardsCount: 0,
                dueCardsCount: 1,
                studyableNowCount: 1,
                totalCardsCount: 1,
              },
            },
            isPending: false,
          }
        : { data: undefined, isPending: false }
    ),
  }
})


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

async function clickAnalyzedWord(wordName = "cat") {
  const [token] = await screen.findAllByRole("button", { name: wordName })
  fireEvent.click(token)
}

async function openInspectorFromWordPopover() {
  fireEvent.click(await screen.findByRole("button", { name: /more details & card/i }))
  await screen.findByPlaceholderText(/add your meaning/i)
}

describe("Library page", () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    readerSearchParams.forEach((_, key) => {
      readerSearchParams.delete(key)
    })
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("1280px") ? false : false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
    localStorage.clear()
    translateIntegrationMock.mockResolvedValue({ translatedText: "" })
    getReaderLibraryMock.mockResolvedValue([])
    getReaderCollectionsMock.mockResolvedValue([])
    getSharedReaderCollectionsMock.mockResolvedValue([])
    saveReaderCollectionMock.mockReset()
    searchDuplicatesMock.mockResolvedValue({
      isDuplicate: false,
      normalizedText: "",
      matchingTerms: [],
      existingCards: [],
    })
    markKnownMock.mockResolvedValue({
      termId: "t1",
      projectId: "proj-1",
      termText: "cat",
      normalizedText: "cat",
      type: "WORD",
      language: "en",
      status: "KNOWN",
      relatedCards: [],
    })
    createOrUpdateTermMock.mockResolvedValue({})
    ignoreTermMock.mockResolvedValue({})
    // Анализ текста возвращает токены с клиентского fallback (слова со статусом NEW)
    textAnalyzeMock.mockImplementation(({ text }: { text: string }) =>
      Promise.resolve(clientSideTokenize(text))
    )
  })

  it("should_save_mined_card_to_inbox_when_user_clicks_word", async () => {
    renderReader()

    fireEvent.click(screen.getByRole("button", { name: /paste text/i }))

    // Ввод текста и анализ
    const textarea = await screen.findByPlaceholderText(/paste a transcript, article, or chapter excerpt/i)
    fireEvent.change(textarea, { target: { value: "The cat sat." } })
    const analyzeBtn = screen.getByRole("button", { name: /analyze lesson/i })
    fireEvent.click(analyzeBtn)

    await clickAnalyzedWord()

    await openInspectorFromWordPopover()

    const translationInput = screen.getByPlaceholderText(/add your meaning/i)
    fireEvent.change(translationInput, { target: { value: "Кот" } })
    const mineBtn = screen.getByRole("button", { name: /create card/i })
    fireEvent.click(mineBtn)

    // Карточка создана через capture (поля заметки → Inbox на сервере) (SR-VOC-03)
    await waitFor(() => {
      expect(captureCardMock).toHaveBeenCalledTimes(1)
    })
    const payload = captureCardMock.mock.calls[0][0]
    expect(payload).toMatchObject({
      projectId: "proj-1",
      deckId: "deck-inbox",
      fieldValues: {
        [SENTENCE_MINING.Expression]: { stringValue: "The cat sat." },
        [SENTENCE_MINING.Word]: { stringValue: "cat" },
        [SENTENCE_MINING.Translation]: { stringValue: "Кот" },
        [SENTENCE_MINING.SourceTitle]: { stringValue: "Library" },
      },
    })
  })

  it("includes_extra_sentence_mining_fields_in_capture_payload_when_filled", async () => {
    renderReader()

    fireEvent.click(screen.getByRole("button", { name: /paste text/i }))

    const textarea = await screen.findByPlaceholderText(/paste a transcript, article, or chapter excerpt/i)
    fireEvent.change(textarea, { target: { value: "The cat sat." } })
    fireEvent.click(screen.getByRole("button", { name: /analyze lesson/i }))

    await clickAnalyzedWord()
    await openInspectorFromWordPopover()

    fireEvent.change(screen.getByPlaceholderText(/add your meaning/i), { target: { value: "Кот" } })

    const defInput = screen.getByPlaceholderText(/dictionary-style definition/i)
    fireEvent.change(defInput, { target: { value: "(noun) A small domesticated carnivore." } })

    fireEvent.click(screen.getByRole("button", { name: /create card/i }))

    await waitFor(() => {
      expect(captureCardMock).toHaveBeenCalledTimes(1)
    })
    const payload = captureCardMock.mock.calls[0][0] as {
      fieldValues: Record<string, { stringValue?: string }>
    }
    expect(payload.fieldValues[SENTENCE_MINING.Definition]?.stringValue).toContain("carnivore")
  })

  it("should_analyze_text_on_ctrl_enter", async () => {
    renderReader()

    fireEvent.click(screen.getByRole("button", { name: /paste text/i }))

    const textarea = await screen.findByPlaceholderText(/paste a transcript, article, or chapter excerpt/i)
    fireEvent.change(textarea, { target: { value: "The cat sat." } })
    fireEvent.keyDown(textarea, { key: "Enter", ctrlKey: true })

    expect((await screen.findAllByRole("button", { name: "cat" })).length).toBeGreaterThan(0)
    expect(textAnalyzeMock).toHaveBeenCalledWith({
      projectId: "proj-1",
      text: "The cat sat.",
    })
  })

  it("should_close_mine_dialog_on_escape", async () => {
    renderReader()

    fireEvent.click(screen.getByRole("button", { name: /paste text/i }))

    const textarea = await screen.findByPlaceholderText(/paste a transcript, article, or chapter excerpt/i)
    fireEvent.change(textarea, { target: { value: "The cat sat." } })
    fireEvent.click(screen.getByRole("button", { name: /analyze lesson/i }))

    await clickAnalyzedWord()
    expect(await screen.findByRole("dialog", { name: /quick actions for cat/i })).toBeInTheDocument()

    fireEvent.keyDown(window, { key: "Escape" })

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: /quick actions for cat/i })).not.toBeInTheDocument()
    })
  })

  it("should_open_popover_not_inspector_when_user_clicks_word", async () => {
    textAnalyzeMock.mockResolvedValue({
      tokens: [
        { text: "The", termText: "the", status: "KNOWN", type: "WORD" },
        { text: " ", status: "NONE", type: "SPACE" },
        { text: "cat", termText: "cat", status: "KNOWN", type: "WORD" },
        { text: " ", status: "NONE", type: "SPACE" },
        { text: "slept", termText: "sleep", status: "KNOWN", type: "WORD" },
        { text: ".", status: "NONE", type: "PUNCTUATION" },
      ],
      stats: {
        uniqueWords: 3,
        knownPercentage: 1,
      },
    })

    renderReader()

    fireEvent.click(screen.getByRole("button", { name: /paste text/i }))

    const textarea = await screen.findByPlaceholderText(/paste a transcript, article, or chapter excerpt/i)
    fireEvent.change(textarea, { target: { value: "The cat slept." } })
    fireEvent.click(screen.getByRole("button", { name: /analyze lesson/i }))

    await clickAnalyzedWord()

    expect(await screen.findByRole("dialog", { name: /quick actions for cat/i })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/add your meaning/i)).not.toBeInTheDocument()
  })

  it("should_call_generate_audio_from_popover_listen", async () => {
    const playMock = vi.fn().mockResolvedValue(undefined)
    const pauseMock = vi.fn()
    function AudioMock(this: { play: typeof playMock; pause: typeof pauseMock }) {
      this.play = playMock
      this.pause = pauseMock
    }
    vi.stubGlobal("Audio", AudioMock as unknown as typeof Audio)

    renderReader()

    fireEvent.click(screen.getByRole("button", { name: /paste text/i }))

    const textarea = await screen.findByPlaceholderText(/paste a transcript, article, or chapter excerpt/i)
    fireEvent.change(textarea, { target: { value: "The cat sat." } })
    fireEvent.click(screen.getByRole("button", { name: /analyze lesson/i }))

    await clickAnalyzedWord()
    fireEvent.click(await screen.findByRole("button", { name: /^Listen/i }))

    await waitFor(() => {
      expect(generateAudioMock).toHaveBeenCalledWith(
        expect.objectContaining({
          language: "en",
          text: expect.stringMatching(/cat/i),
        }),
      )
    })
    await waitFor(() => {
      expect(playMock).toHaveBeenCalled()
    })

    vi.unstubAllGlobals()
  })

  it("should_hide_empty_stats_when_analysis_has_no_reviewable_words", async () => {
    textAnalyzeMock.mockResolvedValue({
      tokens: [
        { text: "The", termText: "the", status: "KNOWN", type: "WORD" },
        { text: " ", status: "NONE", type: "SPACE" },
        { text: "cat", termText: "cat", status: "KNOWN", type: "WORD" },
        { text: ".", status: "NONE", type: "PUNCTUATION" },
      ],
      stats: {
        uniqueWords: 0,
        knownPercentage: 0,
      },
    })

    renderReader()

    fireEvent.click(screen.getByRole("button", { name: /paste text/i }))

    const textarea = await screen.findByPlaceholderText(/paste a transcript, article, or chapter excerpt/i)
    fireEvent.change(textarea, { target: { value: "The cat." } })
    fireEvent.click(screen.getByRole("button", { name: /analyze lesson/i }))

    await screen.findByRole("button", { name: "cat" })

    expect(
      screen.queryByText((_, element) => element?.textContent?.includes("Unique words") ?? false)
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText((_, element) => element?.textContent?.includes("Known 0%") ?? false)
    ).not.toBeInTheDocument()
  })

  it("should_call_terms_searchDuplicates_when_word_selected", async () => {
    renderReader()

    fireEvent.click(screen.getByRole("button", { name: /paste text/i }))

    const textarea = await screen.findByPlaceholderText(/paste a transcript, article, or chapter excerpt/i)
    fireEvent.change(textarea, { target: { value: "The cat sat." } })
    fireEvent.click(screen.getByRole("button", { name: /analyze lesson/i }))

    const [catToken] = await screen.findAllByRole("button", { name: "cat" })
    fireEvent.click(catToken)

    await waitFor(() => {
      expect(searchDuplicatesMock).toHaveBeenCalledWith({
        projectId: "proj-1",
        termText: "cat",
        type: "WORD",
      })
    })
  })

  it("should_call_terms_markKnown_when_user_clicks_known", async () => {
    renderReader()

    fireEvent.click(screen.getByRole("button", { name: /paste text/i }))

    const textarea = await screen.findByPlaceholderText(/paste a transcript, article, or chapter excerpt/i)
    fireEvent.change(textarea, { target: { value: "The cat sat." } })
    fireEvent.click(screen.getByRole("button", { name: /analyze lesson/i }))

    await clickAnalyzedWord()

    const popover = await screen.findByRole("dialog", { name: /quick actions for cat/i })
    fireEvent.click(within(popover).getByRole("button", { name: /^Known/i }))

    await waitFor(() => {
      expect(markKnownMock).toHaveBeenCalledWith({
        projectId: "proj-1",
        termText: "cat",
        type: "WORD",
        language: "en",
      })
    })
  })

  it("should_close_sidebar_from_inspector_header", async () => {
    renderReader()

    fireEvent.click(screen.getByRole("button", { name: /paste text/i }))

    const textarea = await screen.findByPlaceholderText(/paste a transcript, article, or chapter excerpt/i)
    fireEvent.change(textarea, { target: { value: "The cat sat." } })
    fireEvent.click(screen.getByRole("button", { name: /analyze lesson/i }))

    await clickAnalyzedWord()
    await openInspectorFromWordPopover()

    fireEvent.click(screen.getByRole("button", { name: /close inspector/i }))

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/add your meaning/i)).not.toBeInTheDocument()
    })
  })

  it("shows_mark_known_on_page_turn_setting_in_reader", async () => {
    renderReader()

    fireEvent.click(screen.getByRole("button", { name: /paste text/i }))

    const textarea = await screen.findByPlaceholderText(/paste a transcript, article, or chapter excerpt/i)
    fireEvent.change(textarea, { target: { value: "The cat sat." } })
    fireEvent.click(screen.getByRole("button", { name: /analyze lesson/i }))

    await screen.findByRole("button", { name: "cat" })
    fireEvent.click(screen.getByText(/more reading options/i))

    expect(
      screen.getByRole("checkbox", { name: /Mark remaining new words as known when turning the page/i })
    ).toBeInTheDocument()
  })

  it("renders_analyze_phrase_as_single_highlighted_control", async () => {
    textAnalyzeMock.mockResolvedValue({
      tokens: [
        { text: "take", termText: "take", status: "NEW", type: "WORD" },
        { text: " ", type: "SPACE", status: "NONE" },
        { text: "off", termText: "off", status: "NEW", type: "WORD" },
      ],
      phrases: [{ startIndex: 0, endIndex: 2, text: "take off", status: "SAVED" }],
      stats: { uniqueWords: 2, knownPercentage: 0 },
    })

    renderReader()

    fireEvent.click(screen.getByRole("button", { name: /paste text/i }))
    const textarea = await screen.findByPlaceholderText(/paste a transcript, article, or chapter excerpt/i)
    fireEvent.change(textarea, { target: { value: "take off" } })
    fireEvent.click(screen.getByRole("button", { name: /analyze lesson/i }))

    expect(await screen.findByRole("button", { name: "take off" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "take" })).not.toBeInTheDocument()
  })

  it("translate_word_uses_session_study_languages_not_project_defaults", async () => {
    localStorage.setItem(
      STUDY_LANGUAGE_STORAGE_KEY,
      JSON.stringify({ sourceLanguage: "fr", targetLanguage: "de" }),
    )

    renderReader()

    fireEvent.click(screen.getByRole("button", { name: /paste text/i }))

    const textarea = await screen.findByPlaceholderText(/paste a transcript, article, or chapter excerpt/i)
    fireEvent.change(textarea, { target: { value: "The cat sat." } })
    fireEvent.click(screen.getByRole("button", { name: /analyze lesson/i }))

    const [catToken] = await screen.findAllByRole("button", { name: "cat" })
    fireEvent.click(catToken)

    await waitFor(() => {
      expect(translateIntegrationMock).toHaveBeenCalled()
    })
    const translateArg = translateIntegrationMock.mock.calls[0][0] as {
      sourceLanguage: string
      targetLanguage: string
    }
    expect(translateArg.sourceLanguage).toBe("fr")
    expect(translateArg.targetLanguage).toBe("de")
  })

  it("save_card_targets_selected_deck_not_always_inbox", async () => {
    renderReader()

    fireEvent.click(screen.getByRole("button", { name: /paste text/i }))

    const textarea = await screen.findByPlaceholderText(/paste a transcript, article, or chapter excerpt/i)
    fireEvent.change(textarea, { target: { value: "The cat sat." } })
    fireEvent.click(screen.getByRole("button", { name: /analyze lesson/i }))

    await clickAnalyzedWord()
    await openInspectorFromWordPopover()

    fireEvent.change(screen.getByLabelText(/save card deck/i), { target: { value: "deck-verbs" } })

    fireEvent.change(screen.getByPlaceholderText(/add your meaning/i), { target: { value: "Кот" } })
    fireEvent.click(screen.getByRole("button", { name: /create card/i }))

    await waitFor(() => {
      expect(captureCardMock).toHaveBeenCalledTimes(1)
    })
    const payload = captureCardMock.mock.calls[0][0] as { deckId?: string }
    expect(payload.deckId).toBe("deck-verbs")
  })

  it("ai_sentence_translation_does_not_auto_fill_example_on_capture", async () => {
    renderReader()

    fireEvent.click(screen.getByRole("button", { name: /paste text/i }))

    const textarea = await screen.findByPlaceholderText(/paste a transcript, article, or chapter excerpt/i)
    fireEvent.change(textarea, { target: { value: "The cat sat." } })
    fireEvent.click(screen.getByRole("button", { name: /analyze lesson/i }))

    await clickAnalyzedWord()
    await openInspectorFromWordPopover()

    await screen.findByText("Кот сидел.")

    expect(screen.getByPlaceholderText(/Neighboring lines/i)).toHaveValue("The cat sat.")

    fireEvent.change(screen.getByPlaceholderText(/add your meaning/i), { target: { value: "Кот" } })
    fireEvent.click(screen.getByRole("button", { name: /create card/i }))

    await waitFor(() => {
      expect(captureCardMock).toHaveBeenCalledTimes(1)
    })
    const payload = captureCardMock.mock.calls[0][0] as {
      fieldValues: Record<string, { stringValue?: string }>
    }
    expect(payload.fieldValues[SENTENCE_MINING.Example]?.stringValue).toBe("The cat sat.")
    expect(payload.fieldValues[SENTENCE_MINING.Translation]?.stringValue).toBe("Кот")
  })

  it("inspector_generated_audio_url_is_included_in_capture_when_available", async () => {
    renderReader()

    fireEvent.click(screen.getByRole("button", { name: /paste text/i }))

    const textarea = await screen.findByPlaceholderText(/paste a transcript, article, or chapter excerpt/i)
    fireEvent.change(textarea, { target: { value: "The cat sat." } })
    fireEvent.click(screen.getByRole("button", { name: /analyze lesson/i }))

    await clickAnalyzedWord()
    await openInspectorFromWordPopover()

    await waitFor(() => {
      expect((screen.getByPlaceholderText(/add your meaning/i) as HTMLInputElement).value).toBe("Кот")
    })

    fireEvent.click(screen.getByRole("button", { name: /^Audio$/i }))

    await waitFor(() => {
      expect(generateAudioMock).toHaveBeenCalledWith(
        expect.objectContaining({
          language: "en",
          text: expect.stringMatching(/cat/i),
        }),
      )
    })

    await waitFor(() => {
      expect(screen.getByDisplayValue("https://cdn.example/audio.mp3")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /create card/i }))

    await waitFor(() => {
      expect(captureCardMock).toHaveBeenCalledTimes(1)
    })
    const payload = captureCardMock.mock.calls[0][0] as {
      fieldValues: Record<string, { stringValue?: string }>
    }
    expect(payload.fieldValues[SENTENCE_MINING.Audio]?.stringValue).toBe("https://cdn.example/audio.mp3")
  })


  it("should_preserve_bookId_in_url_while_hydrating_library_book", async () => {
    readerSearchParams.set("bookId", "book-1")
    getReaderLibraryMock.mockResolvedValue([
      {
        id: "book-1",
        title: "Test Book",
        fileName: "test.pdf",
        url: "https://cdn.example/test.pdf",
        uploadedAt: new Date().toISOString(),
      },
    ])
    fetchDocumentBytesMock.mockRejectedValue(new Error("Network error"))

    renderReader()

    await waitFor(() => {
      expect(getReaderLibraryMock).toHaveBeenCalledWith("proj-1")
    })

    // The URL sync effect must not strip bookId before the book session starts.
    // Otherwise the redirect effect would send the user back to /library.
    expect(readerSearchParams.get("bookId")).toBe("book-1")
    const replaceCallsWithoutBookId = routerReplaceMock.mock.calls.filter((call) => {
      const url = call[0] as string
      return url.includes("/reader?") && !url.includes("bookId=")
    })
    expect(replaceCallsWithoutBookId).toHaveLength(0)
  })

})
