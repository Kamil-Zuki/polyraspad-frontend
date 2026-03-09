import { BaseApiClient } from "./base-api-client";
import { API_ENDPOINTS } from "../constants";
import { DeckSubscriptionDto } from "./types";

export class SubscriptionsClient extends BaseApiClient {
  async getSubscriptions(): Promise<DeckSubscriptionDto[]> {
    return this.request<DeckSubscriptionDto[]>(API_ENDPOINTS.SUBSCRIPTIONS.LIST);
  }
}
