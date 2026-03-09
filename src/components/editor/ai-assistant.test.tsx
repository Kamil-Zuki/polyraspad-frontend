import { expect, test, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
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

beforeEach(() => {
  vi.mocked(ollamaGenerate).mockReset()
})

test("should render prompt to enter target word when targetWord is empty", () => {
  render(
    <EditorCardProvider>
      <AiAssistant />
    </EditorCardProvider>,
  )
  expect(screen.getByText(/Enter a target word to get AI suggestions/)).toBeInTheDocument()
})

test("should show Context Generator and Generate button when targetWord is set", () => {
  renderWithTarget("inevitable")
  expect(screen.getByText("Context Generator")).toBeInTheDocument()
  expect(screen.getByRole("button", { name: /Generate more examples/ })).toBeInTheDocument()
})

test("should call ollamaGenerate when Generate more examples is clicked", async () => {
  vi.mocked(ollamaGenerate).mockResolvedValue(
    'SENTENCE: "Success is inevitable."\nTRANSLATION: "Успех неизбежен."',
  )

  renderWithTarget("inevitable")
  fireEvent.click(screen.getByRole("button", { name: /Generate more examples/ }))

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
  fireEvent.click(screen.getByRole("button", { name: /Generate more examples/ }))
  await waitFor(() => expect(ollamaGenerate).toHaveBeenCalled())

  const exampleCard = await screen.findByText(/Success is inevitable/)
  fireEvent.click(exampleCard)

  await waitFor(() => {
    expect(screen.getByTestId("sentence")).toHaveTextContent("Success is inevitable.")
    expect(screen.getByTestId("translation")).toHaveTextContent("Успех неизбежен.")
  })
})

test("should add grammar text to notes when Add to notes is clicked", async () => {
  vi.mocked(ollamaGenerate).mockResolvedValue(
    "Inevitably is an adverb formed from the adjective inevitable.",
  )

  renderWithTarget("inevitable")

  fireEvent.click(screen.getByRole("button", { name: /Explain grammar/ }))
  await waitFor(() => expect(ollamaGenerate).toHaveBeenCalled())

  const addToNotesBtn = await screen.findByRole("button", { name: /Add to notes/ })
  fireEvent.click(addToNotesBtn)

  await waitFor(() => {
    expect(screen.getByTestId("notes")).toHaveTextContent("Inevitably is an adverb")
  })
})

test("should show error when ollamaGenerate fails", async () => {
  vi.mocked(ollamaGenerate).mockRejectedValue(new Error("Network error"))

  renderWithTarget("inevitable")
  fireEvent.click(screen.getByRole("button", { name: /Generate more examples/ }))

  await waitFor(() => {
    expect(screen.getByText("Network error")).toBeInTheDocument()
  })
})
