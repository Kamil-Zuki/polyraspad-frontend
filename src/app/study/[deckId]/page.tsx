"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  Settings,
  BookOpen,
  Plus,
  LayoutGrid,
  BarChart3,
  FolderOpen,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useDeck, useDeckTree } from "@/lib/react-query/queries";
import { deckQueryKeys } from "@/lib/react-query/constants";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DeckSettingsDialog } from "@/components/decks/deck-settings-dialog";
import { apiClient } from "@/lib/api";
import { AutomationJobDto, DailyAutopilotDto, DeckTreeItemDto, ZeroTouchMiningResponseDto } from "@/lib/api/types";

function getBreadcrumbPath(
  tree: DeckTreeItemDto[],
  targetId: string,
  path: DeckTreeItemDto[] = [],
): DeckTreeItemDto[] | null {
  for (const node of tree) {
    const currentPath = [...path, node];
    if (node.id === targetId) return currentPath;
    if (node.children?.length) {
      const found = getBreadcrumbPath(node.children, targetId, currentPath);
      if (found) return found;
    }
  }
  return null;
}


function DeckOverviewSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full bg-app-bg">
      <div className="h-14 glass-panel border-b border-app-border flex items-center px-8 gap-4">
        <div className="h-4 w-48 bg-app-surface rounded animate-pulse" />
        <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />
        <div className="h-4 w-32 bg-app-surface rounded animate-pulse" />
      </div>
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-8">
          <div className="h-10 w-64 bg-app-surface rounded-xl animate-pulse" />
          <div className="h-16 w-72 bg-app-surface rounded-2xl animate-pulse" />
          <div className="h-5 w-40 bg-app-surface rounded animate-pulse" />
          <div className="grid grid-cols-3 gap-4 w-full max-w-md">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-app-surface rounded-xl border border-app-border animate-pulse"
              />
            ))}
          </div>
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 w-28 bg-app-surface rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DeckOverviewPage() {
  const { deckId } = useParams();
  const router = useRouter();
  const id = Array.isArray(deckId) ? deckId[0] : (deckId ?? "");

  const {
    data: deck,
    isLoading: isDeckLoading,
    error: deckError,
  } = useDeck(id);
  const { data: deckTree } = useDeckTree(deck?.projectId ?? "");

  const breadcrumbPath = useMemo(() => {
    if (!deckTree?.length || !id) return [];
    return getBreadcrumbPath(deckTree, id) ?? [];
  }, [deckTree, id]);

  const childDecks = useMemo(() => {
    const current = breadcrumbPath.at(-1);
    return current?.children ?? [];
  }, [breadcrumbPath]);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const stats = useMemo(
    () =>
      deck?.stats
        ? {
            newCount: deck.stats.newCardsCount,
            learningCount: deck.stats.learningCardsCount,
            toReviewCount: deck.stats.dueCardsCount,
            dueToday: deck.stats.dueCardsCount,
          }
        : null,
    [deck],
  );

  const [autopilot, setAutopilot] = useState<DailyAutopilotDto | null>(null);
  const [autoImportJob, setAutoImportJob] = useState<AutomationJobDto | null>(null);
  const [importJobError, setImportJobError] = useState<string | null>(null);
  const [importJobLoading, setImportJobLoading] = useState(false);
  const [miningDrafts, setMiningDrafts] = useState<ZeroTouchMiningResponseDto | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!deck?.projectId || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const [plan, assignment] = await Promise.all([
          apiClient.automation.getDailyAutopilot(deck.projectId, id),
          apiClient.automation.getExperimentAssignment("autopilot-2026"),
        ]);
        if (cancelled) return;
        setAutopilot(plan);
        await apiClient.automation.trackExperimentEvent({
          key: assignment.key,
          variant: assignment.variant,
          eventName: "deck_overview_opened",
          projectId: deck.projectId,
          deckId: id,
        });
      } catch {
        if (!cancelled) {
          setAutopilot(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deck?.projectId, id]);

  const runAutomatedImport = async () => {
    if (!deck?.projectId || !id) return;
    setImportJobError(null);
    setImportJobLoading(true);
    setAutoImportJob(null);
    try {
      const job = await apiClient.automation.createJob({
        type: "IMPORT",
        projectId: deck.projectId,
        deckId: id,
        itemsCount: 25,
      });
      setAutoImportJob(job);
      if (job.status === "FAILED") {
        setImportJobError(job.lastError?.trim() || "Импорт не выполнен.");
        setImportJobLoading(false);
        return;
      }
      // Polling: джоб может быть RUNNING (если позже сделают async) или сразу COMPLETED
      const poll = async () => {
        let current = job;
        for (let i = 0; i < 8; i += 1) {
          if (current.status === "COMPLETED" || current.status === "FAILED") break;
          await new Promise((resolve) => setTimeout(resolve, 400));
          try {
            current = await apiClient.automation.getJob(job.id);
            setAutoImportJob(current);
          } catch {
            break;
          }
        }
        if (current.status === "FAILED") {
          setImportJobError(current.lastError?.trim() || "Импорт завершился с ошибкой.");
        } else if (current.status === "COMPLETED") {
          void queryClient.invalidateQueries({ queryKey: deckQueryKeys.deck(id) });
        }
        setImportJobLoading(false);
      };
      void poll();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Не удалось запустить импорт. Проверьте сеть и авторизацию.";
      setImportJobError(msg);
      setImportJobLoading(false);
    }
  };

  const runZeroTouchMining = async () => {
    if (!deck?.projectId) return;
    const drafts = await apiClient.automation.suggestMiningDrafts({
      projectId: deck.projectId,
      sourceTitle: deck.title,
      sourceText:
        "I finally managed to understand this tricky expression in context. The explanation was short, but memorable. Tomorrow I want to revisit it in another sentence.",
    });
    setMiningDrafts(drafts);
  };

  if (isDeckLoading) {
    return (
      <ProtectedRoute>
        <DeckOverviewSkeleton />
      </ProtectedRoute>
    );
  }

  if (deckError || !deck) {
    return (
      <ProtectedRoute>
        <div className="flex-1 flex flex-col h-full bg-app-bg items-center justify-center p-8">
          <div className="glass-panel border border-app-border rounded-2xl p-8 max-w-md text-center">
            <h2 className="text-xl font-bold text-white mb-2">
              Deck not found
            </h2>
            <p className="text-gray-400 mb-6">
              {deckError instanceof Error
                ? deckError.message
                : "This deck doesn't exist or you don't have access."}
            </p>
            <Link
              href="/library"
              className="inline-flex items-center gap-2 px-4 py-2 bg-app-surface hover:bg-app-hover border border-app-border rounded-lg text-white text-sm transition-colors"
            >
              Back to Library
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const sessionHref = `/study/${id}/session`;

  return (
    <ProtectedRoute>
      <div className="flex-1 flex flex-col h-full bg-app-bg relative">
        <main className="flex-1 overflow-y-auto custom-scroll relative">
          {/* Header */}
          <header className="h-14 glass-panel border-b border-app-border flex items-center justify-between px-8 sticky top-0 z-20 bg-app-bg/95 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm min-w-0">
              <Link
                href="/library"
                className="text-gray-400 hover:text-white transition-colors shrink-0 flex items-center gap-1.5"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Library</span>
              </Link>
              {breadcrumbPath.map((node, index) => (
                <div key={node.id} className="flex items-center gap-2 shrink-0">
                  <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />
                  {index === breadcrumbPath.length - 1 ? (
                    <span className="text-white font-medium truncate">
                      {node.title}
                    </span>
                  ) : (
                    <Link
                      href={`/study/${node.id}`}
                      className="text-gray-400 hover:text-white transition-colors truncate"
                    >
                      {node.title}
                    </Link>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              aria-label="Deck options"
              className="p-2 rounded-lg bg-app-surface hover:bg-app-hover border border-app-border text-gray-400 hover:text-white transition-colors shrink-0"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="w-5 h-5" />
            </button>
          </header>

          <DeckSettingsDialog
            deckId={id}
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            onSuccess={() => setSettingsOpen(false)}
          />

          {/* Background decor */}
          <div className="absolute top-0 left-0 w-full h-80 bg-linear-to-b from-brand-primary/5 to-transparent pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 p-8">
            <div className="max-w-2xl mx-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Title */}
              <div className="text-center mb-10 mt-4">
                <h1 className="text-3xl font-bold text-white mb-4">
                  {deck.title}
                </h1>
                {deck.description?.trim() && (
                  <p className="text-gray-400 text-sm max-w-xl mx-auto">
                    {deck.description}
                  </p>
                )}
              </div>

              {/* Hero: Study Now CTA */}
              <section className="w-full flex flex-col items-center mb-10">
                <Link
                  href={sessionHref}
                  className="relative inline-flex items-center justify-center gap-2 px-10 py-5 rounded-2xl text-lg font-semibold text-white shadow-lg transition-transform active:scale-[0.98] min-w-[240px] bg-linear-to-r from-brand-primary via-brand-primary to-brand-secondary bg-[length_200%_100%] hover:bg-right"
                >
                  <BookOpen className="w-6 h-6" />
                  Study Now
                </Link>
                <p className="mt-3 text-gray-400 text-sm">
                  {stats?.dueToday ?? 0} cards due today
                </p>
                {autopilot && (
                  <div className="mt-4 w-full max-w-xl rounded-xl border border-brand-primary/30 bg-brand-primary/10 p-4 text-left">
                    <p className="text-sm text-brand-secondary font-semibold">
                      Daily Autopilot: {autopilot.suggestedMinutes} min, {autopilot.suggestedReviews} reviews
                    </p>
                    <p className="text-xs text-gray-300 mt-1">
                      {autopilot.nextBestActions[0]?.title}: {autopilot.nextBestActions[0]?.description}
                    </p>
                  </div>
                )}
              </section>

              {/* Stats Grid */}
              <section className="grid grid-cols-3 gap-4 w-full max-w-md mb-10">
                <div className="bg-app-surface rounded-xl border border-app-border p-4 text-center glass-panel">
                  <div className="text-2xl font-bold text-brand-secondary">
                    {stats?.newCount ?? 0}
                  </div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">
                    New
                  </div>
                </div>
                <div className="bg-app-surface rounded-xl border border-app-border p-4 text-center glass-panel">
                  <div className="text-2xl font-bold text-status-error">
                    {stats?.learningCount ?? 0}
                  </div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">
                    Learning
                  </div>
                </div>
                <div className="bg-app-surface rounded-xl border border-app-border p-4 text-center glass-panel">
                  <div className="text-2xl font-bold text-status-success">
                    {stats?.toReviewCount ?? 0}
                  </div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">
                    To Review
                  </div>
                </div>
              </section>

              {/* Sub-actions */}
              <section className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={runZeroTouchMining}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-app-surface hover:bg-app-hover border border-app-border text-white text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Auto Mine
                </button>
                <button
                  type="button"
                  disabled={importJobLoading}
                  onClick={runAutomatedImport}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-app-surface hover:bg-app-hover border border-app-border text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <LayoutGrid className="w-4 h-4" />
                  {importJobLoading ? "Import…" : "Run Import Job"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/analytics")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-app-surface hover:bg-app-hover border border-app-border text-white text-sm font-medium transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  Statistics
                </button>
              </section>

              {/* Empty state */}
              {(stats?.newCount ?? 0) === 0 &&
                (stats?.learningCount ?? 0) === 0 &&
                (stats?.toReviewCount ?? 0) === 0 &&
                (deck.stats?.totalCardsCount ?? 0) === 0 && (
                <section className="mt-8 w-full max-w-md rounded-xl border border-dashed border-app-border bg-app-surface/50 p-6 text-center">
                  <p className="text-gray-400 text-sm mb-3">
                    No cards yet. Add cards manually or import to get started.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Link
                      href={`/editor?deckId=${id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary/20 hover:bg-brand-primary/30 border border-brand-primary/50 text-brand-secondary text-sm font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add card
                    </Link>
                    <Link
                      href="/import"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-app-surface hover:bg-app-hover border border-app-border text-gray-300 text-sm font-medium transition-colors"
                    >
                      <LayoutGrid className="w-4 h-4" />
                      Import
                    </Link>
                  </div>
                </section>
              )}

              {/* Child decks */}
              {childDecks.length > 0 && (
                <section className="mt-10 w-full max-w-md">
                  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Sub-decks
                  </h2>
                  <div className="grid gap-2">
                    {childDecks.map((child) => (
                      <Link
                        key={child.id}
                        href={`/study/${child.id}`}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-app-surface hover:bg-app-hover border border-app-border text-white transition-colors"
                      >
                        <span className="font-medium truncate min-w-0">{child.title}</span>
                        <span className="text-xs text-gray-500 shrink-0">
                          {child.cardCount} cards
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                      </Link>
                    ))}
                  </div>
                </section>
              )}
              {importJobError && (
                <p className="mt-4 text-sm text-status-error max-w-md text-center px-2" role="alert">
                  {importJobError}
                </p>
              )}
              {autoImportJob && (
                <p className="mt-2 text-xs text-gray-300">
                  Job {autoImportJob.type}: {autoImportJob.status} ({autoImportJob.progressPercent}%)
                </p>
              )}
              {miningDrafts && (
                <p className="mt-2 text-xs text-gray-300">
                  Zero-touch mining created {miningDrafts.totalDrafts} drafts.
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
