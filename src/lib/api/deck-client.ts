import { BaseApiClient } from "./base-api-client";
import { API_ENDPOINTS } from "../constants";
import {
  DeckResponseDto,
  DeckDetailDto,
  DeckTreeItemDto,
  CreateDeckDto,
  UpdateDeckDto,
} from "./types";

export class DeckClient extends BaseApiClient {
  async getDeckTree(projectId: string): Promise<DeckTreeItemDto[]> {
    return this.request<DeckTreeItemDto[]>(API_ENDPOINTS.DECKS.TREE(projectId));
  }

  async createDeck(data: CreateDeckDto): Promise<DeckResponseDto> {
    return this.request<DeckResponseDto>(API_ENDPOINTS.DECKS.CREATE, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateDeck(id: string, data: UpdateDeckDto): Promise<DeckResponseDto> {
    return this.request<DeckResponseDto>(API_ENDPOINTS.DECKS.UPDATE(id), {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async getDeck(id: string): Promise<DeckDetailDto> {
    return this.request<DeckDetailDto>(API_ENDPOINTS.DECKS.GET(id));
  }

  async deleteDeck(id: string): Promise<void> {
    return this.request<void>(API_ENDPOINTS.DECKS.DELETE(id), {
      method: "DELETE",
    });
  }
}