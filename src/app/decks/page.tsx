"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, ListTree } from "lucide-react";
import { useTranslations } from "next-intl";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { CreateDeckDialog } from "@/components/decks/create-deck-dialog";
import { DeckTreeView } from "@/components/decks/deck-tree-view";
import { MoveDeckDialog } from "@/components/decks/move-deck-dialog";
import { DeckGalleryView, flattenDecks, collectSubtree } from "@/components/decks/deck-gallery-view";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useProjectContext } from "@/contexts/project-context";
import {
  useDeckTree,
  useCreateDeck,
  useUpdateDeck,
  useDeleteDeck,
} from "@/lib/react-query/queries";
import { DeckTreeItemDto } from "@/lib/api/types";
import { cn } from "@/lib/utils";

// Helper function to find a node by ID in the tree
function findNodeById(
  tree: DeckTreeItemDto[],
  id: string,
): DeckTreeItemDto | null {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children && node.children.length > 0) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

const ENABLE_ADVANCED_MODULES = process.env.NEXT_PUBLIC_FF_ADVANCED_MODULES === "true";

export default function DecksPage() {
  const t = useTranslations("decks");
  const tCommon = useTranslations("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"tree" | "gallery">("gallery");
  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState<string | null>(null);
  const [isCreateDeckOpen, setIsCreateDeckOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [editingDeck, setEditingDeck] = useState<DeckTreeItemDto | null>(null);
  const [movingDeck, setMovingDeck] = useState<DeckTreeItemDto | null>(null);
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null);
  const router = useRouter();
  // Filter: Мои / Скачанные / Публичные (Docs: libraryFilter query param on GET /api/Decks/tree/{projectId})
  const [libraryFilter, setLibraryFilter] = useState<
    "mine" | "downloaded" | "public"
  >("mine");
  const { currentProject } = useProjectContext();
  const projectId = currentProject?.id ?? "";
  const {
    data: deckTree,
    isLoading,
    error,
    refetch,
  } = useDeckTree(projectId, libraryFilter);

  // Mutation hooks for deck operations
  const createDeckMutation = useCreateDeck();
  const updateDeckMutation = useUpdateDeck();
  const deleteDeckMutation = useDeleteDeck();

  // Filter tree by search query (matches title on any node, keeps matched parents expanded implicitly)
  const filterTree = useCallback(
    (nodes: DeckTreeItemDto[]): DeckTreeItemDto[] => {
      if (!searchQuery.trim()) return nodes;
      const query = searchQuery.toLowerCase();
      return nodes
        .map((node) => {
          const matchingChildren = filterTree(node.children);
          const matchesSelf = node.title.toLowerCase().includes(query);
          if (matchesSelf) {
            return { ...node, children: matchingChildren.length ? matchingChildren : node.children };
          }
          if (matchingChildren.length) {
            return { ...node, children: matchingChildren };
          }
          return null;
        })
        .filter((n): n is DeckTreeItemDto => n !== null);
    },
    [searchQuery],
  );

  const filteredTree = useMemo(() => {
    if (!deckTree) return [];
    return filterTree(deckTree);
  }, [deckTree, filterTree]);

  const selectedNode = useMemo(
    () => (selectedTreeNodeId ? findNodeById(filteredTree, selectedTreeNodeId) : null),
    [filteredTree, selectedTreeNodeId],
  );

  useEffect(() => {
    if (selectedTreeNodeId && !findNodeById(filteredTree, selectedTreeNodeId)) {
      setSelectedTreeNodeId(null);
    }
  }, [filteredTree, selectedTreeNodeId]);

  const galleryDecks = useMemo(() => {
    let source = selectedTreeNodeId
      ? collectSubtree(filteredTree, selectedTreeNodeId)
      : flattenDecks(filteredTree);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      source = source.filter((d) => d.title.toLowerCase().includes(q));
    }
    return source;
  }, [filteredTree, selectedTreeNodeId, searchQuery]);

  const handleCreateDeck = () => {
    setCreateParentId(null);
    setIsCreateDeckOpen(true);
  };

  const handleCreateChild = (parentId: string) => {
    setCreateParentId(parentId);
    setIsCreateDeckOpen(true);
  };

  const handleDeckDialogClose = () => {
    setIsCreateDeckOpen(false);
    setEditingDeck(null);
    setCreateParentId(null);
    refetch(); // Refresh deck tree after creation
  };

  const handleDeckEdit = (deck: DeckTreeItemDto) => {
    setEditingDeck(deck);
    setIsCreateDeckOpen(true); // Use same dialog for editing
  };

  const handleDeckMove = (deck: DeckTreeItemDto) => {
    setMovingDeck(deck);
  };

  const handleMoveDeckClose = () => {
    setMovingDeck(null);
  };

  const handleMoveDeck = async (parentDeckId: string | null) => {
    if (!movingDeck) return;
    try {
      await updateDeckMutation.mutateAsync({
        id: movingDeck.id,
        data: { parentDeckId },
      });
    } catch (error) {
      console.error("Failed to move deck:", error);
      throw error;
    }
  };

  const handleDeckDelete = (deckId: string) => {
    setDeletingDeckId(deckId);
  };

  const handleConfirmDeckDelete = async () => {
    if (!deletingDeckId) return;
    try {
      await deleteDeckMutation.mutateAsync(deletingDeckId);
      refetch();
    } catch (error) {
      console.error("Failed to delete deck:", error);
    } finally {
      setDeletingDeckId(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex-1 flex flex-col h-full bg-app-bg relative">
        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto relative custom-scroll">
          {/* Actions Bar - First element in scrollable content */}
          <div className="sticky top-0 z-20 flex h-14 flex-wrap items-center justify-between gap-2 border-b border-app-border bg-app-bg/95 px-4 py-2 glass-panel backdrop-blur-sm md:px-8 md:py-0">
            <div className="flex items-center gap-4">
              {/* Page title */}
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <i className="fas fa-th-large" />
                <span className="font-medium">{t("title")}</span>
              </div>
              {/* Library filters (IA). Filtering applies when tree API includes ownerId, isPublic, forkedFromId. */}
              {ENABLE_ADVANCED_MODULES && (
                <div className="flex items-center rounded-lg border border-app-border bg-app-surface/50 p-0.5">
                  {[
                    { value: "mine" as const, label: "Mine" },
                    { value: "downloaded" as const, label: "Downloaded" },
                    { value: "public" as const, label: "Public" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setLibraryFilter(value)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        libraryFilter === value
                          ? "bg-brand-primary/20 text-brand-primary border border-brand-primary/30"
                          : "text-gray-400 hover:text-white border border-transparent"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* View mode toggle */}
              <div className="flex items-center rounded-lg border border-app-border bg-app-surface/50 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("gallery")}
                  title="Gallery view"
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    viewMode === "gallery"
                      ? "bg-brand-primary/20 text-brand-primary border border-brand-primary/30"
                      : "text-gray-400 hover:text-white border border-transparent"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" /> Gallery
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("tree")}
                  title="Tree view"
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    viewMode === "tree"
                      ? "bg-brand-primary/20 text-brand-primary border border-brand-primary/30"
                      : "text-gray-400 hover:text-white border border-transparent"
                  }`}
                >
                  <ListTree className="h-3.5 w-3.5" /> Tree
                </button>
              </div>
            </div>

            {/* Search & Add */}
            <div className="flex items-center gap-3">
              <div className="relative group">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-brand-primary transition-colors text-xs" />
                <input
                  type="text"
                  placeholder={t("searchDecks")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-app-bg border border-app-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:border-brand-primary focus:outline-none w-40 transition-all focus:w-56"
                />
              </div>
              <button
                onClick={handleCreateDeck}
                className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg"
              >
                <i className="fas fa-plus text-[10px]" /> {t("createDeck")}
              </button>
            </div>
          </div>

          {/* Background Decor */}
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />

          {/* Content Area */}
          <div className="p-4 md:p-8 relative z-10">
            {viewMode === "tree" ? (
              <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2.5">
                    <i className="fas fa-hexagon text-brand-primary" />
                    DECK TREE
                  </h2>
                  <span className="text-xs text-gray-500">
                    {deckTree?.length ?? 0} top-level {deckTree?.length === 1 ? "group" : "groups"}
                  </span>
                </div>

                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-12 rounded-xl bg-app-surface/50 border border-app-border animate-pulse"
                      />
                    ))}
                  </div>
                ) : error ? (
                  <div className="p-6 glass-panel border-red-500/30 rounded-2xl">
                    <div className="text-red-400">
                      Error loading decks:{" "}
                      {error instanceof Error ? error.message : "Unknown error"}
                    </div>
                  </div>
                ) : filteredTree.length === 0 ? (
                  <button
                    onClick={handleCreateDeck}
                    className="w-full bg-app-surface/30 border-2 border-dashed border-white/5 rounded-xl min-h-[180px] flex flex-col items-center justify-center gap-4 group hover:border-brand-primary/40 hover:bg-app-surface/50 transition-all duration-300"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-app-bg border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <i className="fas fa-plus text-gray-600 group-hover:text-brand-primary transition-colors text-2xl" />
                    </div>
                    <div className="text-center">
                      <div className="text-white font-bold text-sm mb-1">
                        Create New Deck
                      </div>
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest px-6 leading-relaxed">
                        Organize your next learning goal
                      </p>
                    </div>
                  </button>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-[#0d0d10]/50 p-4">
                    <DeckTreeView
                      tree={filteredTree}
                      onSelect={(deck) => router.push(`/study/${deck.id}`)}
                      onEdit={handleDeckEdit}
                      onDelete={handleDeckDelete}
                      onCreateChild={handleCreateChild}
                      onMove={handleDeckMove}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-6 animate-in fade-in duration-300">
                {/* Left: folder tree */}
                <aside className="hidden md:flex w-72 shrink-0 flex-col">
                  <div className="sticky top-20 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Folders
                      </h3>
                      {selectedTreeNodeId && (
                        <button
                          type="button"
                          onClick={() => setSelectedTreeNodeId(null)}
                          className="text-[10px] text-gray-400 hover:text-white transition"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedTreeNodeId(null)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition border",
                        !selectedTreeNodeId
                          ? "bg-brand-primary/10 text-brand-primary border-brand-primary/20"
                          : "text-gray-400 hover:bg-white/5 hover:text-white border-transparent"
                      )}
                    >
                      All decks
                    </button>

                    <div className="rounded-2xl border border-white/10 bg-[#0d0d10]/50 p-3 max-h-[calc(100vh-220px)] overflow-y-auto custom-scroll">
                      {isLoading ? (
                        <div className="space-y-2">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="h-10 rounded-xl bg-app-surface/50 border border-app-border animate-pulse"
                            />
                          ))}
                        </div>
                      ) : error ? (
                        <div className="p-3 text-xs text-red-400">
                          {error instanceof Error ? error.message : "Unknown error"}
                        </div>
                      ) : filteredTree.length === 0 ? (
                        <p className="text-xs text-gray-500 p-2">No decks</p>
                      ) : (
                        <DeckTreeView
                          tree={filteredTree}
                          onSelect={(deck) => setSelectedTreeNodeId(deck.id)}
                          mode="navigate"
                          selectedId={selectedTreeNodeId}
                        />
                      )}
                    </div>
                  </div>
                </aside>

                {/* Right: gallery */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {selectedNode ? selectedNode.title : "All decks"}
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {galleryDecks.length} deck{galleryDecks.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="md:hidden">
                      {/* Mobile folder selector placeholder */}
                      <span className="text-xs text-gray-500">
                        Use Tree view to browse folders
                      </span>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="aspect-[4/3] rounded-2xl bg-app-surface/50 border border-app-border animate-pulse"
                        />
                      ))}
                    </div>
                  ) : error ? (
                    <div className="p-6 glass-panel border-red-500/30 rounded-2xl">
                      <div className="text-red-400">
                        Error loading decks:{" "}
                        {error instanceof Error ? error.message : "Unknown error"}
                      </div>
                    </div>
                  ) : galleryDecks.length === 0 ? (
                    <button
                      onClick={handleCreateDeck}
                      className="w-full bg-app-surface/30 border-2 border-dashed border-white/5 rounded-xl min-h-[180px] flex flex-col items-center justify-center gap-4 group hover:border-brand-primary/40 hover:bg-app-surface/50 transition-all duration-300"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-app-bg border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <i className="fas fa-plus text-gray-600 group-hover:text-brand-primary transition-colors text-2xl" />
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold text-sm mb-1">
                          Create New Deck
                        </div>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest px-6 leading-relaxed">
                          Organize your next learning goal
                        </p>
                      </div>
                    </button>
                  ) : (
                    <DeckGalleryView
                      decks={filteredTree}
                      selectedId={selectedTreeNodeId}
                      onSelect={(deck) => router.push(`/study/${deck.id}`)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Create/Edit Deck Dialog */}
        {currentProject && (
          <>
            <CreateDeckDialog
              isOpen={isCreateDeckOpen}
              onClose={handleDeckDialogClose}
              projectId={currentProject.id}
              parentDeckId={createParentId}
              deckId={editingDeck?.id}
              initialData={
                editingDeck
                  ? {
                      title: editingDeck.title,
                      coverImageUrl: editingDeck.coverImageUrl,
                    }
                  : undefined
              }
              isEditing={!!editingDeck}
              onEditSubmit={
                editingDeck
                  ? async (formData) => {
                      try {
                        await updateDeckMutation.mutateAsync({
                          id: editingDeck.id,
                          data: {
                            title: formData.title,
                            description: formData.description || null,
                            coverImageUrl: formData.coverImageUrl || null,
                            isPublic: formData.isPublic,
                            contributionPolicy: formData.contributionPolicy,
                          },
                        });
                        handleDeckDialogClose();
                      } catch (error) {
                        console.error("Failed to update deck:", error);
                      }
                    }
                  : undefined
              }
            />
            <MoveDeckDialog
              deck={movingDeck}
              tree={deckTree || []}
              isOpen={movingDeck !== null}
              onClose={handleMoveDeckClose}
              onMove={handleMoveDeck}
            />
            <ConfirmDialog
              isOpen={Boolean(deletingDeckId)}
              onClose={() => setDeletingDeckId(null)}
              onConfirm={handleConfirmDeckDelete}
              title="Delete this deck?"
              description="All cards and sub-decks will be permanently deleted."
              variant="destructive"
              isLoading={deleteDeckMutation.isPending}
            />
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
