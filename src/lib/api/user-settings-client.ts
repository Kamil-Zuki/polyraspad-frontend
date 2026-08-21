import { BaseApiClient } from "./base-api-client";
import { API_ENDPOINTS } from "../constants";
import {
  UserSettingsResponseDto,
  UpdateUserSettingsDto,
} from "./types";

export class UserSettingsClient extends BaseApiClient {
  async getUserSettings(): Promise<UserSettingsResponseDto> {
    return this.request<UserSettingsResponseDto>(API_ENDPOINTS.USER_SETTINGS.GET);
  }

  async updateUserSettings(data: UpdateUserSettingsDto): Promise<UserSettingsResponseDto> {
    return this.request<UserSettingsResponseDto>(API_ENDPOINTS.USER_SETTINGS.UPDATE, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
}
