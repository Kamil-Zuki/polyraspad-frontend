import { describe, expect, it } from "vitest"
import { substituteNoteTemplate, substituteNoteTemplateToHtml } from "./template-render"

describe("substituteNoteTemplate", () => {
  it("replaces placeholders and escapes HTML", () => {
    const s = substituteNoteTemplate("{{Word}} — {{Expression}}", {
      Word: "<b>x</b>",
      Expression: 'say "hi"',
    })
    expect(s).toContain("&lt;b&gt;x&lt;/b&gt;")
    expect(s).toContain("&quot;hi&quot;")
  })
})

describe("substituteNoteTemplateToHtml", () => {
  it("converts newlines to br", () => {
    const html = substituteNoteTemplateToHtml("a\n{{Word}}", { Word: "w" })
    expect(html).toBe("a<br />w")
  })
})
