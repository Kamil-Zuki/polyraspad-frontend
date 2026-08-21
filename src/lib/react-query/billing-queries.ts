import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/index";
import { billingQueryKeys } from "./constants";
import type { BillingCheckoutRequestDto } from "../api/billing-client";
import { ApiError } from "../api/errors";

export function useBillingAccess() {
  return useQuery({
    queryKey: billingQueryKeys.access,
    queryFn: () => apiClient.billing.getAccess(),
  });
}

export function useBillingEntitlements() {
  return useQuery({
    queryKey: billingQueryKeys.entitlements,
    queryFn: () => apiClient.billing.getEntitlements(),
  });
}

export function useBillingUsage() {
  return useQuery({
    queryKey: billingQueryKeys.usage,
    queryFn: () => apiClient.billing.getUsage(),
  });
}

export function useBillingSubscription() {
  return useQuery({
    queryKey: billingQueryKeys.subscription,
    queryFn: () => apiClient.billing.getSubscription(),
  });
}

export function useBillingPlans(onlyActive = true) {
  return useQuery({
    queryKey: billingQueryKeys.plans(onlyActive),
    queryFn: () => apiClient.billing.listPlans(onlyActive),
  });
}

export function useBillingInvoices(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: billingQueryKeys.invoices(page, pageSize),
    queryFn: () => apiClient.billing.listInvoices(page, pageSize),
  });
}

export function useBillingCheckout() {
  return useMutation({
    mutationFn: (planCode: string) =>
      apiClient.billing.createCheckout({
        planCode,
        returnUrl: `${window.location.origin}/billing/success`,
      }),
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
  });
}

export function useCancelBillingSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.billing.cancelSubscription(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingQueryKeys.all });
    },
  });
}

export function getBillingErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.detail ?? error.message : fallback;
}

/**
 * Convenience hook: check a numeric entitlement (quota) against current usage.
 * Returns `canProceed` (boolean) and `showUpgrade()` which dispatches the
 * billingLimitExceeded event to open the global paywall modal.
 */
export function useEntitlementCheck(limitKey: string, currentUsage: number) {
  const { data: entitlements } = useBillingEntitlements();

  const raw = entitlements?.entitlements?.[limitKey];
  const limit = raw !== undefined ? parseInt(raw, 10) : undefined;
  const isUnlimited = limit === -1;
  const canProceed = isUnlimited || (limit !== undefined ? currentUsage < limit : true);

  const showUpgrade = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("billingLimitExceeded", {
          detail: { limitKey },
        })
      );
    }
  };

  return { canProceed, limit, isUnlimited, showUpgrade };
}
