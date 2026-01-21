"use client"

import { createContext, useContext, ReactNode } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import { UserInfoDto } from "@/lib/api/types"
import { queryKeys } from "@/lib/react-query/queries"

interface AuthContextType {
  user: UserInfoDto | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, confirmPassword: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  // Используем React Query для управления состоянием пользователя
  const {
    data: user,
    isLoading,
    refetch: refreshUser,
  } = useQuery({
    queryKey: queryKeys.userInfo,
    queryFn: () => apiClient.getUserInfo(),
    enabled: typeof window !== "undefined" && !!localStorage.getItem("accessToken"),
    retry: false,
  })

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiClient.login({ email, password })
      localStorage.setItem("accessToken", response.accessToken)
      localStorage.setItem("refreshToken", response.refreshToken)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userInfo })
    },
  })

  const registerMutation = useMutation({
    mutationFn: async ({
      email,
      password,
      confirmPassword,
    }: {
      email: string
      password: string
      confirmPassword: string
    }) => {
      await apiClient.register({ email, password, confirmPassword })
      const response = await apiClient.login({ email, password })
      localStorage.setItem("accessToken", response.accessToken)
      localStorage.setItem("refreshToken", response.refreshToken)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userInfo })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem("refreshToken")
      if (refreshToken) {
        await apiClient.logout(refreshToken)
      }
    },
    onSuccess: () => {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      queryClient.clear()
    },
  })

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password })
  }

  const register = async (email: string, password: string, confirmPassword: string) => {
    await registerMutation.mutateAsync({ email, password, confirmPassword })
  }

  const logout = async () => {
    await logoutMutation.mutateAsync()
  }

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser: () => refreshUser(),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
