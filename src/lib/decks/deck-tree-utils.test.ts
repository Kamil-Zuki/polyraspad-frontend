import { describe, expect, it } from "vitest";
import { findDeckIdByTitleInTree } from "./deck-tree-utils";

describe("findDeckIdByTitleInTree", () => {
  it("finds deck by case-insensitive title in nested tree", () => {
    const id = findDeckIdByTitleInTree(
      [
        {
          id: "outer",
          title: "Courses",
          cardCount: 0,
          children: [
            { id: "inbox-id", title: "Inbox", cardCount: 2, children: [] },
          ],
        },
      ],
      "inbox"
    );
    expect(id).toBe("inbox-id");
  });

  it("returns null when missing", () => {
    expect(findDeckIdByTitleInTree([], "Inbox")).toBeNull();
  });
});
