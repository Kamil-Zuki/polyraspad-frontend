import { expect, test } from "vitest"
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
import { EditorCardProvider, useEditorCard, type EditorCardContextType } from "./editor-card-context"

function Consumer({ onMount }: { onMount: (state: EditorCardContextType) => void }) {
  const ctx = useEditorCard()
  onMount(ctx)
  return (
    <div data-testid="consumer">
      {ctx.sentence}|{ctx.targetWord}|{ctx.translation}|{ctx.notes}
    </div>
  )
}

test("should throw when useEditorCard is used outside EditorCardProvider", () => {
  expect(() => {
    render(
      <div>
        <Consumer onMount={() => {}} />
      </div>,
    )
  }).toThrow("useEditorCard must be used within EditorCardProvider")
})

test("should provide initial empty state", () => {
  let captured: EditorCardContextType | null = null
  render(
    <EditorCardProvider>
      <Consumer onMount={(ctx) => (captured = ctx)} />
    </EditorCardProvider>,
  )
  expect(captured).not.toBeNull()
  expect(captured!.sentence).toBe("")
  expect(captured!.targetWord).toBe("")
  expect(captured!.translation).toBe("")
  expect(captured!.notes).toBe("")
})

test("should update state when setCardState is called with partial patch", async () => {
  function SetCardStateButton() {
    const { setCardState, sentence, translation } = useEditorCard()
    return (
      <div>
        <button onClick={() => setCardState({ sentence: "Hello", translation: "Привет" })}>
          Apply
        </button>
        <span data-testid="out">{sentence}|{translation}</span>
      </div>
    )
  }
  render(
    <EditorCardProvider>
      <SetCardStateButton />
    </EditorCardProvider>,
  )
  expect(screen.getByTestId("out")).toHaveTextContent("|")
  fireEvent.click(screen.getByRole("button", { name: "Apply" }))
  await waitFor(() => {
    expect(screen.getByTestId("out")).toHaveTextContent("Hello|Привет")
  })
})

test("should update via individual setters", async () => {
  function SetterAndShow() {
    const { setSentence, setTargetWord, sentence, targetWord } = useEditorCard()
    return (
      <div>
        <button onClick={() => setSentence("Test sentence")}>Set sentence</button>
        <button onClick={() => setTargetWord("word")}>Set target</button>
        <span data-testid="out">{sentence}|{targetWord}</span>
      </div>
    )
  }
  const { container } = render(
    <EditorCardProvider>
      <SetterAndShow />
    </EditorCardProvider>,
  )
  const out = within(container).getByTestId("out")
  expect(out).toHaveTextContent("|")

  fireEvent.click(within(container).getByRole("button", { name: /Set sentence/ }))
  await waitFor(() => expect(out).toHaveTextContent("Test sentence|"))

  fireEvent.click(within(container).getByRole("button", { name: /Set target/ }))
  await waitFor(() => expect(out).toHaveTextContent("Test sentence|word"))
})
