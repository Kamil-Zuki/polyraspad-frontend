import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import ImportPage from "./page"

// Мокаем контекст проекта и useDeckTree
vi.mock("@/contexts/project-context", () => ({
  useProjectContext: () => ({ currentProject: { id: "proj-1", title: "Test" } }),
}))

vi.mock("@/lib/react-query/queries", () => ({
  useDeckTree: () => ({ data: [{ id: "deck-1", title: "Deck 1", cardCount: 0, children: [] }] }),
}))

describe("ImportPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("рендерит заголовок Import и инпут выбора файла", () => {
    render(<ImportPage />)
    expect(screen.getByRole("heading", { name: /import/i })).toBeInTheDocument()
    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
  })
})
