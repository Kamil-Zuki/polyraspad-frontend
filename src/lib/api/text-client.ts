import { API_ENDPOINTS } from "../constants";
import { BaseApiClient } from "./base-api-client";
import type { TextAnalyzeRequestDto, TextAnalyzeResponseDto } from "./types";

/**
 * Клиент анализа текста для Reader (POST /api/text/analyze).
 */
export class TextClient extends BaseApiClient {
  analyze(payload: TextAnalyzeRequestDto): Promise<TextAnalyzeResponseDto> {
    return this.request<TextAnalyzeResponseDto>(API_ENDPOINTS.TEXT.ANALYZE, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}
