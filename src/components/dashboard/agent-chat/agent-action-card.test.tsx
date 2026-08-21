import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { AgentActionCardView } from "@/components/dashboard/agent-chat/agent-action-card"
import { saveAgentEditorDraft } from "@/lib/agent/agent-editor-draft"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"

vi.mock("@/lib/agent/agent-editor-draft", () => ({
  saveAgentEditorDraft: vi.fn(),
}))

describe("AgentActionCardView", () => {
  it("calls onAction when clicked", () => {
    const onAction = vi.fn()
    render(
      <AgentActionCardView
        action={{
          id: "nav-reader",
          title: "Reader",
          description: "Go to reader.",
          kind: "navigate",
          href: "/reader",
          label: "Open Reader",
        }}
        onAction={onAction}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /Open Reader/i }))
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ href: "/reader", kind: "navigate" }),
    )
  })
})

describe("applyAgentActionNavigation draft handoff", () => {
  it("persists editor draft before navigation", async () => {
    const { applyAgentActionNavigation } = await import("@/lib/agent/agent-tool-registry")
    const draft = { [SENTENCE_MINING.Word]: "memory" }
    applyAgentActionNavigation({
      id: "draft",
      title: "Editor",
      kind: "open_editor_draft",
      href: "/editor",
      label: "Open in Editor",
      editorDraft: draft,
    })
    expect(saveAgentEditorDraft).toHaveBeenCalledWith(draft)
  })
})
