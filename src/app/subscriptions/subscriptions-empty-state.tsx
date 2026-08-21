export function SubscriptionsEmptyState() {
  return (
    <div className="text-center py-8">
      <div className="mb-4">
        <i className="fas fa-inbox text-6xl text-gray-600" aria-hidden />
      </div>
      <p className="text-gray-400" data-testid="empty-state-message">
        You have no subscriptions
      </p>
    </div>
  )
}
