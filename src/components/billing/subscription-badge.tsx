"use client";

import { useBillingAccess } from "@/lib/react-query/billing-queries";
import { cn } from "@/lib/utils";

const planStyles: Record<string, string> = {
  free: "bg-white/10 text-gray-300 border-white/15",
  pro: "bg-violet-500/20 text-violet-300 border-violet-500/30",
};

export function SubscriptionBadge({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { data: access } = useBillingAccess();
  const planCode = access?.planCode ?? "free";
  const style = planStyles[planCode] ?? planStyles.free;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium capitalize",
        compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        style,
        className
      )}
      title={`Current plan: ${planCode}`}
    >
      {planCode}
    </span>
  );
}
