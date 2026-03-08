"use client"

import { useRouter } from "next/navigation"
import { Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { useProjectContext } from "@/contexts/project-context"
import { useDeckTree } from "@/lib/react-query/queries"

interface EditorHeaderProps {
  isPreviewMode?: boolean
  onTogglePreview?: () => void
  selectedDeckId: string
  onSelectedDeckIdChange: (deckId: string) => void
}

function flattenDeckTree(tree: { id: string; title: string; cardCount?: number; children?: unknown[] }[]): { id: string; title: string; cardCount?: number }[] {
  const result: { id: string; title: string; cardCount?: number }[] = []
  for (const node of tree) {
    result.push({ id: node.id, title: node.title, cardCount: node.cardCount })
    if (node.children?.length) {
      result.push(...flattenDeckTree(node.children as { id: string; title: string; cardCount?: number; children?: unknown[] }[]))
    }
  }
  return result
}

export function EditorHeader({ isPreviewMode, onTogglePreview, selectedDeckId, onSelectedDeckIdChange }: EditorHeaderProps) {
  const router = useRouter()
  const { currentProject } = useProjectContext()
  const { data: deckTree } = useDeckTree(currentProject?.id ?? "")
  const flatDecks = deckTree ? flattenDeckTree(deckTree) : []

  return (
    <header className="h-16 glass sticky top-0 z-20 border-b border-app-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back()
            } else {
              router.push("/dashboard")
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-app-bg border border-white/10 text-gray-300 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all"
          title="Назад"
          aria-label="Назад"
        >
          <i className="fas fa-arrow-left text-sm" />
          <span className="text-sm font-medium">Назад</span>
        </button>
        <div className="h-6 w-px bg-app-border mx-1" />
        <h1 className="text-lg font-bold text-white tracking-tight">Create Card</h1>
        <div className="h-6 w-px bg-app-border mx-1" />

        {/* Deck Selector */}
        <div className="flex items-center gap-2">
          <i className="fas fa-folder text-brand-primary text-sm" aria-hidden />
          <select
            value={selectedDeckId}
            onChange={(e) => onSelectedDeckIdChange(e.target.value)}
            className="text-sm text-gray-300 hover:text-white bg-app-bg pl-4 pr-10 py-2.5 rounded-xl border border-white/10 hover:border-brand-primary/30 transition-all appearance-none cursor-pointer min-w-[180px] input-dark"
            aria-label="Select deck"
          >
            {flatDecks.length === 0 ? (
              <option value="">Choose a deck...</option>
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
        {onTogglePreview != null && (
          <button
            type="button"
            onClick={onTogglePreview}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all",
              isPreviewMode
                ? "bg-brand-primary/20 border-brand-primary/50 text-white"
                : "bg-app-bg border-white/10 text-gray-400 hover:text-white hover:border-white/20",
            )}
            title="Preview Mode"
            aria-label="Toggle preview"
          >
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Preview</span>
          </button>
        )}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-status-success shadow-[0_0_8px_#10B981]" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Changes saved</span>
        </div>
        <button type="submit" form="editor-form" className="btn-primary px-8 py-2.5 text-sm shadow-glow shadow-brand-primary/20">
          Save Card
        </button>
      </div>
    </header>
  )
}
