"use client"

import { useCallback, useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api/index"
import { queryKeys } from "@/lib/react-query/index"

function legacyStorageKey(userId: string) {
  return `pvs_profile_avatar_url_${userId}`
}

/**
 * Аватар берётся из аккаунта (GET /api/Auth/me). Изменение — через API (сохранение в БД).
 */
export function useProfileAvatar() {
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ""
  const migratedRef = useRef(false)

  const avatarUrl = user?.avatarUrl ?? null

  // Одноразово переносим URL из старого localStorage в аккаунт (раньше аватар не сохранялся на сервере)
  useEffect(() => {
    if (typeof window === "undefined" || !userId || migratedRef.current) return
    if (user?.avatarUrl) return
    const legacy = (() => {
      try {
        return localStorage.getItem(legacyStorageKey(userId))?.trim() ?? ""
      } catch {
        return ""
      }
    })()
    if (!legacy) return
    migratedRef.current = true
    let cancelled = false
    void (async () => {
      try {
        await apiClient.auth.updateAvatarUrl({ avatarUrl: legacy })
        try {
          localStorage.removeItem(legacyStorageKey(userId))
        } catch {
          /* ignore */
        }
        if (!cancelled) {
          await queryClient.invalidateQueries({ queryKey: queryKeys.userInfo })
          await refreshUser()
        }
      } catch {
        migratedRef.current = false
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, user?.avatarUrl, queryClient, refreshUser])

  const setAvatarUrl = useCallback(
    async (url: string | null) => {
      if (!userId) {
        throw new Error("You need to be signed in to update your profile photo.")
      }

      const nextAvatarUrl = url?.trim() ? url.trim() : null

      await apiClient.auth.updateAvatarUrl({ avatarUrl: nextAvatarUrl ?? "" })

      queryClient.setQueryData(queryKeys.userInfo, (current: typeof user | undefined) =>
        current
          ? {
              ...current,
              avatarUrl: nextAvatarUrl,
            }
          : current,
      )

      await queryClient.invalidateQueries({ queryKey: queryKeys.userInfo })
      await refreshUser()
    },
    [userId, queryClient, refreshUser],
  )

  return { avatarUrl, setAvatarUrl, userId }
}
