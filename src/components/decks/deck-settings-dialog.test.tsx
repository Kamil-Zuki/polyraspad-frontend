/**
 * Deck cover file upload — red stage.
 * When user selects an image file, uploadImage is called, URL is set as coverImageUrl,
 * and on submit updateDeck receives it.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DeckSettingsDialog } from "./deck-settings-dialog";
import { ContributionPolicyDto } from "@/lib/api/types";

const mockMutateAsync = vi.fn();

const mockDeckData = {
  id: "deck-1",
  projectId: "proj-1",
  title: "Test Deck",
  description: "",
  coverImageUrl: "",
  isPublic: false,
  contributionPolicy: ContributionPolicyDto.Open,
  licenseType: 0,
  ownerId: "user-1",
  cardCount: 0,
  createdAt: "",
};

vi.mock("@/lib/react-query/queries", () => ({
  useDeck: () => ({
    data: mockDeckData,
    isLoading: false,
  }),
  useUpdateDeck: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/lib/api/media-client", () => ({
  uploadImage: vi.fn().mockResolvedValue({
    url: "https://uploaded.example/cover.png",
  }),
}));

function renderDeckSettingsDialog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <DeckSettingsDialog
        deckId="deck-1"
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    </QueryClientProvider>,
  );
}

describe("DeckSettingsDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it("should_set_coverImageUrl_from_uploaded_file_when_user_selects_image", async () => {
    const { uploadImage } = await import("@/lib/api/media-client");
    mockMutateAsync.mockResolvedValue(undefined);

    const { container } = renderDeckSettingsDialog();

    // 1. Find the cover image file upload input
    const fileInput = container.querySelector(
      'input[type="file"][accept*="image"]',
    );
    expect(fileInput).toBeInTheDocument();

    // 2. User selects a file
    const file = new File(["image content"], "cover.png", {
      type: "image/png",
    });
    fireEvent.change(fileInput!, { target: { files: [file] } });

    // 3. uploadImage is called with the selected file
    await vi.waitFor(() => {
      expect(uploadImage).toHaveBeenCalledWith(file);
    });

    // 4. User submits form
    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    // 5. updateDeck receives coverImageUrl from uploaded file
    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "deck-1",
          data: expect.objectContaining({
            coverImageUrl: "https://uploaded.example/cover.png",
          }),
        }),
      );
    });
  });

  it("should_save_coverImageUrl_from_pasted_url_when_user_enters_url", async () => {
    mockMutateAsync.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderDeckSettingsDialog();

    const urlInput = screen.getByPlaceholderText("https://...");
    const pastedUrl = "https://example.com/cover.png";
    await user.clear(urlInput);
    await user.type(urlInput, pastedUrl);

    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "deck-1",
          data: expect.objectContaining({
            coverImageUrl: pastedUrl,
          }),
        }),
      );
    });
  });
});
