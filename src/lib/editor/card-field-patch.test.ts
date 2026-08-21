import { describe, expect, it } from "vitest"
import {
  buildCardStatus,
  diffCardFieldPatch,
  mergeCardFieldPatch,
  partitionPatch,
} from "@/lib/editor/card-field-patch"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"

describe("card-field-patch", () => {
  it("mergeCardFieldPatch skips non-empty fields unless forced", () => {
    const current = { [SENTENCE_MINING.Translation]: "existing" }
    const patch = { [SENTENCE_MINING.Translation]: "new", [SENTENCE_MINING.Definition]: "def" }
    const merged = mergeCardFieldPatch(current, patch)
    expect(merged[SENTENCE_MINING.Translation]).toBe("existing")
    expect(merged[SENTENCE_MINING.Definition]).toBe("def")
  })

  it("mergeCardFieldPatch force overwrites existing fields", () => {
    const current = { [SENTENCE_MINING.Translation]: "existing" }
    const patch = { [SENTENCE_MINING.Translation]: "new" }
    const merged = mergeCardFieldPatch(current, patch, { force: true })
    expect(merged[SENTENCE_MINING.Translation]).toBe("new")
  })

  it("diffCardFieldPatch returns existing and proposed values", () => {
    const current = { [SENTENCE_MINING.Word]: "address" }
    const patch = {
      [SENTENCE_MINING.Word]: "address",
      [SENTENCE_MINING.Translation]: "перевод",
    }
    expect(diffCardFieldPatch(current, patch)).toEqual({
      [SENTENCE_MINING.Translation]: { existing: "", proposed: "перевод" },
    })
  })

  it("partitionPatch splits empty and filled targets", () => {
    const current = {
      [SENTENCE_MINING.Translation]: "existing",
      [SENTENCE_MINING.Definition]: "",
    }
    const patch = {
      [SENTENCE_MINING.Translation]: "new",
      [SENTENCE_MINING.Definition]: "def",
      [SENTENCE_MINING.Notes]: "note",
    }
    const { applied, staged } = partitionPatch(current, patch)
    expect(applied).toEqual({
      [SENTENCE_MINING.Definition]: "def",
      [SENTENCE_MINING.Notes]: "note",
    })
    expect(staged).toEqual({
      [SENTENCE_MINING.Translation]: "new",
    })
  })

  it("buildCardStatus reports missing required fields", () => {
    const status = buildCardStatus({
      [SENTENCE_MINING.Expression]: "He decided to address the issue.",
      [SENTENCE_MINING.Word]: "address",
    })
    expect(status.requiredMissing.map((r) => r.fieldKey)).toContain(SENTENCE_MINING.Translation)
  })
})
