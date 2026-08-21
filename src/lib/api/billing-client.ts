import { BaseApiClient } from "./base-api-client";
import { API_ENDPOINTS } from "../constants";

export interface BillingAccessDto {
  hasAccess: boolean;
  planCode: string;
  status: string;
  currentPeriodEnd?: string | null;
}

export interface BillingEntitlementsDto {
  planCode: string;
  entitlements: Record<string, string>;
}

export interface BillingUsageItemDto {
  used: number;
  limit: number;
  isUnlimited: boolean;
}

export interface BillingUsageDto {
  planCode: string;
  projects: BillingUsageItemDto;
  cards: BillingUsageItemDto;
  aiRequests: BillingUsageItemDto;
  books: BillingUsageItemDto;
}

export interface BillingPlanDto {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  isActive: boolean;
  isDefault: boolean;
  trialDays: number;
  entitlements: Record<string, string>;
}

export interface BillingSubscriptionDto {
  id: string;
  planCode: string;
  provider: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart?: string | null;
  trialEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string | null;
  createdAt: string;
}

export interface BillingCheckoutRequestDto {
  planCode: string;
  provider?: string;
  returnUrl?: string;
}

export interface BillingCheckoutResponseDto {
  checkoutUrl: string;
  providerPaymentId: string;
}

export interface BillingInvoiceDto {
  id: string;
  subscriptionId: string;
  provider: string;
  providerInvoiceId: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: string;
  invoicePdfUrl?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export class BillingClient extends BaseApiClient {
  getAccess() {
    return this.request<BillingAccessDto>(API_ENDPOINTS.BILLING.ACCESS);
  }

  getEntitlements() {
    return this.request<BillingEntitlementsDto>(API_ENDPOINTS.BILLING.ENTITLEMENTS);
  }

  getUsage() {
    return this.request<BillingUsageDto>(API_ENDPOINTS.BILLING.USAGE);
  }

  getSubscription() {
    return this.request<BillingSubscriptionDto | null>(API_ENDPOINTS.BILLING.SUBSCRIPTION);
  }

  listPlans(onlyActive = true) {
    return this.request<BillingPlanDto[]>(
      `${API_ENDPOINTS.BILLING.PLANS}?onlyActive=${onlyActive}`
    );
  }

  createCheckout(body: BillingCheckoutRequestDto) {
    return this.request<BillingCheckoutResponseDto>(API_ENDPOINTS.BILLING.CHECKOUT, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  cancelSubscription(cancelAtPeriodEnd = true) {
    return this.request<BillingSubscriptionDto>(API_ENDPOINTS.BILLING.CANCEL, {
      method: "POST",
      body: JSON.stringify({ cancelAtPeriodEnd }),
    });
  }

  listInvoices(page = 1, pageSize = 20) {
    return this.request<BillingInvoiceDto[]>(
      `${API_ENDPOINTS.BILLING.INVOICES}?page=${page}&pageSize=${pageSize}`
    );
  }
}
