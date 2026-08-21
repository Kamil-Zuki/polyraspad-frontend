"use client"

import Link from "next/link"
import { useBillingAccess, useBillingSubscription, useBillingUsage } from "@/lib/react-query/billing-queries"
import { SubscriptionBadge } from "@/components/billing/subscription-badge"
import { CreditCard, Zap, Layers, BookOpen, FileText, ArrowRight, ShieldAlert } from "lucide-react"

function UsageProgressCard({
  icon: Icon,
  iconColor,
  title,
  used,
  limit,
  isUnlimited,
  unit,
}: {
  icon: React.ElementType
  iconColor: string
  title: string
  used: number
  limit: number
  isUnlimited: boolean
  unit: string
}) {
  const percentage = isUnlimited || limit <= 0 ? 0 : Math.min(100, Math.round((used / limit) * 100))
  
  let barColor = "bg-gradient-to-r from-brand-primary to-brand-secondary"
  let badgeColor = "text-gray-400 bg-white/5 border-white/10"

  if (!isUnlimited && limit > 0) {
    if (percentage >= 90) {
      barColor = "bg-gradient-to-r from-rose-500 to-rose-400"
      badgeColor = "text-rose-400 bg-rose-500/10 border-rose-500/20"
    } else if (percentage >= 75) {
      barColor = "bg-gradient-to-r from-amber-500 to-amber-400"
      badgeColor = "text-amber-400 bg-amber-500/10 border-amber-500/20"
    } else {
      barColor = "bg-gradient-to-r from-emerald-500 to-emerald-400"
      badgeColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    }
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <span>{title}</span>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}>
          {isUnlimited ? "Unlimited" : `${percentage}% used`}
        </span>
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-xl font-bold text-white tracking-tight">
          {used}{" "}
          <span className="text-xs font-normal text-gray-400">
            / {isUnlimited ? "∞" : limit} {unit}
          </span>
        </span>
        {!isUnlimited && limit > 0 && (
          <span className="text-[11px] text-gray-400">
            {Math.max(0, limit - used)} left
          </span>
        )}
      </div>

      {!isUnlimited && limit > 0 && (
        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  )
}

export function ProfileBillingSection() {
  const { data: access, isLoading: accessLoading } = useBillingAccess()
  const { data: usage, isLoading: usageLoading } = useBillingUsage()
  const { data: subscription } = useBillingSubscription()

  const currentPlan = access?.planCode ?? "free"
  const isFree = currentPlan === "free"
  const isLoading = accessLoading || usageLoading

  return (
    <section className="glass-panel border border-app-border rounded-[2rem] p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Billing & Quota Usage</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Track spent limits, active plan status, and upgrade options
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SubscriptionBadge />
          <Link
            href="/billing"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary px-4 py-2 text-xs font-semibold text-white hover:brightness-110 transition shadow-glow shrink-0"
          >
            <span>{isFree ? "Upgrade Plan" : "Manage Billing"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 text-sm text-gray-400">Loading quota usage...</div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-white/8 bg-black/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">
                Current Plan
              </span>
              <p className="mt-0.5 text-lg font-bold text-white capitalize flex items-center gap-2">
                {currentPlan} Tier
                {subscription?.cancelAtPeriodEnd && (
                  <span className="text-xs text-amber-400 font-normal flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5" /> Cancels soon
                  </span>
                )}
              </p>
            </div>
            {subscription && subscription.status !== "canceled" && (
              <p className="text-xs text-gray-400">
                Renews: <strong className="text-white">{subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "Never"}</strong>
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <UsageProgressCard
              icon={Layers}
              iconColor="text-brand-primary"
              title="Active Projects"
              used={usage?.projects.used ?? 0}
              limit={usage?.projects.limit ?? 3}
              isUnlimited={usage?.projects.isUnlimited ?? false}
              unit="projects"
            />
            <UsageProgressCard
              icon={BookOpen}
              iconColor="text-emerald-400"
              title="Vocabulary Cards"
              used={usage?.cards.used ?? 0}
              limit={usage?.cards.limit ?? 500}
              isUnlimited={usage?.cards.isUnlimited ?? false}
              unit="cards"
            />
            <UsageProgressCard
              icon={Zap}
              iconColor="text-violet-400"
              title="Daily AI Requests"
              used={usage?.aiRequests.used ?? 0}
              limit={usage?.aiRequests.limit ?? 10}
              isUnlimited={usage?.aiRequests.isUnlimited ?? false}
              unit="req / day"
            />
            <UsageProgressCard
              icon={FileText}
              iconColor="text-sky-400"
              title="Reader Books"
              used={usage?.books.used ?? 0}
              limit={usage?.books.limit ?? 3}
              isUnlimited={usage?.books.isUnlimited ?? false}
              unit="books"
            />
          </div>
        </div>
      )}
    </section>
  )
}

