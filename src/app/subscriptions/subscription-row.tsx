interface SubscriptionRowProps {
  title: string
}

export function SubscriptionRow({ title }: SubscriptionRowProps) {
  return (
    <li className="flex items-center gap-3 py-3 px-4 rounded-lg bg-app-surface border border-white/10 text-white hover:bg-app-hover transition-colors">
      <i className="fas fa-book text-gray-500" aria-hidden />
      <span>{title}</span>
    </li>
  )
}
