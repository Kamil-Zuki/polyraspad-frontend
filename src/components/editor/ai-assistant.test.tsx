import { expect, test, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
import { useEffect } from "react"
import { AiAssistant } from "./ai-assistant"
import { EditorCardProvider, useEditorCard } from "@/contexts/editor-card-context"

vi.mock("@/lib/api/ollama-client", () => ({
  ollamaGenerate: vi.fn(),
  ollamaListModels: vi.fn(() => Promise.resolve([])),
}))

import { ollamaGenerate } from "@/lib/api/ollama-client"

function SetTargetWord({ word, children }: { word: string; children: React.ReactNode }) {
  const { setTargetWord } = useEditorCard()
  useEffect(() => {
    setTargetWord(word)
  }, [word, setTargetWord])
  return <>{children}</>
}

function EditorStateSpy() {
  const { sentence, translation, notes } = useEditorCard()
  return (
    <div data-testid="editor-state">
      <span data-testid="sentence">{sentence}</span>
      <span data-testid="translation">{translation}</span>
      <span data-testid="notes">{notes}</span>
    </div>
  )
}

function renderWithTarget(word: string) {
  return render(
    <EditorCardProvider>
      <SetTargetWord word={word}>
        <EditorStateSpy />
        <AiAssistant />
      </SetTargetWord>
    </EditorCardProvider>,
  )
}

/** Панель с приглашением ввести слово (первый aside). */
function getFirstAssistantPanel() {
  return screen.getAllByRole("complementary")[0]
}

/** Панель с контентом для targetWord (Context Generator) — в DOM может быть два aside из-за Strict Mode. */
function getAssistantPanelWithContext() {
  const panels = screen.getAllByRole("complementary")
  const withContext = panels.find((p) => within(p).queryByText("Context Generator"))
  return withContext ?? panels[0]
}

beforeEach(() => {
  vi.mocked(ollamaGenerate).mockReset()
})

test("should render prompt to enter target word when targetWord is empty", () => {
  render(
    <EditorCardProvider>
      <AiAssistant />
    </EditorCardProvider>,
  )
  const panel = getFirstAssistantPanel()
  expect(within(panel).getByText(/Enter a target word to get AI suggestions/)).toBeInTheDocument()
})

test("should show Context Generator and Generate button when targetWord is set", () => {
  renderWithTarget("inevitable")
  const panel = getAssistantPanelWithContext()
  expect(within(panel).getByText("Context Generator")).toBeInTheDocument()
  expect(within(panel).getByRole("button", { name: /Generate more examples/ })).toBeInTheDocument()
})

test("should call ollamaGenerate when Generate more examples is clicked", async () => {
  vi.mocked(ollamaGenerate).mockResolvedValue(
    'SENTENCE: "Success is inevitable."\nTRANSLATION: "Успех неизбежен."',
  )

  renderWithTarget("inevitable")
  const panel = getAssistantPanelWithContext()
  fireEvent.click(within(panel).getByRole("button", { name: /Generate more examples/ }))

  await waitFor(() => {
    expect(ollamaGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("inevitable"),
        stream: false,
      }),
    )
  })
})

test("should apply example to form when Use this example is clicked", async () => {
  vi.mocked(ollamaGenerate).mockResolvedValue(
    'SENTENCE: "Success is inevitable."\nTRANSLATION: "Успех неизбежен."',
  )

  renderWithTarget("inevitable")
  const panel = getAssistantPanelWithContext()
  fireEvent.click(within(panel).getByRole("button", { name: /Generate more examples/ }))
  await waitFor(() => expect(ollamaGenerate).toHaveBeenCalled())

  const exampleCards = await within(panel).findAllByText(/Success is inevitable/)
  fireEvent.click(exampleCards[0])

  const editorState = screen.getAllByTestId("editor-state")[0]
  await waitFor(() => {
    expect(within(editorState).getByTestId("sentence")).toHaveTextContent("Success is inevitable.")
    expect(within(editorState).getByTestId("translation")).toHaveTextContent("Успех неизбежен.")
  })
})

test("should add grammar text to notes when Add to notes is clicked", async () => {
  vi.mocked(ollamaGenerate).mockResolvedValue(
    "Inevitably is an adverb formed from the adjective inevitable.",
  )

  renderWithTarget("inevitable")
  const panel = getAssistantPanelWithContext()

  fireEvent.click(within(panel).getByRole("button", { name: /Explain grammar/ }))
  await waitFor(() => expect(ollamaGenerate).toHaveBeenCalled())

  const addToNotesBtn = await within(panel).findByRole("button", { name: /Add to notes/ })
  fireEvent.click(addToNotesBtn)

  const editorState = screen.getAllByTestId("editor-state")[0]
  await waitFor(() => {
    expect(within(editorState).getByTestId("notes")).toHaveTextContent("Inevitably is an adverb")
  })
})

test("should show error when ollamaGenerate fails", async () => {
  vi.mocked(ollamaGenerate).mockRejectedValue(new Error("Network error"))

  renderWithTarget("inevitable")
  const panel = getAssistantPanelWithContext()
  fireEvent.click(within(panel).getByRole("button", { name: /Generate more examples/ }))

  await waitFor(() => {
    expect(within(panel).getByText("Network error")).toBeInTheDocument()
  })
})
