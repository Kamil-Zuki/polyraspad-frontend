import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DeckClient } from "./deck-client";
import type { DeckTreeItemDto } from "./types";

describe("DeckClient", () => {
  let client: DeckClient;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    client = new DeckClient();
    fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it("should_request_url_containing_libraryFilter_Mine_when_getDeckTree_called_with_libraryFilter_Mine", async () => {
    const projectId = "proj-1";
    await client.getDeckTree(projectId, { libraryFilter: "Mine" });

    const calledUrl = fetchSpy.mock.calls[0]?.[0];
    expect(typeof calledUrl).toBe("string");
    expect(calledUrl).toContain("libraryFilter=Mine");
  });
});
