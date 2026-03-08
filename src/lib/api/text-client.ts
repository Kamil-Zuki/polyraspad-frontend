import { BaseApiClient } from "./base-api-client";
import { API_ENDPOINTS } from "../constants";
import type {
  TextAnalyzeRequestDto,
  TextAnalyzeResponseDto,
} from "./types";

export class TextClient extends BaseApiClient {
  async analyze(data: TextAnalyzeRequestDto): Promise<TextAnalyzeResponseDto> {
    return this.request<TextAnalyzeResponseDto>(API_ENDPOINTS.TEXT.ANALYZE, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}
