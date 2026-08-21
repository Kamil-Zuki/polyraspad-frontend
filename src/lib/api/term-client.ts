import { BaseApiClient } from "./base-api-client";
import { API_ENDPOINTS } from "../constants";
import type {
  BulkMarkKnownDto,
  BulkMarkKnownResponseDto,
  CreateOrUpdateTermDto,
  ListProjectTermsResponseDto,
  SearchTermDuplicatesDto,
  SearchTermDuplicatesResponseDto,
  TermActionDto,
  TermDetailsDto,
} from "./types";

export class TermClient extends BaseApiClient {
  async listProjectTerms(params: {
    projectId: string;
    status?: string;
    type?: string;
    q?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<ListProjectTermsResponseDto> {
    const search = new URLSearchParams();
    search.set("projectId", params.projectId);
    if (params.status) search.set("status", params.status);
    if (params.type) search.set("type", params.type);
    if (params.q) search.set("q", params.q);
    if (params.pageNumber != null) search.set("pageNumber", String(params.pageNumber));
    if (params.pageSize != null) search.set("pageSize", String(params.pageSize));
    return this.request<ListProjectTermsResponseDto>(`${API_ENDPOINTS.TERMS.LIST}?${search.toString()}`);
  }

  async createOrUpdate(data: CreateOrUpdateTermDto): Promise<TermDetailsDto> {
    return this.request<TermDetailsDto>(API_ENDPOINTS.TERMS.CREATE_OR_UPDATE, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async markKnown(data: TermActionDto): Promise<TermDetailsDto> {
    return this.request<TermDetailsDto>(API_ENDPOINTS.TERMS.KNOWN, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async ignore(data: TermActionDto): Promise<TermDetailsDto> {
    return this.request<TermDetailsDto>(API_ENDPOINTS.TERMS.IGNORE, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async bulkMarkKnown(data: BulkMarkKnownDto): Promise<BulkMarkKnownResponseDto> {
    return this.request<BulkMarkKnownResponseDto>(API_ENDPOINTS.TERMS.BULK_KNOWN, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async searchDuplicates(data: SearchTermDuplicatesDto): Promise<SearchTermDuplicatesResponseDto> {
    return this.request<SearchTermDuplicatesResponseDto>(API_ENDPOINTS.TERMS.DUPLICATES, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

