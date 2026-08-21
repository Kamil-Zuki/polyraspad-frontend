"use client"

import { useEffect, useMemo, useState } from "react"
import { X, Folder, Check } from "lucide-react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { DeckTreeItemDto } from "@/lib/api/types"
import { cn } from "@/lib/utils"

interface MoveDeckDialogProps {
  deck: DeckTreeItemDto | null
  tree: DeckTreeItemDto[]
  isOpen: boolean
  onClose: () => void
  onMove: (parentDeckId: string | null) => Promise<void> | void
}

function collectDescendantIds(node: DeckTreeItemDto): Set<string> {
  const ids = new Set<string>()
  for (const child of node.children) {
    ids.add(child.id)
    for (const id of collectDescendantIds(child)) {
      ids.add(id)
    }
  }
  return ids
}

interface FlatNode {
  node: DeckTreeItemDto
  level: number
}

function findParentId(
  nodes: DeckTreeItemDto[],
  targetId: string,
  parentId: string | null = null,
): string | null {
  for (const node of nodes) {
    if (node.id === targetId) return parentId
    const found = findParentId(node.children, targetId, node.id)
    if (found !== null) return found
  }
  return null
}

function flattenTreeExcluding(
  nodes: DeckTreeItemDto[],
  excludeIds: Set<string>,
  level = 0,
): FlatNode[] {
  const result: FlatNode[] = []
  for (const node of nodes) {
    if (excludeIds.has(node.id)) continue
    result.push({ node, level })
    result.push(...flattenTreeExcluding(node.children, excludeIds, level + 1))
  }
  return result
}

export function MoveDeckDialog({
  deck,
  tree,
  isOpen,
  onClose,
  onMove,
}: MoveDeckDialogProps) {
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
  const [isMoving, setIsMoving] = useState(false)

  const excludedIds = useMemo(() => {
    if (!deck) return new Set<string>()
    const ids = new Set<string>()
    ids.add(deck.id)
    for (const id of collectDescendantIds(deck)) {
      ids.add(id)
    }
    return ids
  }, [deck])

  const options = useMemo(
    () => flattenTreeExcluding(tree, excludedIds),
    [tree, excludedIds],
  )

  const currentParentId = useMemo(() => {
    if (!deck) return null
    return findParentId(tree, deck.id)
  }, [deck, tree])

  useEffect(() => {
    if (isOpen && deck) {
      setSelectedParentId(currentParentId)
    }
  }, [isOpen, deck, currentParentId])

  const handleMove = async () => {
    if (!deck) return
    setIsMoving(true)
    try {
      await onMove(selectedParentId)
      onClose()
    } finally {
      setIsMoving(false)
    }
  }

  const isCurrentParent = (parentId: string | null) => currentParentId === parentId

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={onClose}
        />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d10] p-0 shadow-2xl shadow-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 focus:outline-none"
          onEscapeKeyDown={onClose}
        >
          <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
            <div>
              <DialogPrimitive.Title className="text-base font-bold text-white">
                Move deck
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-0.5 text-xs text-gray-500">
                Choose a new parent folder for <span className="text-gray-300">{deck?.title}</span>
              </DialogPrimitive.Description>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-white/5 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto px-2 py-2">
            <button
              type="button"
              onClick={() => setSelectedParentId(null)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                selectedParentId === null
                  ? "bg-brand-primary/10 text-white"
                  : "text-gray-300 hover:bg-white/[0.02]",
              )}
            >
              <Folder className="h-4 w-4 shrink-0 text-brand-primary/70" />
              <span className="flex-1 text-sm font-medium">Root</span>
              {selectedParentId === null && <Check className="h-4 w-4 text-brand-primary" />}
              {selectedParentId === null && isCurrentParent(null) && (
                <span className="text-[10px] text-gray-500">current</span>
              )}
            </button>

            {options.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-gray-500">
                No available folders
              </p>
            ) : (
              options.map(({ node, level }) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedParentId(node.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                    selectedParentId === node.id
                      ? "bg-brand-primary/10 text-white"
                      : "text-gray-300 hover:bg-white/[0.02]",
                  )}
                  style={{ paddingLeft: `${20 + level * 16}px` }}
                >
                  <Folder className="h-4 w-4 shrink-0 text-brand-primary/70" />
                  <span className="flex-1 truncate text-sm font-medium">{node.title}</span>
                  {selectedParentId === node.id && <Check className="h-4 w-4 text-brand-primary" />}
                  {isCurrentParent(node.id) && (
                    <span className="text-[10px] text-gray-500">current</span>
                  )}
                </button>
              ))
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isMoving}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-gray-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleMove}
              disabled={isMoving || isCurrentParent(selectedParentId)}
              className="rounded-lg bg-brand-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-primary/90 disabled:opacity-50"
            >
              {isMoving ? "Moving..." : "Move"}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
