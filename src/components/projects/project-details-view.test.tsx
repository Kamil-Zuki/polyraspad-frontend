import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react"
import { ProjectDetailsView } from "./project-details-view"
import type { ProjectResponseDto } from "@/lib/api/types"

const mutateAsyncMock = vi.fn().mockResolvedValue(undefined)
vi.mock("@/lib/react-query/queries", () => ({
  useUpdateProject: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  }),
}))

vi.mock("@/components/decks/deck-tree", () => ({
  DeckTree: () => <div data-testid="deck-tree">Deck Tree</div>,
}))

const mockProject: ProjectResponseDto = {
  id: "prj-123",
  userId: "user-1",
  title: "English Upper-Intermediate",
  sourceLang: "ru",
  targetLang: "en",
  settings: {
    requestRetention: 0.9,
    maximumInterval: 36500,
    w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
    enableShortTerm: true,
  },
  stats: { totalTerms: 2500, knownTerms: 1800 },
  isArchived: false,
  createdAt: "2025-01-10T10:00:00Z",
}

describe("ProjectDetailsView", () => {
  beforeEach(() => {
    mutateAsyncMock.mockClear()
  })

  it("should_display_and_save_project_details_when_user_edits_fsrs", async () => {
    render(<ProjectDetailsView project={mockProject} />)

    // Отображение полей ProjectDto в UI
    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading.textContent).toBe("English Upper-Intermediate")
    const infoSection = screen.getByText("Project Information").closest("div")!
    expect(within(infoSection).getByText("RU")).toBeTruthy()
    expect(within(infoSection).getByText("EN")).toBeTruthy()
    expect(within(infoSection).getByText("2500")).toBeTruthy()
    expect(within(infoSection).getByText("1800")).toBeTruthy()
    expect(within(infoSection).getByText("No")).toBeTruthy() // isArchived
    expect(within(infoSection).getByText(/Created/)).toBeTruthy()

    // FSRS в режиме просмотра
    expect(screen.getByText("90.0%")).toBeTruthy()
    expect(screen.getByText("36500 days")).toBeTruthy()
    expect(screen.getByText("Yes")).toBeTruthy() // Enable Short Term

    // Редактирование: нажать Edit
    const editButton = screen.getByRole("button", { name: /Edit/i })
    fireEvent.click(editButton)

    // Форма FSRS видна (слайдер Request Retention)
    const retentionLabel = screen.getByText(/Request Retention:/)
    expect(retentionLabel).toBeTruthy()

    // Сохранить без изменения (проверяем, что отправляется UpdateProjectRequestDto)
    const saveButton = screen.getByRole("button", { name: /Save/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledTimes(1)
    })
    const [call] = mutateAsyncMock.mock.calls
    expect(call[0]).toEqual({
      id: "prj-123",
      data: {
        title: "English Upper-Intermediate",
        isArchived: false,
        settings: {
          requestRetention: 0.9,
          maximumInterval: 36500,
          w: mockProject.settings!.w,
          enableShortTerm: true,
        },
      },
    })
  })
})
