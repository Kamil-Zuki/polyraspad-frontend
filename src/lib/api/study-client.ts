import { BaseApiClient } from "./base-api-client";
import { API_ENDPOINTS } from "../constants";
import type {
  StartSessionRequestDto,
  StudySessionDto,
  CardStudyDto,
  ReviewCardRequestDto,
  ReviewResponseDto,
  UndoReviewRequestDto,
  UndoResponseDto,
} from "./types";

export class StudyClient extends BaseApiClient {
  async startSession(request: StartSessionRequestDto): Promise<StudySessionDto> {
    return this.request<StudySessionDto>(API_ENDPOINTS.STUDY.START_SESSION, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * Returns next card for the session, or null when session is finished (204 No Content).
   */
  async getNextCard(sessionId: string): Promise<CardStudyDto | null> {
    return this.requestOrNoContent<CardStudyDto>(
      API_ENDPOINTS.STUDY.NEXT_CARD(sessionId)
    );
  }

  async submitReview(
    sessionId: string,
    request: ReviewCardRequestDto
  ): Promise<ReviewResponseDto> {
    return this.request<ReviewResponseDto>(
      API_ENDPOINTS.STUDY.SUBMIT_REVIEW(sessionId),
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
  }

  async undoReview(
    sessionId: string,
    request?: UndoReviewRequestDto | null
  ): Promise<UndoResponseDto> {
    return this.request<UndoResponseDto>(
      API_ENDPOINTS.STUDY.UNDO(sessionId),
      {
        method: "POST",
        body: JSON.stringify(request ?? {}),
      }
    );
  }
}
