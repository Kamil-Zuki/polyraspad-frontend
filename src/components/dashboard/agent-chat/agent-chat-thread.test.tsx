import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { AgentChatThread } from "@/components/dashboard/agent-chat/agent-chat-thread"
import { createAgentMessage } from "@/lib/agent/agent-message"

describe("AgentChatThread refusal UX", () => {
  it("renders suggested prompts for refusal messages", () => {
    const onSuggestedPrompt = vi.fn()
    render(
      <AgentChatThread
        messages={[
          createAgentMessage("assistant", "I can't write code here.", {
            refusal: true,
            intentCategory: "out_of_scope",
            suggestedPrompts: ["Translate this sentence", "Create a flashcard for \"memory\""],
          }),
        ]}
        isLoading={false}
        onAction={vi.fn()}
        onSuggestedPrompt={onSuggestedPrompt}
      />,
    )

    expect(screen.getByTestId("agent-refusal-suggestions")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Translate this sentence" }))
    expect(onSuggestedPrompt).toHaveBeenCalledWith("Translate this sentence")
  })
})
