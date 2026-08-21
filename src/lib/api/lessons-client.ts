import { BaseApiClient } from "./base-api-client";
import { GetLessonsResponse, GetLessonResponse, StartLessonResponse } from "./types";

export class LessonsClient extends BaseApiClient {
  async getLessons(projectId: string): Promise<GetLessonsResponse> {
    return this.request<GetLessonsResponse>(`/api/projects/${projectId}/lessons`);
  }

  async getLesson(projectId: string, lessonId: string): Promise<GetLessonResponse> {
    return this.request<GetLessonResponse>(`/api/projects/${projectId}/lessons/${lessonId}`);
  }

  async startLesson(projectId: string, lessonId: string): Promise<StartLessonResponse> {
    return this.request<StartLessonResponse>(`/api/projects/${projectId}/lessons/${lessonId}/start`, {
      method: "POST",
    });
  }

  async restartLesson(projectId: string, lessonId: string): Promise<StartLessonResponse> {
    return this.request<StartLessonResponse>(`/api/projects/${projectId}/lessons/${lessonId}/restart`, {
      method: "POST",
    });
  }

  async completeLesson(projectId: string, lessonId: string): Promise<void> {
    return this.request<void>(`/api/projects/${projectId}/lessons/${lessonId}/complete`, {
      method: "POST",
    });
  }
}
