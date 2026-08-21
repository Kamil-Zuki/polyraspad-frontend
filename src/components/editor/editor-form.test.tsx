/**
 * Тесты редактора карточек: Ctrl+S сохранение, подстановка Target по выделению в Sentence.
 * Mock API и провайдеры.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EditorForm } from "./editor-form";
import { EditorCardProvider } from "@/contexts/editor-card-context";
import { EditorLanguageProvider } from "@/contexts/editor-language-context";
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys";

// Мок: создание карточки через API
const mockMutateAsync = vi.fn();
vi.mock("@/lib/react-query/queries", () => ({
  useCreateCard: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useUpdateCard: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useCard: () => ({
    data: undefined,
  }),
  useDeckTree: () => ({
    data: [{ id: "deck-1", title: "Test Deck", children: [] }],
  }),
  useNoteTypeForEditor: () => ({
    data: undefined,
    isLoading: false,
  }),
}));

vi.mock("@/contexts/project-context", () => ({
  useProjectContext: () => ({ currentProject: { id: "proj-1" } }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api/media-client", () => ({
  uploadImage: vi.fn().mockResolvedValue({ url: "https://example.com/img.png", imageId: "img-1" }),
  generateAudio: vi.fn(),
  formatGenerateAudioUserMessage: vi.fn(),
}));

vi.mock("@/lib/editor/use-editor-card-tools", () => ({
  useEditorCardTools: () => ({
    isTranslating: false,
    isLookingUpDictionary: false,
    isGeneratingAudio: false,
    isAiBusy: false,
    lastError: null,
    editorAiProvider: "openai-compatible",
    ollamaModel: "gpt-4o-mini",
    aiModels: ["gpt-4o-mini"],
    aiLoadError: null,
    clearError: vi.fn(),
    translateWithTranslator: vi.fn(),
    translateWithAi: vi.fn(),
    lookupDictionary: vi.fn(),
    generateCardAudio: vi.fn(),
  }),
}));

// Подавить alert в тестах
const originalAlert = global.alert;
beforeEach(() => {
  vi.clearAllMocks();
  global.alert = vi.fn();
});
afterEach(() => {
  global.alert = originalAlert;
});

function renderEditorForm(props?: { selectedDeckId?: string; onSelectedDeckIdChange?: (id: string) => void }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <EditorCardProvider>
        <EditorLanguageProvider>
          <EditorForm
            selectedDeckId={props?.selectedDeckId ?? "deck-1"}
            onSelectedDeckIdChange={props?.onSelectedDeckIdChange}
          />
        </EditorLanguageProvider>
      </EditorCardProvider>
    </QueryClientProvider>,
  );
}

describe("EditorForm", () => {
  describe("should_save_card_when_user_presses_ctrl_s", () => {
    it("сохраняет карточку по Ctrl+S без перезагрузки страницы", async () => {
      mockMutateAsync.mockResolvedValue(undefined);
      renderEditorForm();

      const sentenceInput = screen.getByTestId("sentence-input");
      const targetInput = screen.getByTestId("target-input");
      const translationInput = screen.getByPlaceholderText(/translation/i);

      fireEvent.change(sentenceInput, { target: { value: "He decided to address the issue." } });
      fireEvent.change(targetInput, { target: { value: "address" } });
      fireEvent.change(translationInput, { target: { value: "заняться (проблемой)" } });

      // Имитация Ctrl+S
      fireEvent.keyDown(document, { key: "s", ctrlKey: true, preventDefault: vi.fn() });

      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(1);
      });
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          deckId: "deck-1",
          fieldValues: {
            [SENTENCE_MINING.Expression]: { stringValue: "He decided to address the issue." },
            [SENTENCE_MINING.Word]: { stringValue: "address" },
            [SENTENCE_MINING.Translation]: { stringValue: "заняться (проблемой)" },
          },
        }),
      );
    });
  });

  describe("should_set_target_from_sentence_selection_when_user_selects_text", () => {
    it("подставляет выбранное слово в поле Target при выделении в Sentence", () => {
      renderEditorForm();

      // В Strict Mode может быть несколько инстансов — берём первый
      const sentenceInput = screen.getAllByTestId("sentence-input")[0] as HTMLTextAreaElement;
      const targetInput = screen.getAllByTestId("target-input")[0] as HTMLInputElement;

      fireEvent.change(sentenceInput, { target: { value: "Success is inevitable." } });
      expect(targetInput.value).toBe("");

      // Симулируем выделение слова "inevitable" (позиции 11–21)
      sentenceInput.setSelectionRange(11, 21);
      fireEvent.select(sentenceInput);

      expect(targetInput.value).toBe("inevitable");
    });

    it("подставляет выбранную фразу в поле Target при выделении нескольких слов", () => {
      renderEditorForm();

      const sentenceInput = screen.getAllByTestId("sentence-input")[0] as HTMLTextAreaElement;
      const targetInput = screen.getAllByTestId("target-input")[0] as HTMLInputElement;

      fireEvent.change(sentenceInput, { target: { value: "He decided to address the issue." } });
      sentenceInput.setSelectionRange(11, 25); // "to address the" (end exclusive)
      fireEvent.select(sentenceInput);

      expect(targetInput.value).toBe("to address the");
    });
  });
});
