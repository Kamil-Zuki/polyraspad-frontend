import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDeckTree } from "./deck-queries";
import { apiClient } from "../api";

vi.mock("../api", () => ({
  apiClient: {
    decks: {
      getDeckTree: vi.fn(),
    },
  },
}));

function renderUseDeckTree(projectId: string, libraryFilter?: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const getDeckTreeMock = vi.mocked(apiClient.decks.getDeckTree);

  function TestConsumer() {
    const useDeckTreeWithFilter = useDeckTree as (
      projectId: string,
      libraryFilter?: string
    ) => ReturnType<typeof useDeckTree>;
    useDeckTreeWithFilter(projectId, libraryFilter);
    return null;
  }

  render(
    <QueryClientProvider client={queryClient}>
      <TestConsumer />
    </QueryClientProvider>
  );

  return { queryClient, getDeckTreeMock };
}

describe("useDeckTree", () => {
  beforeEach(() => {
    vi.mocked(apiClient.decks.getDeckTree).mockResolvedValue([]);
  });

  it("should_include_filter_in_queryKey_and_call_client_with_filter_when_useDeckTree_called_with_mine", async () => {
    const projectId = "proj-1";
    const { queryClient, getDeckTreeMock } = renderUseDeckTree(
      projectId,
      "mine"
    );

    await waitFor(() => {
      expect(getDeckTreeMock).toHaveBeenCalled();
    });

    expect(getDeckTreeMock).toHaveBeenCalledWith(
      projectId,
      expect.objectContaining({ libraryFilter: "Mine" })
    );

    const cache = queryClient.getQueryCache();
    const treeQuery = cache.findAll({ queryKey: ["decks", "tree"] })[0];
    expect(treeQuery).toBeDefined();
    expect(treeQuery?.queryKey).toContain("Mine");
  });
});
