import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <div className="flex-1 overflow-y-auto p-8 bg-app-bg">
      <div className="max-w-lg mx-auto glass-panel rounded-xl p-8 border border-white/10 text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">Payment canceled</h1>
        <p className="text-gray-400 text-sm">
          Checkout was canceled. No charges were made. You can try again anytime.
        </p>
        <Link
          href="/billing"
          className="inline-flex rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Back to billing
        </Link>
      </div>
    </div>
  );
}
