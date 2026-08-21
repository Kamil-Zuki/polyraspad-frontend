"use client";

import { useMemo, useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { CheckSquare, Square, Edit2, Check, X } from "lucide-react";
import { useProjectContext } from "@/contexts/project-context";
import { useProjectTerms, termListQueryKeys } from "@/lib/react-query/term-queries";
import { useDeckTree } from "@/lib/react-query/deck-queries";
import { useCreateCard } from "@/lib/react-query/card-queries";
import { apiClient } from "@/lib/api";
import type { ProjectTermListItemDto } from "@/lib/api/types";
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys";
import { useFlatDecks } from "@/hooks/use-flat-decks";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "NEW", label: "New" },
  { value: "SAVED", label: "Saved" },
  { value: "KNOWN", label: "Known" },
  { value: "IGNORED", label: "Ignored" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All" },
  { value: "WORD", label: "Word" },
  { value: "PHRASE", label: "Phrase" },
];

function statusBadgeClass(status: ProjectTermListItemDto["status"]) {
  switch (status) {
    case "NEW":
      return "bg-brand-secondary/20 text-brand-secondary border-brand-secondary/30";
    case "SAVED":
      return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    case "KNOWN":
      return "bg-white/10 text-gray-200 border-white/10";
    case "IGNORED":
      return "bg-gray-700/40 text-gray-500 border-gray-600/30";
    default:
      return "bg-white/5 text-gray-400 border-white/10";
  }
}

export function TermsTab() {
  const t = useTranslations("vocabulary");
  const { currentProject } = useProjectContext();
  const projectId = currentProject?.id ?? "";
  const queryClient = useQueryClient();

  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [detailsTerm, setDetailsTerm] = useState<ProjectTermListItemDto | null>(null);
  const [editMeaning, setEditMeaning] = useState("");
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [inlineMeaning, setInlineMeaning] = useState("");
  const [selectedTermIds, setSelectedTermIds] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);

  const { decks: flatDecks } = useFlatDecks(projectId);

  useEffect(() => {
    setPageNumber(1);
  }, [status, type, searchQuery]);

  const { data, isLoading, error } =
    useProjectTerms({
      projectId,
      status,
      type,
      q: searchQuery,
      pageNumber,
      pageSize: 50,
    });

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const hasPreviousPage = pageNumber > 1;
  const hasNextPage = pageNumber * 50 < totalCount;

  const invalidateTerms = () => {
    queryClient.invalidateQueries({
      queryKey: ["terms", "list", projectId],
    });
    queryClient.invalidateQueries({ queryKey: ["analytics", "vocabulary", projectId] });
  };

  const markKnownMutation = useMutation({
    mutationFn: (item: ProjectTermListItemDto) =>
      apiClient.terms.markKnown({
        projectId,
        termText: item.text,
        type: item.type,
        language: item.language,
      }),
    onSuccess: () => {
      setActionError(null);
      invalidateTerms();
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : "Failed to mark known"),
  });

  const ignoreMutation = useMutation({
    mutationFn: (item: ProjectTermListItemDto) =>
      apiClient.terms.ignore({
        projectId,
        termText: item.text,
        type: item.type,
        language: item.language,
      }),
    onSuccess: () => {
      setActionError(null);
      invalidateTerms();
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : "Failed to ignore term"),
  });

  const saveMeaningMutation = useMutation({
    mutationFn: (payload: { item: ProjectTermListItemDto; meaning: string }) =>
      apiClient.terms.createOrUpdate({
        projectId,
        termText: payload.item.text,
        type: payload.item.type,
        language: payload.item.language,
        status: payload.item.status,
        meaning: payload.meaning.trim() || undefined,
        firstSentence: payload.item.firstSentence ?? undefined,
        firstSourceTitle: payload.item.firstSourceTitle ?? undefined,
        firstSourceUrl: payload.item.firstSourceUrl ?? undefined,
      }),
    onSuccess: () => {
      setActionError(null);
      setDetailsTerm(null);
      setEditingTermId(null);
      invalidateTerms();
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : "Failed to save meaning"),
  });

  const createCardMutation = useCreateCard();

  const openDetails = (item: ProjectTermListItemDto) => {
    setDetailsTerm(item);
    setEditMeaning(item.meaning ?? "");
    setActionError(null);
  };

  const startInlineEdit = (item: ProjectTermListItemDto) => {
    setEditingTermId(item.termId);
    setInlineMeaning(item.meaning ?? "");
  };

  const cancelInlineEdit = () => {
    setEditingTermId(null);
    setInlineMeaning("");
  };

  const saveInlineEdit = (item: ProjectTermListItemDto) => {
    saveMeaningMutation.mutate({ item, meaning: inlineMeaning });
  };

  const handleCreateCard = async (item: ProjectTermListItemDto) => {
    const deckId = selectedDeckId || flatDecks[0]?.id;
    if (!deckId) {
      setActionError("Select a deck before creating a card.");
      return;
    }
    setActionError(null);
    try {
      await createCardMutation.mutateAsync({
        deckId,
        fieldValues: {
          [SENTENCE_MINING.Expression]: {
            stringValue: item.firstSentence?.trim() || item.text,
          },
          [SENTENCE_MINING.Word]: { stringValue: item.text },
          [SENTENCE_MINING.Translation]: { stringValue: item.meaning?.trim() || "" },
          ...(item.firstSourceTitle
            ? { [SENTENCE_MINING.SourceTitle]: { stringValue: item.firstSourceTitle } }
            : {}),
          ...(item.firstSourceUrl
            ? { [SENTENCE_MINING.SourceUrl]: { stringValue: item.firstSourceUrl } }
            : {}),
        },
      });
      invalidateTerms();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to create card");
    }
  };

  const toggleSelect = (termId: string) => {
    setSelectedTermIds((prev) => {
      const next = new Set(prev);
      if (next.has(termId)) next.delete(termId);
      else next.add(termId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTermIds.size === items.length && items.length > 0) {
      setSelectedTermIds(new Set());
    } else {
      setSelectedTermIds(new Set(items.map((i) => i.termId)));
    }
  };

  const handleBulkMarkKnown = async () => {
    const selectedItems = items.filter((i) => selectedTermIds.has(i.termId));
    for (const item of selectedItems) {
      await markKnownMutation.mutateAsync(item);
    }
    setSelectedTermIds(new Set());
  };

  const handleBulkIgnore = async () => {
    const selectedItems = items.filter((i) => selectedTermIds.has(i.termId));
    for (const item of selectedItems) {
      await ignoreMutation.mutateAsync(item);
    }
    setSelectedTermIds(new Set());
  };

  const actionPending =
    markKnownMutation.isPending ||
    ignoreMutation.isPending ||
    saveMeaningMutation.isPending ||
    createCardMutation.isPending;

  const allSelected = items.length > 0 && selectedTermIds.size === items.length;

  return (
    <>
      <div className="glass-panel rounded-2xl border border-app-border p-4 flex flex-wrap gap-4 items-end">
        <label className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{t("status.learning")} / Filter</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="block bg-app-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="block bg-app-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 flex-1 min-w-[200px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Search</span>
          <div className="flex gap-2">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setSearchQuery(searchInput.trim());
              }}
              placeholder={t("searchPlaceholder")}
              className="flex-1 bg-app-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              onClick={() => setSearchQuery(searchInput.trim())}
              className="px-4 py-2 rounded-lg bg-brand-primary/20 border border-brand-primary/40 text-brand-primary text-sm font-medium"
            >
              Search
            </button>
          </div>
        </label>
      </div>

      {selectedTermIds.size > 0 && (
        <div className="glass-panel rounded-xl border border-brand-primary/30 p-4 flex flex-wrap items-center gap-4">
          <div className="text-sm text-white font-semibold">
            {selectedTermIds.size} selected
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleBulkMarkKnown()}
              disabled={actionPending}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-gray-300 hover:bg-white/5 disabled:opacity-50"
            >
              {t("markKnown")}
            </button>
            <button
              type="button"
              onClick={() => void handleBulkIgnore()}
              disabled={actionPending}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-gray-500 hover:bg-white/5 disabled:opacity-50"
            >
              {t("ignore")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedTermIds(new Set())}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-gray-500 hover:bg-white/5"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {actionError ? (
        <div className="glass-panel rounded-xl border border-red-500/30 p-4 text-red-400 text-sm">
          {actionError}
        </div>
      ) : null}

      {isLoading ? (
        <div className="glass-panel rounded-2xl border border-app-border p-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="glass-panel rounded-2xl border border-red-500/30 p-6 text-red-400">
          {error instanceof Error ? error.message : "Failed to load vocabulary"}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-app-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-app-border text-left text-[10px] uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3 font-bold w-10">
                    <button type="button" onClick={toggleSelectAll} className="hover:text-white">
                      {allSelected ? <CheckSquare className="h-4 w-4 text-brand-primary" /> : <Square className="h-4 w-4" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-bold">{t("term")} & {t("meaning")}</th>
                  <th className="px-4 py-3 font-bold">{t("statusDistribution")}</th>
                  <th className="px-4 py-3 font-bold">{t("cardsCount")}</th>
                  <th className="px-4 py-3 font-bold">{t("context")}</th>
                  <th className="px-4 py-3 font-bold">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      {t("noTerms")}
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.termId} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => toggleSelect(item.termId)}>
                          {selectedTermIds.has(item.termId) ? (
                            <CheckSquare className="h-4 w-4 text-brand-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{item.text}</div>
                        {editingTermId === item.termId ? (
                          <div className="flex items-center gap-1 mt-1">
                            <input
                              type="text"
                              value={inlineMeaning}
                              onChange={(e) => setInlineMeaning(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveInlineEdit(item);
                                if (e.key === "Escape") cancelInlineEdit();
                              }}
                              className="bg-app-bg border border-brand-primary/50 rounded px-2 py-0.5 text-xs text-white"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => saveInlineEdit(item)}
                              className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={cancelInlineEdit}
                              className="p-1 text-gray-400 hover:bg-white/10 rounded"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => startInlineEdit(item)}
                            className="group flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 cursor-pointer mt-0.5"
                            title="Click to edit meaning"
                          >
                            <span>{item.meaning || "— add meaning —"}</span>
                            <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 text-brand-primary transition-opacity" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider",
                            statusBadgeClass(item.status)
                          )}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 tabular-nums">
                        {(item.relatedCardCount ?? 0) > 0 ? item.relatedCardCount : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-400 max-w-md truncate" title={item.firstSentence ?? ""}>
                        {item.firstSentence ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-row items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openDetails(item)}
                            className="px-2 py-1 rounded-md border border-white/10 text-xs text-gray-300 hover:bg-white/5"
                          >
                            {t("details")}
                          </button>
                          {item.status !== "KNOWN" && item.status !== "IGNORED" ? (
                            <>
                              {(item.relatedCardCount ?? 0) === 0 ? (
                                <button
                                  type="button"
                                  disabled={actionPending || flatDecks.length === 0}
                                  onClick={() => void handleCreateCard(item)}
                                  className="px-2 py-1 rounded-md border border-brand-primary/40 text-xs text-brand-primary hover:bg-brand-primary/10 disabled:opacity-50"
                                >
                                  {t("createCard")}
                                </button>
                              ) : null}
                              <button
                                type="button"
                                disabled={actionPending}
                                onClick={() => markKnownMutation.mutate(item)}
                                className="px-2 py-1 rounded-md border border-white/10 text-xs text-gray-300 hover:bg-white/5 disabled:opacity-50"
                              >
                                {t("markKnown")}
                              </button>
                              <button
                                type="button"
                                disabled={actionPending}
                                onClick={() => ignoreMutation.mutate(item)}
                                className="px-2 py-1 rounded-md border border-white/10 text-xs text-gray-500 hover:bg-white/5 disabled:opacity-50"
                              >
                                {t("ignore")}
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalCount > 0 && (
            <div className="p-4 border-t border-app-border flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {totalCount} term{totalCount !== 1 ? "s" : ""}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  disabled={!hasPreviousPage}
                  className="px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPageNumber((p) => p + 1)}
                  disabled={!hasNextPage}
                  className="px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {detailsTerm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-app-border p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">{detailsTerm.text}</h2>
                <p className="text-sm text-gray-400 mt-1">{detailsTerm.status}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailsTerm(null)}
                className="text-gray-500 hover:text-white"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {detailsTerm.firstSentence ? (
              <p className="text-sm text-gray-300">{detailsTerm.firstSentence}</p>
            ) : null}
            <label className="block space-y-1" htmlFor="vocab-meaning">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Meaning</span>
              <textarea
                id="vocab-meaning"
                value={editMeaning}
                onChange={(e) => setEditMeaning(e.target.value)}
                rows={3}
                className="w-full bg-app-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
            </label>
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDetailsTerm(null)}
                className="px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saveMeaningMutation.isPending}
                onClick={() => saveMeaningMutation.mutate({ item: detailsTerm, meaning: editMeaning })}
                className="px-4 py-2 rounded-lg bg-brand-primary/20 border border-brand-primary/40 text-brand-primary text-sm disabled:opacity-50"
              >
                Save meaning
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
