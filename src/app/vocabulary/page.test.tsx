import { vi, describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, within, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import VocabularyPage from "./page";

const mocks = vi.hoisted(() => ({
  markKnownMock: vi.fn().mockResolvedValue({}),
  ignoreMock: vi.fn().mockResolvedValue({}),
  createOrUpdateMock: vi.fn().mockResolvedValue({}),
  createCardMock: vi.fn().mockResolvedValue({ id: "card-1" }),
}));

vi.mock("@/contexts/project-context", () => ({
  useProjectContext: () => ({
    currentProject: { id: "proj-1", title: "English" },
  }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/vocabulary",
}));

vi.mock("@/lib/react-query/analytics-queries", () => ({
  useVocabularyStats: () => ({
    data: { totalTerms: 1, newCount: 0, learningCount: 1, matureCount: 0, estimatedFluency: 0, cefrLevel: null },
  }),
}));

vi.mock("@/lib/react-query/term-queries", () => ({
  useProjectTermsInfinite: () => ({
    data: {
      pages: [
        {
          items: [
            {
              termId: "term-1",
              text: "memory",
              normalizedText: "memory",
              type: "WORD",
              language: "en",
              status: "SAVED",
              meaning: "to recall information",
              firstSentence: "Memory fades quickly.",
              relatedCardCount: 0,
              updatedAt: "2026-01-01T00:00:00Z",
            },
          ],
          nextCursor: null,
        },
      ],
    },
    isLoading: false,
    error: null,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  }),
  termListQueryKeys: {
    list: (...parts: unknown[]) => ["terms", ...parts],
  },
}));

vi.mock("@/lib/react-query/deck-queries", () => ({
  useDeckTree: () => ({
    data: [{ id: "deck-1", title: "Main Deck", children: [] }],
  }),
}));

vi.mock("@/lib/react-query/card-queries", () => ({
  useCreateCard: () => ({
    mutateAsync: mocks.createCardMock,
    isPending: false,
  }),
}));

vi.mock("@/lib/api", () => ({
  apiClient: {
    terms: {
      markKnown: async (data: unknown) => mocks.markKnownMock(data),
      ignore: async (data: unknown) => mocks.ignoreMock(data),
      createOrUpdate: async (data: unknown) => mocks.createOrUpdateMock(data),
    },
  },
}));

describe("VocabularyPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  function renderPage() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <VocabularyPage />
      </QueryClientProvider>
    );
  }

  it("renders vocabulary heading and term list", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: /title|vocabulary/i })).toBeInTheDocument();
    expect(screen.getByText("memory")).toBeInTheDocument();
  });

  it("shows create card action for saved term without related cards", () => {
    renderPage();

    expect(screen.getByRole("button", { name: /create card|createCard/i })).toBeInTheDocument();
  });

  it("calls markKnown when Known is clicked", async () => {
    renderPage();

    const table = screen.getByRole("table");
    const knownButton = within(table).getByRole("button", { name: /^Known$|markKnown/i });
    expect(knownButton).not.toBeDisabled();
    fireEvent.click(knownButton);

    await waitFor(() => {
      expect(mocks.markKnownMock).toHaveBeenCalledWith({
        projectId: "proj-1",
        termText: "memory",
        type: "WORD",
        language: "en",
      });
    });
  });

  it("opens details and saves meaning", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /details/i }));
    expect(screen.getByRole("heading", { name: "memory" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/meaning/i), { target: { value: "recall" } });
    fireEvent.click(screen.getByRole("button", { name: /save meaning/i }));

    await waitFor(() => {
      expect(mocks.createOrUpdateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: "proj-1",
          termText: "memory",
          meaning: "recall",
        })
      );
    });
  });
});
