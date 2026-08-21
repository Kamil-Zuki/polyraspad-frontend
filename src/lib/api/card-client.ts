import { BaseApiClient } from "./base-api-client";
import { API_ENDPOINTS } from "../constants";
import {
  CardResponseDto,
  CreateCardDto,
  CaptureCardDto,
  CheckCardDuplicatesRequestDto,
  CheckCardDuplicatesResponseDto,
  UpdateCardDto,
  BulkCreateCardsDto,
  BulkDeleteCardsDto,
  MoveCardsDto,
  ResetCardProgressDto,
  SearchCardsResponseDto,
  GetNoteTypeForEditorResponseDto,
} from "./types";

export class CardClient extends BaseApiClient {
  async createCard(data: CreateCardDto): Promise<CardResponseDto> {
    return this.request<CardResponseDto>(API_ENDPOINTS.CARDS.CREATE, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async captureCard(data: CaptureCardDto): Promise<CardResponseDto> {
    return this.request<CardResponseDto>(API_ENDPOINTS.CARDS.CAPTURE, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async checkDuplicates(data: CheckCardDuplicatesRequestDto): Promise<CheckCardDuplicatesResponseDto> {
    return this.request<CheckCardDuplicatesResponseDto>(API_ENDPOINTS.CARDS.CHECK_DUPLICATES, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async searchCards(
    query: string,
    options?: {
      projectId?: string
      deckId?: string
      srsStatuses?: string[]
      pageNumber?: number
      pageSize?: number
    }
  ): Promise<SearchCardsResponseDto> {
    const params = new URLSearchParams();
    // Always send query (empty string allowed when filtering by deck/project only)
    params.append('query', query ?? '');
    if (options?.projectId) params.append('projectId', options.projectId);
    if (options?.deckId) params.append('deckId', options.deckId);
    if (options?.pageNumber) params.append('pageNumber', options.pageNumber.toString());
    if (options?.pageSize) params.append('pageSize', options.pageSize.toString());
    if (options?.srsStatuses && options.srsStatuses.length > 0) {
      options.srsStatuses.forEach(status => params.append('srsStatuses', status));
    }
    return this.request<SearchCardsResponseDto>(`${API_ENDPOINTS.CARDS.SEARCH}?${params.toString()}`);
  }

  async getCard(id: string): Promise<CardResponseDto> {
    return this.request<CardResponseDto>(API_ENDPOINTS.CARDS.GET(id));
  }

  async getNoteTypeForEditor(projectId: string): Promise<GetNoteTypeForEditorResponseDto> {
    return this.request<GetNoteTypeForEditorResponseDto>(
      API_ENDPOINTS.CARDS.NOTE_TYPE_EDITOR(projectId)
    );
  }

  async updateCard(id: string, data: UpdateCardDto): Promise<CardResponseDto> {
    return this.request<CardResponseDto>(API_ENDPOINTS.CARDS.UPDATE(id), {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async bulkCreateCards(data: BulkCreateCardsDto): Promise<CardResponseDto[]> {
    return this.request<CardResponseDto[]>(API_ENDPOINTS.CARDS.BULK_CREATE, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteCard(id: string): Promise<void> {
    return this.request<void>(API_ENDPOINTS.CARDS.DELETE(id), {
      method: "DELETE",
    });
  }

  async bulkDeleteCards(data: BulkDeleteCardsDto): Promise<void> {
    return this.request<void>(API_ENDPOINTS.CARDS.BULK_DELETE, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async moveCards(data: MoveCardsDto): Promise<void> {
    return this.request<void>(API_ENDPOINTS.CARDS.BULK_MOVE, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async resetCardProgress(data: ResetCardProgressDto): Promise<void> {
    return this.request<void>(API_ENDPOINTS.CARDS.BULK_RESET_PROGRESS, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getLeechCards(
    projectId: string,
    options?: { threshold?: number; pageNumber?: number; pageSize?: number }
  ): Promise<SearchCardsResponseDto> {
    const params = new URLSearchParams();
    params.append("projectId", projectId);
    if (options?.threshold) params.append("threshold", options.threshold.toString());
    if (options?.pageNumber) params.append("pageNumber", options.pageNumber.toString());
    if (options?.pageSize) params.append("pageSize", options.pageSize.toString());
    return this.request<SearchCardsResponseDto>(`${API_ENDPOINTS.CARDS.LEECHES}?${params.toString()}`);
  }

  async getCardsMissingMedia(
    projectId: string,
    options?: { mediaType?: string; pageNumber?: number; pageSize?: number }
  ): Promise<SearchCardsResponseDto> {
    const params = new URLSearchParams();
    params.append("projectId", projectId);
    if (options?.mediaType) params.append("mediaType", options.mediaType);
    if (options?.pageNumber) params.append("pageNumber", options.pageNumber.toString());
    if (options?.pageSize) params.append("pageSize", options.pageSize.toString());
    return this.request<SearchCardsResponseDto>(`${API_ENDPOINTS.CARDS.MISSING_MEDIA}?${params.toString()}`);
  }
}
