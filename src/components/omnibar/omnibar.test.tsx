import { describe, it, expect, vi, beforeEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { OmnibarProvider } from "@/contexts/omnibar-context"
import { Omnibar } from "./omnibar"

const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/dashboard",
}))

vi.mock("@/contexts/project-context", () => ({
  useProjectContext: () => ({
    currentProject: { id: "p1", title: "Test", sourceLang: "en", targetLang: "ru" },
  }),
}))

vi.mock("@/lib/react-query/deck-queries", () => ({
  useDeckTree: () => ({
    data: [{ id: "inbox", title: "Inbox", children: [] }],
  }),
}))

vi.mock("@/lib/react-query/card-queries", () => ({
  useCreateCard: () => ({
    mutateAsync: vi.fn(),
  }),
}))

vi.mock("./quick-add-card", () => ({
  buildQuickAddCardPatch: vi.fn(),
  patchToCreateCardFieldValues: vi.fn((patch: Record<string, string>) =>
    Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, { stringValue: v }])),
  ),
}))

function renderOmnibar() {
  return render(
    <OmnibarProvider>
      <Omnibar />
    </OmnibarProvider>,
  )
}

describe("Omnibar", () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("opens with Ctrl+K and focuses the input", async () => {
    const user = userEvent.setup()
    renderOmnibar()

    expect(screen.queryByLabelText("Command palette input")).not.toBeInTheDocument()

    await user.keyboard("{Control>}k{/Control}")

    expect(screen.getByLabelText("Command palette input")).toBeInTheDocument()
  })

  it("closes with Escape", async () => {
    const user = userEvent.setup()
    renderOmnibar()

    await user.keyboard("{Control>}k{/Control}")
    expect(screen.getByLabelText("Command palette input")).toBeInTheDocument()

    await user.keyboard("{Escape}")
    await waitFor(() => {
      expect(screen.queryByLabelText("Command palette input")).not.toBeInTheDocument()
    })
  })

  it("shows suggested actions and recent navigation when empty", async () => {
    const user = userEvent.setup()
    renderOmnibar()

    await user.keyboard("{Control>}k{/Control}")

    expect(screen.getByText("Suggested Actions")).toBeInTheDocument()
    expect(screen.getByText("Study Now")).toBeInTheDocument()
  })

  it("filters navigation by query", async () => {
    const user = userEvent.setup()
    renderOmnibar()

    await user.keyboard("{Control>}k{/Control}")
    await user.type(screen.getByLabelText("Command palette input"), "decks")

    expect(screen.getByText("Decks")).toBeInTheDocument()
    expect(screen.queryByText("Cards")).not.toBeInTheDocument()
  })

  it("navigates to a selected item with Enter", async () => {
    const user = userEvent.setup()
    renderOmnibar()

    await user.keyboard("{Control>}k{/Control}")
    await user.type(screen.getByLabelText("Command palette input"), "decks")
    await user.keyboard("{Enter}")

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/decks")
    })
  })

  it("shows a Quick Add command for Add \"word\" input", async () => {
    const user = userEvent.setup()
    renderOmnibar()

    await user.keyboard("{Control>}k{/Control}")
    await user.type(screen.getByLabelText("Command palette input"), 'Add "ubiquitous"')

    expect(
      screen.getByText((content) => content.includes('Create card for "ubiquitous"')),
    ).toBeInTheDocument()
  })

  it("shows a Smart Filter command for forgotten words", async () => {
    const user = userEvent.setup()
    renderOmnibar()

    await user.keyboard("{Control>}k{/Control}")
    await user.type(screen.getByLabelText("Command palette input"), "words I often forget")

    expect(screen.getByText("Open Cards — forgotten / low-ease words")).toBeInTheDocument()
  })
})
