"use client"

import { useState } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/auth/protected-route"
import type { BillingPlanDto } from "@/lib/api/billing-client"
import {
  getBillingErrorMessage,
  useBillingAccess,
  useBillingCheckout,
  useBillingEntitlements,
  useBillingPlans,
  useBillingSubscription,
  useBillingUsage,
  useCancelBillingSubscription,
} from "@/lib/react-query/billing-queries"
import { SubscriptionBadge } from "@/components/billing/subscription-badge"
import {
  CreditCard,
  CheckCircle2,
  Zap,
  ArrowLeft,
  Receipt,
  Sparkles,
  AlertCircle,
  Clock,
  Layers,
  BookOpen,
  FileText,
} from "lucide-react"

function formatPrice(plan: BillingPlanDto): string {
  if (plan.price <= 0) return "Free"
  const amount = (plan.price / 100).toLocaleString("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  return `${amount} ${plan.currency}/${plan.interval === "year" ? "yr" : "mo"}`
}

export default function BillingPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: access, isLoading: accessLoading } = useBillingAccess()
  const { data: entitlements } = useBillingEntitlements()
  const { data: usage } = useBillingUsage()
  const { data: subscription } = useBillingSubscription()
  const { data: plans = [], isLoading: plansLoading } = useBillingPlans(true)

  const checkoutMutation = useBillingCheckout()
  const cancelMutation = useCancelBillingSubscription()

  const isLoading = accessLoading || plansLoading
  const currentPlan = access?.planCode ?? "free"

  const handleCheckout = (planCode: string) => {
    setErrorMessage(null)
    checkoutMutation.mutate(planCode, {
      onError: (e) => setErrorMessage(getBillingErrorMessage(e, "Checkout failed")),
    })
  }

  const handleCancel = () => {
    setErrorMessage(null)
    cancelMutation.mutate(undefined, {
      onError: (e) => setErrorMessage(getBillingErrorMessage(e, "Cancel failed")),
    })
  }

  return (
    <ProtectedRoute>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative custom-scroll h-full">
        {/* Ambient radial background glow matching Profile Studio */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,130,92,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(84,196,255,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_38%)] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto space-y-8">
          {/* Header Banner */}
          <header className="glass-panel border border-app-border rounded-[2rem] p-6 sm:p-8 overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-brand-primary/12 via-white/0 to-brand-secondary/12 pointer-events-none" />
            
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Profile Studio</span>
                </Link>
                <div className="flex items-center gap-3 pt-1">
                  <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                    Billing &amp; Subscription
                  </h1>
                  <SubscriptionBadge />
                </div>
                <p className="text-gray-400 text-sm sm:text-base max-w-xl">
                  Choose the right plan to expand project slots, AI generation limits, and daily vocabulary quotas.
                </p>
              </div>

              <Link
                href="/billing/invoices"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition shrink-0 self-start sm:self-center"
              >
                <Receipt className="h-4 w-4 text-violet-400" />
                <span>Payment History</span>
              </Link>
            </div>
          </header>

          {errorMessage && (
            <div
              className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3"
              role="alert"
            >
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isLoading ? (
            <div className="glass-panel border border-app-border rounded-[2rem] p-12 text-center text-gray-400 text-sm">
              Loading plans and billing status…
            </div>
          ) : (
            <>
              {/* Current Subscription Status Card */}
              <section className="glass-panel border border-app-border rounded-[2rem] p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-primary">
                      <Sparkles className="h-4 w-4" /> Current Active Plan
                    </div>
                    <h2 className="text-2xl font-bold text-white capitalize mt-1 flex items-center gap-3">
                      {currentPlan} Tier
                      <span className="text-xs font-normal text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                        Active
                      </span>
                    </h2>
                  </div>

                  {subscription && subscription.status !== "canceled" && (
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5 bg-black/20 border border-white/8 rounded-xl px-3.5 py-2">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span>
                          Renews: <strong className="text-white">{subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "Never"}</strong>
                        </span>
                      </div>

                      {subscription.cancelAtPeriodEnd && (
                        <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                          Cancellation scheduled
                        </span>
                      )}

                      {!subscription.cancelAtPeriodEnd && subscription.planCode !== "free" && (
                        <button
                          type="button"
                          onClick={handleCancel}
                          disabled={cancelMutation.isPending}
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 px-3.5 py-2 rounded-xl transition disabled:opacity-50"
                        >
                          {cancelMutation.isPending ? "Canceling..." : "Cancel Subscription"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Quotas Breakdown */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-6">
                  <div className="rounded-2xl border border-white/8 bg-black/20 p-4 space-y-2">
                    <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-4 w-4 text-brand-primary" /> Active Projects
                      </span>
                      <span>{usage?.projects.isUnlimited ? "Unlimited" : `${Math.min(100, Math.round(((usage?.projects.used ?? 0) / (usage?.projects.limit || 1)) * 100))}%`}</span>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {usage?.projects.used ?? 0} <span className="text-xs font-normal text-gray-400">/ {usage?.projects.isUnlimited ? "∞" : usage?.projects.limit}</span>
                    </p>
                    {!usage?.projects.isUnlimited && (usage?.projects.limit ?? 0) > 0 && (
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-brand-primary rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round(((usage?.projects.used ?? 0) / (usage?.projects.limit || 1)) * 100))}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-black/20 p-4 space-y-2">
                    <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4 text-emerald-400" /> Vocabulary Cards
                      </span>
                      <span>{usage?.cards.isUnlimited ? "Unlimited" : `${Math.min(100, Math.round(((usage?.cards.used ?? 0) / (usage?.cards.limit || 1)) * 100))}%`}</span>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {usage?.cards.used ?? 0} <span className="text-xs font-normal text-gray-400">/ {usage?.cards.isUnlimited ? "∞" : usage?.cards.limit}</span>
                    </p>
                    {!usage?.cards.isUnlimited && (usage?.cards.limit ?? 0) > 0 && (
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round(((usage?.cards.used ?? 0) / (usage?.cards.limit || 1)) * 100))}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-black/20 p-4 space-y-2">
                    <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
                      <span className="flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-violet-400" /> AI Requests / Day
                      </span>
                      <span>{usage?.aiRequests.isUnlimited ? "Unlimited" : `${Math.min(100, Math.round(((usage?.aiRequests.used ?? 0) / (usage?.aiRequests.limit || 1)) * 100))}%`}</span>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {usage?.aiRequests.used ?? 0} <span className="text-xs font-normal text-gray-400">/ {usage?.aiRequests.isUnlimited ? "∞" : usage?.aiRequests.limit}</span>
                    </p>
                    {!usage?.aiRequests.isUnlimited && (usage?.aiRequests.limit ?? 0) > 0 && (
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-violet-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round(((usage?.aiRequests.used ?? 0) / (usage?.aiRequests.limit || 1)) * 100))}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-black/20 p-4 space-y-2">
                    <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-sky-400" /> Reader Books
                      </span>
                      <span>{usage?.books.isUnlimited ? "Unlimited" : `${Math.min(100, Math.round(((usage?.books.used ?? 0) / (usage?.books.limit || 1)) * 100))}%`}</span>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {usage?.books.used ?? 0} <span className="text-xs font-normal text-gray-400">/ {usage?.books.isUnlimited ? "∞" : usage?.books.limit}</span>
                    </p>
                    {!usage?.books.isUnlimited && (usage?.books.limit ?? 0) > 0 && (
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-sky-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round(((usage?.books.used ?? 0) / (usage?.books.limit || 1)) * 100))}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

              </section>

              {/* Plans Comparison Section */}
              <section className="space-y-4">
                <div className="px-2">
                  <h2 className="text-xl font-bold text-white">Available Plans</h2>
                  <p className="text-sm text-gray-400">
                    Upgrade to unlock unlimited translation, custom decks, and extra storage.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {plans.map((plan) => {
                    const isCurrent = plan.code === currentPlan
                    const isPaid = plan.price > 0

                    return (
                      <article
                        key={plan.id}
                        className={`glass-panel rounded-[2rem] p-6 sm:p-8 border flex flex-col justify-between transition relative overflow-hidden ${
                          isCurrent
                            ? "border-brand-primary/50 bg-gradient-to-b from-brand-primary/10 to-transparent shadow-[0_0_40px_rgba(255,130,92,0.12)]"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        {isCurrent && (
                          <div className="absolute top-4 right-4 bg-brand-primary text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-glow">
                            Current Plan
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-brand-primary" />
                            <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                          </div>
                          <p className="text-gray-400 text-sm mt-2 min-h-[44px]">
                            {plan.description}
                          </p>

                          <div className="mt-6 flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-white tracking-tight">
                              {formatPrice(plan)}
                            </span>
                          </div>

                          {plan.trialDays > 0 && (
                            <p className="text-xs text-emerald-400 mt-1 font-medium flex items-center gap-1">
                              <Sparkles className="h-3.5 w-3.5" /> Includes {plan.trialDays}-day free trial
                            </p>
                          )}

                          <div className="my-6 border-t border-white/10" />

                          <ul className="space-y-3 text-sm text-gray-300">
                            <li className="flex items-center gap-2.5">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                              <span>
                                <strong>{plan.entitlements.maxProjects}</strong> active language projects
                              </span>
                            </li>
                            <li className="flex items-center gap-2.5">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                              <span>
                                <strong>{plan.entitlements.maxCards}</strong> total vocabulary cards
                              </span>
                            </li>
                            <li className="flex items-center gap-2.5">
                              <Zap className="h-4 w-4 text-violet-400 shrink-0" />
                              <span>
                                <strong>{plan.entitlements.aiRequestsPerDay}</strong> AI assistant requests/day
                              </span>
                            </li>
                          </ul>
                        </div>

                        <div className="mt-8">
                          {isCurrent ? (
                            <div className="w-full text-center rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-gray-400">
                              Active Tier
                            </div>
                          ) : isPaid ? (
                            <button
                              type="button"
                              onClick={() => handleCheckout(plan.code)}
                              disabled={checkoutMutation.isPending}
                              className="w-full rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary py-3 text-sm font-bold text-white hover:brightness-110 transition shadow-glow disabled:opacity-60"
                            >
                              {checkoutMutation.isPending ? "Processing..." : `Upgrade to ${plan.name}`}
                            </button>
                          ) : null}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
