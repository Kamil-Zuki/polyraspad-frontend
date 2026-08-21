import { describe, expect, it } from "vitest"
import {
  agentMessageFromDto,
  createAgentMessage,
  parseAgentMessageMetadata,
  serializeAgentMessageMetadata,
  toAgentMessageInput,
} from "@/lib/agent/agent-message"

describe("agent message metadata", () => {
  it("round-trips refusal, suggested prompts, and actions through metadataJson", () => {
    const message = createAgentMessage("assistant", "I can only help with language learning.", {
      intentCategory: "out_of_scope",
      refusal: true,
      suggestedPrompts: ["Translate this sentence"],
      actions: [
        {
          id: "nav-reader",
          title: "Reader",
          kind: "navigate",
          href: "/reader",
          label: "Open Reader",
        },
      ],
    })

    const metadataJson = serializeAgentMessageMetadata(message)
    expect(metadataJson).toBeTruthy()

    const input = toAgentMessageInput(message)
    expect(input.metadataJson).toBe(metadataJson)

    const restored = agentMessageFromDto({
      id: message.id,
      role: message.role,
      content: message.content,
      metadataJson,
      createdAt: new Date(message.createdAt).toISOString(),
    })

    expect(restored.refusal).toBe(true)
    expect(restored.intentCategory).toBe("out_of_scope")
    expect(restored.suggestedPrompts).toEqual(["Translate this sentence"])
    expect(restored.actions?.[0]?.href).toBe("/reader")
  })

  it("returns empty metadata for plain messages", () => {
    const message = createAgentMessage("user", "Hello")
    expect(serializeAgentMessageMetadata(message)).toBeUndefined()
    expect(parseAgentMessageMetadata(undefined)).toEqual({})
  })

  it("preserves error flag in metadata", () => {
    const message = createAgentMessage("assistant", "Failed", { isError: true })
    const restored = agentMessageFromDto({
      id: message.id,
      role: message.role,
      content: message.content,
      metadataJson: serializeAgentMessageMetadata(message),
      createdAt: new Date(message.createdAt).toISOString(),
    })
    expect(restored.isError).toBe(true)
  })
})
