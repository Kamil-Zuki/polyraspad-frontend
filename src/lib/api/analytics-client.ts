import { BaseApiClient } from "./base-api-client";
import { API_ENDPOINTS } from "../constants";
import {
  VocabularyStatsDto,
  HeatmapDto,
  DailySummaryDto,
  SkillBalanceDto,
} from "./types";

export class AnalyticsClient extends BaseApiClient {
  async getVocabularyStats(projectId: string): Promise<VocabularyStatsDto> {
    return this.request<VocabularyStatsDto>(API_ENDPOINTS.ANALYTICS.VOCABULARY(projectId));
  }

  async getHeatmap(projectId?: string, year?: number): Promise<HeatmapDto> {
    return this.request<HeatmapDto>(API_ENDPOINTS.ANALYTICS.HEATMAP(projectId, year));
  }

  async getDailySummary(projectId?: string): Promise<DailySummaryDto> {
    return this.request<DailySummaryDto>(API_ENDPOINTS.ANALYTICS.DAILY(projectId));
  }

  async getSkillBalance(projectId: string): Promise<SkillBalanceDto> {
    return this.request<SkillBalanceDto>(API_ENDPOINTS.ANALYTICS.SKILLS(projectId));
  }
}
