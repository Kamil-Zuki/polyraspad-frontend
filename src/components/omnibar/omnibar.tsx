"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  CornerDownLeft,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useProjectContext } from "@/contexts/project-context"
import { useOmnibar } from "@/contexts/omnibar-context"
import { useCreateCard } from "@/lib/react-query/card-queries"
import { useDeckTree } from "@/lib/react-query/deck-queries"
import { findDeckIdByTitleInTree } from "@/lib/decks/deck-tree-utils"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

import { buildQuickAddCardPatch, patchToCreateCardFieldValues } from "./quick-add-card"
import { useOmnibarItems, type OmnibarItem, type QuickAddState } from "./use-omnibar-items"

function groupBadge(type: OmnibarItem["type"]) {
  switch (type) {
    case "quick-add":
      return "AI Quick Add"
    case "smart-filter":
      return "Smart Filter"
    case "suggested":
      return "Suggested"
    case "recent":
      return "Recent"
    default:
      return undefined
  }
}

export function Omnibar() {
  const { isOpen, close } = useOmnibar()
  const { currentProject } = useProjectContext()
  const { data: deckTree } = useDeckTree(currentProject?.id ?? "")
  const createCard = useCreateCard()

  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [quickAddState, setQuickAddState] = useState<QuickAddState>({ status: "idle" })

  const inputRef = useRef<HTMLInputElement>(null)

  const handleRunQuickAdd = useCallback(
    async (term: string) => {
      if (!currentProject) return

      setQuickAddState({ status: "loading", term })

      try {
        const patch = await buildQuickAddCardPatch({
          term,
          sourceLang: currentProject.sourceLang,
          targetLang: currentProject.targetLang,
        })

        const inboxDeckId = findDeckIdByTitleInTree(deckTree, "Inbox")
        if (!inboxDeckId) {
          throw new Error("No Inbox deck found. Create a deck named \"Inbox\" first.")
        }

        await createCard.mutateAsync({
          deckId: inboxDeckId,
          fieldValues: patchToCreateCardFieldValues(patch),
        })

        setQuickAddState({ status: "success", term })
        window.setTimeout(() => {
          close()
          setQuickAddState({ status: "idle" })
        }, 1200)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create card"
        setQuickAddState({ status: "error", term, error: message })
        toast.error(message)
      }
    },
    [currentProject, deckTree, createCard, close],
  )

  const groups = useOmnibarItems(query, quickAddState, handleRunQuickAdd)
  const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups])

  // Reset selection whenever the query or results change.
  useEffect(() => {
    setSelectedIndex((prev) => Math.min(prev, Math.max(0, allItems.length - 1)))
  }, [allItems.length, query])

  // Focus the input when the palette opens.
  useEffect(() => {
    if (isOpen) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 50)
      return () => window.clearTimeout(id)
    }
  }, [isOpen])

  // Reset transient state when the palette closes.
  useEffect(() => {
    if (!isOpen) {
      const id = window.setTimeout(() => {
        setQuery("")
        setQuickAddState({ status: "idle" })
      }, 200)
      return () => window.clearTimeout(id)
    }
  }, [isOpen])

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (allItems.length === 0) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % allItems.length)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length)
    } else if (event.key === "Enter") {
      event.preventDefault()
      const item = allItems[selectedIndex]
      if (item && !item.disabled) {
        void item.onSelect()
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent
        className="max-w-2xl gap-0 overflow-hidden border-app-border bg-app-surface p-0 shadow-glow sm:rounded-2xl"
        onPointerDownOutside={close}
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search commands, navigate the app, or ask the AI assistant.
        </DialogDescription>

        {/* Search input */}
        <div className="relative flex items-center border-b border-app-border px-4 py-3">
          <Search className="absolute left-7 h-5 w-5 text-gray-500" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search, command or ask AI..."
            className="h-12 border-0 bg-transparent pl-10 pr-20 text-lg text-white shadow-none placeholder:text-gray-600 focus-visible:ring-0"
            aria-label="Command palette input"
          />
          <div className="absolute right-7 flex items-center gap-1.5 text-xs text-gray-500">
            <kbd className="rounded border border-app-border bg-app-bg px-1.5 py-0.5">Esc</kbd>
          </div>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-[min(60vh,480px)]">
          <div className="px-3 py-3">
            {allItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-gray-500">
                <Search className="h-8 w-8 opacity-50" />
                <p>No results for "{query}"</p>
                <p className="text-xs">Try typing Add "word" to create a card.</p>
              </div>
            ) : (
              groups.map((group, groupIndex) => (
                <div key={group.id} className="mb-3 last:mb-0">
                  <div className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                    {group.label}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item, itemIndex) => {
                      const flatIndex =
                        groups
                          .slice(0, groupIndex)
                          .reduce((acc, g) => acc + g.items.length, 0) + itemIndex
                      const isSelected = flatIndex === selectedIndex
                      const Icon =
                        item.type === "quick-add" && quickAddState.status === "loading"
                          ? Loader2
                          : item.icon

                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={item.disabled}
                          onMouseEnter={() => setSelectedIndex(flatIndex)}
                          onClick={() => {
                            if (!item.disabled) void item.onSelect()
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                            isSelected
                              ? "bg-brand-primary/10 text-white"
                              : "text-gray-400 hover:bg-white/5 hover:text-white",
                            item.disabled && "cursor-not-allowed opacity-50",
                            quickAddState.status === "loading" &&
                              item.type === "quick-add" &&
                              "animate-pulse",
                          )}
                        >
                          {Icon && (
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                isSelected ? "text-brand-primary" : "text-gray-500",
                                quickAddState.status === "loading" &&
                                  item.type === "quick-add" &&
                                  "animate-spin",
                              )}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium">{item.title}</span>
                              {groupBadge(item.type) && (
                                <span className="shrink-0 rounded bg-white/5 px-1.5 py-0 text-[10px] text-gray-500">
                                  {groupBadge(item.type)}
                                </span>
                              )}
                            </div>
                            {item.subtitle && (
                              <p className="truncate text-xs text-gray-500">{item.subtitle}</p>
                            )}
                          </div>
                          {isSelected && !item.disabled && (
                            <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-app-border bg-app-bg/50 px-4 py-2.5 text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-app-border bg-app-surface px-1.5 py-0.5">↑</kbd>
              <kbd className="rounded border border-app-border bg-app-surface px-1.5 py-0.5">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-app-border bg-app-surface px-1.5 py-0.5">↵</kbd>
              to select
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-brand-primary" />
            <span>Tip: type Add &quot;word&quot; to create a card</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
