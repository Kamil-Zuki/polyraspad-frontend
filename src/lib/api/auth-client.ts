import { BaseApiClient } from "./base-api-client";
import { API_ENDPOINTS } from "../constants";
import {
  UserLoginDto,
  UserRegistrationDto,
  TokenResponseDto,
  UserInfoDto,
  AuthResponseDto,
  UpdateUsernameDto,
  UpdateAvatarUrlDto,
  UpdatePasswordDto,
  ConfirmEmailDto,
} from "./types";

export class AuthClient extends BaseApiClient {
  async login(data: UserLoginDto): Promise<TokenResponseDto> {
    return this.request<TokenResponseDto>(API_ENDPOINTS.AUTH.LOGIN, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async register(data: UserRegistrationDto): Promise<AuthResponseDto> {
    return this.request<AuthResponseDto>(API_ENDPOINTS.AUTH.REGISTER, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getUserInfo(): Promise<UserInfoDto> {
    return this.request<UserInfoDto>(API_ENDPOINTS.AUTH.ME);
  }

  async refreshToken(refreshToken: string): Promise<TokenResponseDto> {
    return this.request<TokenResponseDto>(API_ENDPOINTS.AUTH.REFRESH, {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }

  async logout(refreshToken?: string): Promise<AuthResponseDto> {
    const token = refreshToken || (typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null);
    return this.request<AuthResponseDto>(API_ENDPOINTS.AUTH.LOGOUT, {
      method: "POST",
      body: JSON.stringify({ refreshToken: token || "" }),
    });
  }

  async updateUsername(data: UpdateUsernameDto): Promise<AuthResponseDto> {
    return this.request<AuthResponseDto>(API_ENDPOINTS.AUTH.UPDATE_USERNAME, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updateAvatarUrl(data: UpdateAvatarUrlDto): Promise<AuthResponseDto> {
    return this.request<AuthResponseDto>(API_ENDPOINTS.AUTH.UPDATE_AVATAR_URL, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updatePassword(data: UpdatePasswordDto): Promise<AuthResponseDto> {
    return this.request<AuthResponseDto>(API_ENDPOINTS.AUTH.UPDATE_PASSWORD, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async confirmEmail(data: ConfirmEmailDto): Promise<AuthResponseDto> {
    const params = new URLSearchParams();
    params.append('userId', data.userId);
    params.append('token', data.token);
    return this.request<AuthResponseDto>(`${API_ENDPOINTS.AUTH.CONFIRM_EMAIL}?${params.toString()}`);
  }

  async resendConfirmationEmail(email: string): Promise<AuthResponseDto> {
    return this.request<AuthResponseDto>(API_ENDPOINTS.AUTH.RESEND_CONFIRMATION, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }
}
