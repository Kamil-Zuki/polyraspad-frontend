import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { CardPreview } from "./card-preview";
import { useEditorCard } from "@/contexts/editor-card-context";
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys";

vi.mock("@/contexts/editor-card-context", () => ({
  useEditorCard: vi.fn(),
}));

const IMAGE_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("CardPreview", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(["x"], { type: "image/png" })),
      })
    );
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:mock-preview"),
      revokeObjectURL: vi.fn(),
    });

    vi.mocked(useEditorCard).mockReturnValue({
      fieldValues: {
        [SENTENCE_MINING.Expression]: "Practice memory every day.",
        [SENTENCE_MINING.Word]: "memory",
        [SENTENCE_MINING.Translation]: "память",
        [SENTENCE_MINING.Definition]: "The ability to store and recall information.",
      },
      imageId: IMAGE_UUID,
    } as unknown as ReturnType<typeof useEditorCard>);
  });

  it("renders front image from UUID imageId without template gate", async () => {
    render(<CardPreview />);

    const img = await screen.findByRole("img", { name: "Card" });
    expect(img).toHaveAttribute("src", "blob:mock-preview");
  });

  it("renders labeled back sections instead of raw template gaps", () => {
    render(<CardPreview />);

    fireEvent.click(screen.getByRole("button", { name: /^back$/i }));

    expect(screen.getByText("Translation")).toBeInTheDocument();
    expect(screen.getByText("память")).toBeInTheDocument();
    expect(screen.getByText("Definition")).toBeInTheDocument();
    expect(screen.getByText("The ability to store and recall information.")).toBeInTheDocument();
    expect(screen.queryByText(/\{\{Translation\}\}/)).not.toBeInTheDocument();
  });
});
