import { expect, test, vi, afterEach } from "vitest"
import { render, screen, waitFor, within, cleanup } from "@testing-library/react"
import { AiAssistant } from "./ai-assistant"
import { EditorCardProvider, useEditorCard } from "@/contexts/editor-card-context"
import { EditorLanguageProvider } from "@/contexts/editor-language-context"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"

vi.mock("@/lib/editor/use-editor-card-tools", () => ({
  useEditorCardTools: () => ({
    isTranslating: false,
    isLookingUpDictionary: false,
    isGeneratingAudio: false,
    isAutoFilling: false,
    isAiBusy: false,
    lastError: null,
    editorAiProvider: "openai-compatible" as const,
    ollamaModel: "gpt-4o-mini",
    aiModels: ["gpt-4o-mini"],
    aiLoadError: null,
    clearError: vi.fn(),
    translateWithTranslator: vi.fn(),
    translateWithAi: vi.fn(),
    lookupDictionary: vi.fn(),
    generateCardAudio: vi.fn(),
    autoFillCard: vi.fn(),
  }),
}))

vi.mock("@/lib/api/ollama-client", () => ({
  EDITOR_DEFAULT_AI_MODEL: "gpt-4o-mini",
  ollamaGenerate: vi.fn(),
  ollamaListModels: vi.fn(() =>
    Promise.resolve({ models: ["gpt-4o-mini"], provider: "openai-compatible" as const }),
  ),
  resolveEditorOllamaModel: vi.fn((models: string[], preferred = "") => preferred || models[0] || ""),
}))

function EditorStateSpy() {
  const {
    translation,
    definition,
    wordTypes,
    transcription,
    notes,
    targetWord,
    sentence,
    example,
    imageUrl,
    audioUrl,
  } = useEditorCard()
  return (
    <div data-testid="editor-state">
      <span data-testid="target">{targetWord}</span>
      <span data-testid="sentence">{sentence}</span>
      <span data-testid="translation">{translation}</span>
      <span data-testid="definition">{definition}</span>
      <span data-testid="wordTypes">{wordTypes}</span>
      <span data-testid="transcription">{transcription}</span>
      <span data-testid="notes">{notes}</span>
      <span data-testid="example">{example}</span>
      <span data-testid="image">{imageUrl}</span>
      <span data-testid="audio">{audioUrl}</span>
    </div>
  )
}

function renderAssistant(props?: { word?: string; sentence?: string; mode?: "sidebar" | "floating" }) {
  const initialFieldValues: Record<string, string> = {}
  if (props?.sentence) initialFieldValues[SENTENCE_MINING.Expression] = props.sentence
  if (props?.word) initialFieldValues[SENTENCE_MINING.Word] = props.word

  return render(
    <EditorCardProvider initialFieldValues={initialFieldValues}>
      <EditorLanguageProvider>
        <EditorStateSpy />
        <AiAssistant mode={props?.mode ?? "sidebar"} />
      </EditorLanguageProvider>
    </EditorCardProvider>,
  )
}

afterEach(() => {
  cleanup()
})

test("seeds target word through EditorCardProvider", () => {
  renderAssistant({ word: "address" })
  expect(screen.getAllByTestId("target")[0]).toHaveTextContent("address")
})

test("shows PolyGuide languages and advice on an empty card", async () => {
  renderAssistant()
  await waitFor(() => {
    expect(screen.getByText("Languages")).toBeInTheDocument()
    expect(screen.getByText(/Paste a sentence to get started/i)).toBeInTheDocument()
  })
  expect(screen.queryByRole("button", { name: /Auto-fill card/i })).not.toBeInTheDocument()
})

test("advice updates when sentence and word are present", async () => {
  renderAssistant({ word: "address", sentence: "He decided to address the issue." })
  await waitFor(() => {
    expect(screen.getByText(/Auto-Fill button/i)).toBeInTheDocument()
  })
  expect(screen.queryByRole("button", { name: /Auto-fill card/i })).not.toBeInTheDocument()
})

test("shows card status missing required fields", async () => {
  renderAssistant({ word: "address", sentence: "He decided to address the issue." })
  const status = await screen.findByText(/Missing required:/i)
  expect(status).toBeInTheDocument()
  expect(within(status.parentElement!).getByText(/Translation/i)).toBeInTheDocument()
})

test("floating mode renders toggle button", async () => {
  renderAssistant({ mode: "floating" })
  await waitFor(() => {
    expect(screen.getByTestId("polyguide-panel")).toBeInTheDocument()
  })
})
