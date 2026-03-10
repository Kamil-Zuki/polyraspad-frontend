import { vi, describe, it, expect } from "vitest"

const redirectMock = vi.fn()
vi.mock("next/navigation", () => ({ redirect: (...args: unknown[]) => redirectMock(...args) }))

describe("Generator page", () => {
  it("should_redirect_from_generator_to_editor_with_ai_tab_when_visiting_generator", async () => {
    redirectMock.mockClear()
    const { default: GeneratorPage } = await import("./page")
    try {
      GeneratorPage()
    } catch {
      // Next.js redirect() может бросать
    }
    expect(redirectMock).toHaveBeenCalledWith("/editor?tab=ai")
  })
})
