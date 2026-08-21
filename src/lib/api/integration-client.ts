import { API_ENDPOINTS } from "../constants";
import { BaseApiClient } from "./base-api-client";
import {
  DictionaryLookupRequestDto,
  DictionaryLookupResponseDto,
  IntegrationProvidersResponseDto,
  TranslateRequestDto,
  TranslateResponseDto,
} from "./types";

export class IntegrationClient extends BaseApiClient {
  async getProviders(): Promise<IntegrationProvidersResponseDto> {
    return this.request<IntegrationProvidersResponseDto>(API_ENDPOINTS.INTEGRATIONS.PROVIDERS);
  }

  async translate(data: TranslateRequestDto): Promise<TranslateResponseDto> {
    return this.request<TranslateResponseDto>(API_ENDPOINTS.INTEGRATIONS.TRANSLATE, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async lookupDictionary(data: DictionaryLookupRequestDto): Promise<DictionaryLookupResponseDto> {
    return this.request<DictionaryLookupResponseDto>(API_ENDPOINTS.INTEGRATIONS.DICTIONARY_LOOKUP, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}
