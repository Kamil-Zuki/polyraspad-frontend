import { BaseApiClient } from "./base-api-client";
import { 
  AdminUsersResponseDto, 
  AdminUpdatePlanEntitlementsRequestDto,
  AdminUserDetailDto,
  AdminSetLockoutRequestDto,
  AdminAssignPlanRequestDto
} from "./types";
import { BillingPlanDto } from "./billing-client";

export class AdminClient extends BaseApiClient {
  async getUsers(page = 1, pageSize = 50, search = "", planFilter = ""): Promise<AdminUsersResponseDto> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    });
    
    if (search) params.append("search", search);
    if (planFilter && planFilter !== "all") params.append("planFilter", planFilter);

    return this.request<AdminUsersResponseDto>(`/api/v1/admin/users?${params.toString()}`);
  }

  async getUserDetail(userId: string): Promise<AdminUserDetailDto> {
    return this.request<AdminUserDetailDto>(`/api/v1/admin/users/${userId}`);
  }

  async setUserLockout(userId: string, lock: boolean): Promise<any> {
    return this.request(`/api/v1/admin/users/${userId}/lockout`, {
      method: "PUT",
      body: JSON.stringify({ lock } as AdminSetLockoutRequestDto),
    });
  }

  async assignUserPlan(userId: string, planCode: string): Promise<{ planCode: string }> {
    return this.request<{ planCode: string }>(`/api/v1/admin/users/${userId}/plan`, {
      method: "PUT",
      body: JSON.stringify({ planCode } as AdminAssignPlanRequestDto),
    });
  }

  async updatePlanEntitlements(planId: string, entitlements: Record<string, string>): Promise<BillingPlanDto> {
    return this.request<BillingPlanDto>(`/api/v1/admin/plans/` + planId + `/entitlements`, {
      method: "PUT",
      body: JSON.stringify({ entitlements } as AdminUpdatePlanEntitlementsRequestDto),
    });
  }
}

