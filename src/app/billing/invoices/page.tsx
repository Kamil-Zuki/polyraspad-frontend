"use client"

import Link from "next/link"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useBillingInvoices } from "@/lib/react-query/billing-queries"
import { ArrowLeft, Receipt, CheckCircle2, Clock } from "lucide-react"

export default function BillingInvoicesPage() {
  const { data: invoices = [], isLoading } = useBillingInvoices()

  return (
    <ProtectedRoute>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative custom-scroll h-full">
        {/* Ambient radial background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,130,92,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(84,196,255,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_38%)] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <header className="glass-panel border border-app-border rounded-[2rem] p-6 sm:p-8 overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-brand-primary/12 via-white/0 to-brand-secondary/12 pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <Link
                  href="/billing"
                  className="inline-flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition mb-3"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Billing</span>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      Payment History
                    </h1>
                    <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                      Receipts and invoices for your Polyraspad subscription
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="glass-panel border border-app-border rounded-[2rem] overflow-hidden p-6 sm:p-8">
            {isLoading ? (
              <p className="text-gray-400 text-sm py-4">Loading invoice records…</p>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                <p className="text-white font-medium">No payment history yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  When you upgrade or renew your plan, past receipts will be listed here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white capitalize">{inv.status}</span>
                        {inv.status === "paid" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-mono">
                        Invoice ID: {inv.providerInvoiceId || inv.id}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-xs text-gray-400">
                        {new Date(inv.createdAt).toLocaleString()}
                      </div>
                      <div className="text-base font-bold text-white">
                        {(inv.amountPaid / 100).toLocaleString("ru-RU")} {inv.currency}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
