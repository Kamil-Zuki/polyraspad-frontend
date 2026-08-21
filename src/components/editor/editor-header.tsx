"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useProjectContext } from "@/contexts/project-context";
import { useDeckTree } from "@/lib/react-query/queries";

interface EditorHeaderProps {
  selectedDeckId: string;
  onSelectedDeckIdChange: (deckId: string) => void;
  /** Режим правки существующей карточки (?cardId=) */
  isEditMode?: boolean;
  /** Нельзя менять колоду при правке (API не переносит карту) */
  deckSelectDisabled?: boolean;
}

function flattenDeckTree(
  tree: {
    id: string;
    title: string;
    cardCount?: number;
    children?: unknown[];
  }[],
): { id: string; title: string; cardCount?: number }[] {
  const result: { id: string; title: string; cardCount?: number }[] = [];
  for (const node of tree) {
    result.push({ id: node.id, title: node.title, cardCount: node.cardCount });
    if (node.children?.length) {
      result.push(
        ...flattenDeckTree(
          node.children as {
            id: string;
            title: string;
            cardCount?: number;
            children?: unknown[];
          }[],
        ),
      );
    }
  }
  return result;
}

export function EditorHeader({
  selectedDeckId,
  onSelectedDeckIdChange,
  isEditMode = false,
  deckSelectDisabled = false,
}: EditorHeaderProps) {
  const t = useTranslations("editor");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { currentProject } = useProjectContext();
  const { data: deckTree } = useDeckTree(currentProject?.id ?? "");
  const flatDecks = deckTree ? flattenDeckTree(deckTree) : [];

  return (
    <header className="h-16 glass sticky top-0 z-20 border-b border-app-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/dashboard");
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-app-bg border border-white/10 text-gray-300 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all"
          title={tCommon("back")}
          aria-label={tCommon("back")}
        >
          <i className="fas fa-arrow-left text-sm" />
          <span className="text-sm font-medium">{tCommon("back")}</span>
        </button>
        <div className="h-6 w-px bg-app-border mx-1" />
        <h1 className="text-lg font-bold text-white tracking-tight">
          {isEditMode ? t("editTitle") : t("title")}
        </h1>
        <div className="h-6 w-px bg-app-border mx-1" />

        {/* Deck Selector */}
        <div className="flex items-center gap-2">
          <i className="fas fa-folder text-brand-primary text-sm" aria-hidden />
          <select
            value={selectedDeckId}
            onChange={(e) => onSelectedDeckIdChange(e.target.value)}
            disabled={deckSelectDisabled}
            title={
              deckSelectDisabled
                ? "You cannot change the deck while editing a card"
                : undefined
            }
            className="text-sm text-gray-300 hover:text-white bg-app-bg pl-4 pr-10 py-2.5 rounded-xl border border-white/10 hover:border-brand-primary/30 transition-all appearance-none cursor-pointer min-w-[180px] input-dark disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Select deck"
          >
            {flatDecks.length === 0 ? (
              <option value="">{t("chooseDeck")}</option>
            ) : (
              flatDecks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.title} ({deck.cardCount ?? 0})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button
          type="submit"
          form="editor-form"
          className="btn-primary px-8 py-2.5 text-sm shadow-glow shadow-brand-primary/20"
        >
          {isEditMode ? t("updateCard") : t("saveCard")}
        </button>
      </div>
    </header>
  );
}

