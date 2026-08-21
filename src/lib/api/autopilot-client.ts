import { BaseApiClient } from './base-api-client';

export interface DailyAutopilotTask {
  taskType: string;
  title: string;
  description: string;
  isCompleted: boolean;
  actionUrl: string;
  durationMinutes: number;
}

export interface GetDailyAutopilotPlanResponse {
  tasks: DailyAutopilotTask[];
}

export interface TrackSkillResponse {
  /** Total accumulated value for this skill today */
  totalValueToday: number;
  /** Whether the completion threshold has been reached */
  isCompleted: boolean;
}

/**
 * Skill type IDs matching the SkillTypes seed data in DB.
 * Use these constants instead of magic numbers.
 */
export const SKILL_TYPE_ID = {
  READING: 1,
  LISTENING: 2,
  WRITING: 3,
  SPEAKING: 4,
} as const;

export class AutopilotClient extends BaseApiClient {
  async getDailyPlan(projectId: string): Promise<GetDailyAutopilotPlanResponse> {
    return this.request<GetDailyAutopilotPlanResponse>(
      `/api/v1/projects/${projectId}/autopilot/daily-plan`,
    );
  }

  /**
   * Records skill activity for today. Value is accumulated (upsert).
   * @param projectId  Current project ID
   * @param skillTypeId  Use SKILL_TYPE_ID constants (1=reading, 2=listening, 3=writing, 4=speaking)
   * @param value  Minutes (reading/listening) or exercise count (writing/speaking)
   */
  async trackSkill(
    projectId: string,
    skillTypeId: number,
    value: number,
  ): Promise<TrackSkillResponse> {
    return this.request<TrackSkillResponse>(
      `/api/v1/projects/${projectId}/autopilot/track-skill`,
      {
        method: 'POST',
        body: JSON.stringify({ skillTypeId, value }),
      },
    );
  }
}
