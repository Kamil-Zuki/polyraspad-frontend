import { describe, expect, it } from "vitest"
import {
  AGENTS,
  getAgentById,
  listAgents,
  resolveAgentResultActions,
} from "@/lib/agent/agent-catalog"

describe("agent-catalog", () => {
  it("lists Card Janitor as the default open agent", () => {
    const agents = listAgents()
    expect(agents).toHaveLength(1)
    expect(agents[0]?.id).toBe("card-janitor")
  })

  it("returns agent by id", () => {
    const agent = getAgentById("card-janitor")
    expect(agent).toBeDefined()
    expect(agent?.name).toBe("Card Janitor")
    expect(agent?.defaultPayload).toMatchObject({
      threshold: 8,
      includeMissingMedia: true,
    })
  })

  it("returns undefined for unknown agent", () => {
    expect(getAgentById("unknown")).toBeUndefined()
  })

  it("resolves result actions when counts are positive", () => {
    const agent = getAgentById("card-janitor")!
    const actions = resolveAgentResultActions(agent, {
      leechCount: 5,
      missingMediaCount: 3,
      duplicateCount: 0,
      emptyNoteCount: 2,
    })
    expect(actions.map((a) => a.id)).toEqual([
      "review-leeches",
      "fix-media",
      "review-empty-notes",
    ])
  })
})
