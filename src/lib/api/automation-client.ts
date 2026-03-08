import { BaseApiClient } from "./base-api-client";
import { API_ENDPOINTS } from "../constants";
import type {
  ApproveMiningDraftsRequestDto,
  AutomationJobDto,
  CopilotReviewFeedbackDto,
  CopilotReviewFeedbackRequestDto,
  CreateAutomationJobDto,
  DailyAutopilotDto,
  ExperimentAssignmentDto,
  NotificationPreferencesDto,
  TrackExperimentEventDto,
  UpdateNotificationPreferencesDto,
  ZeroTouchMiningRequestDto,
  ZeroTouchMiningResponseDto,
  NextBestActionDto,
  CardResponseDto,
} from "./types";

export class AutomationClient extends BaseApiClient {
  async getDailyAutopilot(projectId: string, deckId?: string): Promise<DailyAutopilotDto> {
    const params = new URLSearchParams({ projectId });
    if (deckId) params.append("deckId", deckId);
    return this.request<DailyAutopilotDto>(`${API_ENDPOINTS.AUTOMATION.AUTOPILOT}?${params.toString()}`);
  }

  async getNextBestActions(
    reviewsLeft: number,
    newLeft: number,
    deckId?: string
  ): Promise<NextBestActionDto[]> {
    const params = new URLSearchParams({
      reviewsLeft: reviewsLeft.toString(),
      newLeft: newLeft.toString(),
    });
    if (deckId) params.append("deckId", deckId);
    return this.request<NextBestActionDto[]>(
      `${API_ENDPOINTS.AUTOMATION.RECOMMENDATIONS}?${params.toString()}`
    );
  }

  async getNotificationPreferences(): Promise<NotificationPreferencesDto> {
    return this.request<NotificationPreferencesDto>(API_ENDPOINTS.AUTOMATION.NOTIFICATION_PREFERENCES);
  }

  async updateNotificationPreferences(
    data: UpdateNotificationPreferencesDto
  ): Promise<NotificationPreferencesDto> {
    return this.request<NotificationPreferencesDto>(API_ENDPOINTS.AUTOMATION.NOTIFICATION_PREFERENCES, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async createJob(data: CreateAutomationJobDto): Promise<AutomationJobDto> {
    return this.request<AutomationJobDto>(API_ENDPOINTS.AUTOMATION.JOBS, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getJob(jobId: string): Promise<AutomationJobDto> {
    return this.request<AutomationJobDto>(API_ENDPOINTS.AUTOMATION.JOB(jobId));
  }

  async retryJob(jobId: string): Promise<AutomationJobDto> {
    return this.request<AutomationJobDto>(API_ENDPOINTS.AUTOMATION.JOB_RETRY(jobId), {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  async resumeJob(jobId: string): Promise<AutomationJobDto> {
    return this.request<AutomationJobDto>(API_ENDPOINTS.AUTOMATION.JOB_RESUME(jobId), {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  async suggestMiningDrafts(data: ZeroTouchMiningRequestDto): Promise<ZeroTouchMiningResponseDto> {
    return this.request<ZeroTouchMiningResponseDto>(API_ENDPOINTS.AUTOMATION.MINING_SUGGEST, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async approveMiningDrafts(data: ApproveMiningDraftsRequestDto): Promise<CardResponseDto[]> {
    return this.request<CardResponseDto[]>(API_ENDPOINTS.AUTOMATION.MINING_APPROVE, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getCopilotReviewFeedback(
    data: CopilotReviewFeedbackRequestDto
  ): Promise<CopilotReviewFeedbackDto> {
    return this.request<CopilotReviewFeedbackDto>(API_ENDPOINTS.AUTOMATION.COPILOT_REVIEW_FEEDBACK, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getExperimentAssignment(key: string): Promise<ExperimentAssignmentDto> {
    const params = new URLSearchParams({ key });
    return this.request<ExperimentAssignmentDto>(
      `${API_ENDPOINTS.AUTOMATION.EXPERIMENT_ASSIGNMENT}?${params.toString()}`
    );
  }

  async trackExperimentEvent(data: TrackExperimentEventDto): Promise<void> {
    await this.request(API_ENDPOINTS.AUTOMATION.EXPERIMENT_EVENTS, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}
