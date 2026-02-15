import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/index";
import { userQueryKeys } from "./constants";
import type {
  UserInfoDto,
  UserSettingsResponseDto,
  UpdateUserSettingsDto,
  UpdateUsernameDto,
  UpdatePasswordDto,
  ConfirmEmailDto,
} from "../api/types";

// User queries
export function useUserInfo() {
  return useQuery({
    queryKey: userQueryKeys.userInfo,
    queryFn: () => apiClient.auth.getUserInfo(),
    retry: false,
  });
}

// User Settings queries
export function useUserSettings() {
  return useQuery({
    queryKey: userQueryKeys.userSettings,
    queryFn: () => apiClient.userSettings.getUserSettings(),
  });
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserSettingsDto) => apiClient.userSettings.updateUserSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.userSettings });
    },
  });
}

// Auth mutations
export function useUpdateUsername() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUsernameDto) => apiClient.auth.updateUsername(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.userInfo });
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (data: UpdatePasswordDto) => apiClient.auth.updatePassword(data),
  });
}

export function useConfirmEmail() {
  return useMutation({
    mutationFn: (data: ConfirmEmailDto) => apiClient.auth.confirmEmail(data),
  });
}