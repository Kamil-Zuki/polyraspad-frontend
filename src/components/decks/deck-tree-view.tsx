"use client"

import { useState, useCallback, useMemo } from "react"
import Link from "next/link"
import {
  ChevronRight,
  ChevronDown,
  Layers,
  Folder,
  Pencil,
  Trash2,
  Plus,
  Play,
  Move,
} from "lucide-react"
import { DeckTreeItemDto } from "@/lib/api/types"
import { cn } from "@/lib/utils"

interface DeckTreeViewProps {
  tree: DeckTreeItemDto[]
  onSelect: (deck: DeckTreeItemDto) => void
  onEdit?: (deck: DeckTreeItemDto) => void
  onDelete?: (deckId: string) => void
  onCreateChild?: (parentId: string) => void
  onMove?: (deck: DeckTreeItemDto) => void
  mode?: "manage" | "navigate"
  selectedId?: string | null
}

function totalCards(node: DeckTreeItemDto): number {
  return node.cardCount + node.children.reduce((sum, child) => sum + totalCards(child), 0)
}

interface TreeNodeProps {
  node: DeckTreeItemDto
  level: number
  expanded: Set<string>
  toggle: (id: string) => void
  onSelect: (deck: DeckTreeItemDto) => void
  onEdit?: (deck: DeckTreeItemDto) => void
  onDelete?: (deckId: string) => void
  onCreateChild?: (parentId: string) => void
  onMove?: (deck: DeckTreeItemDto) => void
  mode: "manage" | "navigate"
  selectedId?: string | null
}

function TreeNode({
  node,
  level,
  expanded,
  toggle,
  onSelect,
  onEdit,
  onDelete,
  onCreateChild,
  onMove,
  mode,
  selectedId,
}: TreeNodeProps) {
  const isExpanded = expanded.has(node.id)
  const hasChildren = node.children.length > 0
  const cards = totalCards(node)
  const studyableCount = node.stats?.studyableNowCount ?? 0
  const dueCount = node.stats?.dueCardsCount ?? 0
  const isSelected = selectedId === node.id

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 transition",
          level > 0 && "ml-4 border-l border-l-white/5 rounded-l-none",
          isSelected
            ? "bg-brand-primary/10 border-brand-primary/20 text-white"
            : "hover:border-white/5 hover:bg-white/[0.02]"
        )}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        <button
          type="button"
          onClick={() => toggle(node.id)}
          disabled={!hasChildren}
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-500 transition hover:bg-white/5 hover:text-white disabled:opacity-0",
            hasChildren && "opacity-100"
          )}
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => onSelect(node)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          {hasChildren ? (
            <Folder className="h-5 w-5 shrink-0 text-brand-primary/70" />
          ) : (
            <Layers className="h-5 w-5 shrink-0 text-brand-primary/70" />
          )}
          <span className="truncate text-sm font-medium text-gray-200 group-hover:text-white">
            {node.title}
          </span>
          <span className="shrink-0 text-xs text-gray-500">{cards} cards</span>
          {studyableCount > 0 && (
            <span className="shrink-0 text-xs text-amber-500">{studyableCount} to study</span>
          )}
          {dueCount > 0 && studyableCount === 0 && (
            <span className="shrink-0 text-xs text-blue-400">{dueCount} due</span>
          )}
          {node.forkedFromId && (
            <span className="shrink-0 rounded-full bg-brand-secondary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-secondary">
              Purchased
            </span>
          )}
        </button>

        {mode === "manage" && onEdit && onDelete && onCreateChild && (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
            <Link
              href={`/study/${node.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-brand-primary/10 px-2.5 text-xs font-medium text-brand-primary transition hover:bg-brand-primary/20"
            >
              <Play className="h-3.5 w-3.5" />
              Study
            </Link>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onCreateChild(node.id)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white/5 hover:text-white"
              title="Create sub-deck"
              aria-label="Create sub-deck"
            >
              <Plus className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onMove?.(node)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white/5 hover:text-white"
              title="Move"
              aria-label="Move"
            >
              <Move className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(node)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white/5 hover:text-white"
              title="Edit"
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(node.id)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-500/10 hover:text-red-400"
              title="Delete"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expanded={expanded}
              toggle={toggle}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreateChild={onCreateChild}
              onMove={onMove}
              mode={mode}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function DeckTreeView({
  tree,
  onSelect,
  onEdit,
  onDelete,
  onCreateChild,
  onMove,
  mode = "manage",
  selectedId,
}: DeckTreeViewProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set()
    try {
      const saved = localStorage.getItem("deckTreeExpanded")
      return saved ? new Set(JSON.parse(saved)) : new Set(tree.map((n) => n.id))
    } catch {
      return new Set(tree.map((n) => n.id))
    }
  })

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try {
        localStorage.setItem("deckTreeExpanded", JSON.stringify(Array.from(next)))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const ids = useMemo(() => new Set(tree.map((n) => n.id)), [tree])

  // Auto-expand root nodes when tree changes
  useMemo(() => {
    setExpanded((prev) => {
      const next = new Set(prev)
      let changed = false
      tree.forEach((n) => {
        if (!next.has(n.id)) {
          next.add(n.id)
          changed = true
        }
      })
      if (changed) {
        try {
          localStorage.setItem("deckTreeExpanded", JSON.stringify(Array.from(next)))
        } catch {
          // ignore
        }
      }
      return next
    })
  }, [ids, tree])

  if (tree.length === 0) {
    return null
  }

  return (
    <div className="space-y-0.5">
      {tree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          expanded={expanded}
          toggle={toggle}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onCreateChild={onCreateChild}
          onMove={onMove}
          mode={mode}
          selectedId={selectedId}
        />
      ))}
    </div>
  )
}
