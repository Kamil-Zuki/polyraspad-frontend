interface SubscriptionRowProps {
  deckId: string
  title: string
  onUnsubscribe: (deckId: string) => void
  isUnsubscribing?: boolean
}

export function SubscriptionRow({
  deckId,
  title,
  onUnsubscribe,
  isUnsubscribing = false,
}: SubscriptionRowProps) {
  return (
    <li className="flex items-center justify-between gap-3 py-3 px-4 rounded-lg bg-app-surface border border-white/10 text-white hover:bg-app-hover transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <i className="fas fa-book text-gray-500 shrink-0" aria-hidden />
        <span className="truncate">{title}</span>
      </div>
      <button
        type="button"
        onClick={() => onUnsubscribe(deckId)}
        disabled={isUnsubscribing}
        className="shrink-0 px-3 py-1.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-white/5 rounded-md border border-white/10 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        aria-busy={isUnsubscribing}
      >
        {isUnsubscribing ? "Отписка…" : "Отписаться"}
      </button>
    </li>
  )
}
