"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { billingQueryKeys } from "@/lib/react-query/constants";

export default function BillingSuccessPage() {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: billingQueryKeys.all });
  }, [queryClient]);

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-app-bg">
      <div className="glass-panel rounded-xl p-8 border border-white/10 max-w-md text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Payment Successful</h1>
        <p className="text-gray-400 text-sm mb-6">
          Your plan has been updated! All premium features and AI capabilities are now unlocked.
        </p>
        <Link
          href="/billing"
          className="inline-flex rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          Back to Billing
        </Link>
      </div>
    </div>
  );
}
