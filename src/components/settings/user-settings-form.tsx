"use client"

// Биллинг и смена пароля: в IA (Docs) указаны для /profile; в PVS REST API нет эндпоинтов.
// Реализация делегируется Identity Service / внешнему сервису. Помечены в UI как out of scope.
import { useState, useEffect } from "react"
import { useUserSettings, useUpdateUserSettings } from "@/lib/react-query/queries"
import { apiClient } from "@/lib/api"
import type { NotificationPreferencesDto, UpdateUserSettingsDto } from "@/lib/api/types"

type UserSettingsFormProps = {
  /** Вариант для страницы профиля: без дублирующего заголовка «User Settings». */
  variant?: "default" | "profile"
}

export function UserSettingsForm({ variant = "default" }: UserSettingsFormProps) {
  const { data: settings, isLoading, error } = useUserSettings()
  const updateSettings = useUpdateUserSettings()

  const [rolloverHour, setRolloverHour] = useState(4)
  const [dailyGoalNew, setDailyGoalNew] = useState(20)
  const [dailyGoalReview, setDailyGoalReview] = useState(100)
  const [interfaceLanguage, setInterfaceLanguage] = useState("en")
  const [isEditing, setIsEditing] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferencesDto | null>(null)
  const [initialNotificationPrefs, setInitialNotificationPrefs] = useState<NotificationPreferencesDto | null>(null)

  useEffect(() => {
    if (settings) {
      setRolloverHour(settings.rolloverHour)
      setDailyGoalNew(settings.dailyGoalNew)
      setDailyGoalReview(settings.dailyGoalReview)
      setInterfaceLanguage(settings.interfaceLanguage)
    }
  }, [settings])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const prefs = await apiClient.automation.getNotificationPreferences()
        if (!cancelled) {
          setNotificationPrefs(prefs)
          setInitialNotificationPrefs(prefs)
        }
      } catch {
        if (!cancelled) {
          setNotificationPrefs(null)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">Failed to load user settings</p>
      </div>
    )
  }

  if (!settings) {
    return null
  }

  const handleSave = async () => {
    setErrorMessage("")

    const updateData: UpdateUserSettingsDto = {
      rolloverHour: rolloverHour !== settings.rolloverHour ? rolloverHour : null,
      dailyGoalNew: dailyGoalNew !== settings.dailyGoalNew ? dailyGoalNew : null,
      dailyGoalReview: dailyGoalReview !== settings.dailyGoalReview ? dailyGoalReview : null,
      interfaceLanguage: interfaceLanguage !== settings.interfaceLanguage ? interfaceLanguage : null,
    }

    try {
      await updateSettings.mutateAsync(updateData)
      if (notificationPrefs) {
        const updatedPrefs = await apiClient.automation.updateNotificationPreferences({
          enableStudyReminders: notificationPrefs.enableStudyReminders,
          enableStreakRiskAlerts: notificationPrefs.enableStreakRiskAlerts,
          enableBacklogAlerts: notificationPrefs.enableBacklogAlerts,
          enableContributionEvents: notificationPrefs.enableContributionEvents,
          enableMarketplaceEvents: notificationPrefs.enableMarketplaceEvents,
          pushEnabled: notificationPrefs.pushEnabled,
          emailEnabled: notificationPrefs.emailEnabled,
          inAppEnabled: notificationPrefs.inAppEnabled,
          quietHoursStart: notificationPrefs.quietHoursStart,
          quietHoursEnd: notificationPrefs.quietHoursEnd,
        })
        setNotificationPrefs(updatedPrefs)
        setInitialNotificationPrefs(updatedPrefs)
      }
      setIsEditing(false)
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update settings")
    }
  }

  const handleCancel = () => {
    setRolloverHour(settings.rolloverHour)
    setDailyGoalNew(settings.dailyGoalNew)
    setDailyGoalReview(settings.dailyGoalReview)
    setInterfaceLanguage(settings.interfaceLanguage)
    if (initialNotificationPrefs) {
      setNotificationPrefs({ ...initialNotificationPrefs })
    }
    setIsEditing(false)
    setErrorMessage("")
  }

  const isProfile = variant === "profile"

  return (
    <div className={isProfile ? "space-y-4" : "space-y-6"}>
      {!isProfile && (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">User Settings</h2>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-brand-purple hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
            >
              <i className="fas fa-edit mr-2" />
              Edit
            </button>
          )}
        </div>
      )}
      {isProfile && !isEditing && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-brand-purple/80 hover:bg-brand-purple text-white rounded-lg transition-colors text-sm font-medium"
          >
            <i className="fas fa-edit mr-2" />
            Edit preferences
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {errorMessage}
        </div>
      )}

      <div
        className={
          isProfile
            ? "rounded-xl p-0 sm:p-1"
            : "glass-panel rounded-xl p-6"
        }
      >
        <div className={isProfile ? "space-y-8" : "space-y-6"}>
          {/* Daily Goals */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Daily Goals</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Cards Goal
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    value={dailyGoalNew}
                    onChange={(e) => setDailyGoalNew(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-white/10 rounded-lg bg-dark-800 text-white focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/50 transition"
                  />
                ) : (
                  <p className="text-white font-medium">{settings.dailyGoalNew}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Review Cards Goal
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    value={dailyGoalReview}
                    onChange={(e) => setDailyGoalReview(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-white/10 rounded-lg bg-dark-800 text-white focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/50 transition"
                  />
                ) : (
                  <p className="text-white font-medium">{settings.dailyGoalReview}</p>
                )}
              </div>
            </div>
          </div>

          {/* Time Settings */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Time Settings</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rollover Hour (when the day resets)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={rolloverHour}
                  onChange={(e) => setRolloverHour(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-white/10 rounded-lg bg-dark-800 text-white focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/50 transition"
                />
              ) : (
                <p className="text-white font-medium">{settings.rolloverHour}:00</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                The hour when your daily goals reset (0-23)
              </p>
            </div>
          </div>

          {/* Interface Language */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Interface</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Interface Language
              </label>
              {isEditing ? (
                <select
                  value={interfaceLanguage}
                  onChange={(e) => setInterfaceLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-white/10 rounded-lg bg-dark-800 text-white focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/50 transition"
                >
                  <option value="en">English</option>
                  <option value="ru">Русский</option>
                  <option value="de">Deutsch</option>
                  <option value="es">Español</option>
                </select>
              ) : (
                <p className="text-white font-medium">
                  {interfaceLanguage === "en" ? "English" : 
                   interfaceLanguage === "ru" ? "Русский" :
                   interfaceLanguage === "de" ? "Deutsch" :
                   interfaceLanguage === "es" ? "Español" : interfaceLanguage}
                </p>
              )}
            </div>
          </div>

          {/* Streak Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Activity</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Streak
                </label>
                <p className="text-white font-medium text-2xl">{settings.currentStreak} days</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Streak
                </label>
                <p className="text-white font-medium text-2xl">{settings.maxStreak} days</p>
              </div>
            </div>
          </div>

          {/* Биллинг и смена пароля — out of scope: нет эндпоинтов в PVS API (см. IA: /profile). */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Биллинг</h3>
            <p className="text-sm text-gray-400">
              Управление подпиской и способами оплаты — в профиле аккаунта (out of scope для текущей версии).
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Смена пароля</h3>
            <p className="text-sm text-gray-400">
              Смена пароля управляется в профиле аккаунта (Identity Service; out of scope для текущей версии).
            </p>
          </div>

          {/* Notification Preferences */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Notification Preferences</h3>
            {notificationPrefs ? (
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    disabled={!isEditing}
                    checked={notificationPrefs.enableStudyReminders}
                    onChange={(e) =>
                      setNotificationPrefs((prev) =>
                        prev ? { ...prev, enableStudyReminders: e.target.checked } : prev
                      )
                    }
                  />
                  Study reminders
                </label>
                <label className="flex items-center gap-3 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    disabled={!isEditing}
                    checked={notificationPrefs.enableStreakRiskAlerts}
                    onChange={(e) =>
                      setNotificationPrefs((prev) =>
                        prev ? { ...prev, enableStreakRiskAlerts: e.target.checked } : prev
                      )
                    }
                  />
                  Streak risk alerts
                </label>
                <label className="flex items-center gap-3 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    disabled={!isEditing}
                    checked={notificationPrefs.pushEnabled}
                    onChange={(e) =>
                      setNotificationPrefs((prev) =>
                        prev ? { ...prev, pushEnabled: e.target.checked } : prev
                      )
                    }
                  />
                  Push channel
                </label>
                <label className="flex items-center gap-3 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    disabled={!isEditing}
                    checked={notificationPrefs.emailEnabled}
                    onChange={(e) =>
                      setNotificationPrefs((prev) =>
                        prev ? { ...prev, emailEnabled: e.target.checked } : prev
                      )
                    }
                  />
                  Email channel
                </label>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Notification preferences are temporarily unavailable.</p>
            )}
          </div>

          {isEditing && (
            <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-300 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateSettings.isPending}
                className="px-4 py-2 bg-brand-purple hover:bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-[0_0_15px_rgba(139,92,246,0.3)]"
              >
                {updateSettings.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

