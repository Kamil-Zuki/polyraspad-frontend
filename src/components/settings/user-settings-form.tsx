"use client"

// Биллинг и смена пароля: в IA (Docs) указаны для /profile; в PVS REST API нет эндпоинтов.
// Реализация делегируется Identity Service / внешнему сервису. Помечены в UI как out of scope.
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useUserSettings, useUpdateUserSettings } from "@/lib/react-query/queries"
import { apiClient } from "@/lib/api"
import type { NotificationPreferencesDto, UpdateUserSettingsDto } from "@/lib/api/types"
import { setLocaleCookie } from "@/i18n/locale-cookie"

type UserSettingsFormProps = {
  /** Вариант для страницы профиля: без дублирующего заголовка «User Settings». */
  variant?: "default" | "profile"
}

function interfaceLanguageLabel(code: string): string {
  const labels: Record<string, string> = {
    en: "English",
    ru: "Русский",
    de: "German",
    es: "Spanish",
  }
  return labels[code] ?? code
}

const profileFieldClass =
  "w-full rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2.5 text-sm text-white shadow-inner shadow-black/20 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/35 focus:border-brand-primary/40"

const profileCardClass =
  "rounded-2xl border border-white/[0.08] bg-black/25 px-5 py-5 backdrop-blur-sm"

export function UserSettingsForm({ variant = "default" }: UserSettingsFormProps) {
  const router = useRouter()
  const t = useTranslations("settings")
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
      if (updateData.interfaceLanguage) {
        setLocaleCookie(updateData.interfaceLanguage as "en" | "ru")
        router.refresh()
      }

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

  if (isProfile) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-end gap-3">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="btn-primary text-sm px-4 py-2"
            >
              Edit preferences
            </button>
          ) : null}
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/15 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className={profileCardClass}>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
              Daily goals
            </h3>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
              Targets for new cards and reviews each day.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/6 bg-white/[0.03] px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">New</p>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    value={dailyGoalNew}
                    onChange={(e) => setDailyGoalNew(parseInt(e.target.value, 10) || 0)}
                    className={`${profileFieldClass} mt-2`}
                  />
                ) : (
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                    {settings.dailyGoalNew}
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-white/6 bg-white/[0.03] px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Review</p>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    value={dailyGoalReview}
                    onChange={(e) => setDailyGoalReview(parseInt(e.target.value, 10) || 0)}
                    className={`${profileFieldClass} mt-2`}
                  />
                ) : (
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                    {settings.dailyGoalReview}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className={profileCardClass}>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
              Day boundary
            </h3>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
              When the clock rolls over, daily goals start fresh (local time, 0–23).
            </p>
            <div className="mt-4">
              <label className="sr-only" htmlFor="profile-rollover-hour">
                Rollover hour
              </label>
              {isEditing ? (
                <input
                  id="profile-rollover-hour"
                  type="number"
                  min="0"
                  max="23"
                  value={rolloverHour}
                  onChange={(e) => setRolloverHour(parseInt(e.target.value, 10) || 0)}
                  className={profileFieldClass}
                />
              ) : (
                <p className="text-2xl font-semibold tabular-nums text-white">
                  {String(settings.rolloverHour).padStart(2, "0")}:00
                </p>
              )}
            </div>
          </div>

          <div className={profileCardClass}>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
              Interface
            </h3>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">Language for UI copy in the app.</p>
            <div className="mt-4">
              <label className="sr-only" htmlFor="profile-interface-lang">
                Interface language
              </label>
              {isEditing ? (
                <select
                  id="profile-interface-lang"
                  value={interfaceLanguage}
                  onChange={(e) => setInterfaceLanguage(e.target.value)}
                  className={profileFieldClass}
                >
                  <option value="en">English</option>
                  <option value="ru">Russian</option>
                  <option value="de">German</option>
                  <option value="es">Spanish</option>
                  <option value="ko">Korean</option>
                  <option value="ja">Japanese</option>
                  <option value="fr">French</option>
                  <option value="zh">Chinese</option>
                </select>
              ) : (
                <p className="text-lg font-medium text-white">{interfaceLanguageLabel(interfaceLanguage)}</p>
              )}
            </div>
          </div>

          <div className={profileCardClass}>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
              Streaks
            </h3>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">Study activity from your account.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/6 bg-white/[0.03] px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Current</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                  {settings.currentStreak}
                  <span className="ml-1 text-sm font-normal text-gray-500">d</span>
                </p>
              </div>
              <div className="rounded-xl border border-white/6 bg-white/[0.03] px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Best</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                  {settings.maxStreak}
                  <span className="ml-1 text-sm font-normal text-gray-500">d</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={profileCardClass}>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
            Notifications
          </h3>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            Reminders and delivery channels when automation is connected.
          </p>
          <div className="mt-4">
            {notificationPrefs ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["enableStudyReminders", "Study reminders"],
                    ["enableStreakRiskAlerts", "Streak risk alerts"],
                    ["pushEnabled", "Push"],
                    ["emailEnabled", "Email"],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-sm text-gray-200 ${!isEditing ? "opacity-80" : ""}`}
                  >
                    <input
                      type="checkbox"
                      disabled={!isEditing}
                      checked={notificationPrefs[key]}
                      onChange={(e) =>
                        setNotificationPrefs((prev) =>
                          prev ? { ...prev, [key]: e.target.checked } : prev
                        )
                      }
                      className="h-4 w-4 rounded border-white/20 bg-transparent text-brand-primary focus:ring-brand-primary/40"
                    />
                    {label}
                  </label>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-4 py-3 text-sm leading-relaxed text-amber-100/90">
                Notification settings need the automation service. They&apos;ll show up here when the
                API is available.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
            Billing &amp; password
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">
            Subscription and payment methods live in your main account profile. Password changes go
            through the identity service — not wired in this app build.
          </p>
        </div>

        {isEditing ? (
          <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
            <button type="button" onClick={handleCancel} className="btn-secondary text-sm px-4 py-2">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={updateSettings.isPending}
              className="btn-primary text-sm px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateSettings.isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-6">
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

      {errorMessage && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {errorMessage}
        </div>
      )}

      <div className="glass-panel rounded-xl p-6">
        <div className="space-y-6">
          {/* Daily Goals */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Daily Goals</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Cards Goal</label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    value={dailyGoalNew}
                    onChange={(e) => setDailyGoalNew(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-white/10 rounded-lg bg-app-bg text-white focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/50 transition"
                  />
                ) : (
                  <p className="text-white font-medium">{settings.dailyGoalNew}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Review Cards Goal</label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    value={dailyGoalReview}
                    onChange={(e) => setDailyGoalReview(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-white/10 rounded-lg bg-app-bg text-white focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/50 transition"
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
                  className="w-full px-3 py-2 border border-white/10 rounded-lg bg-app-bg text-white focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/50 transition"
                />
              ) : (
                <p className="text-white font-medium">{settings.rolloverHour}:00</p>
              )}
              <p className="text-xs text-gray-400 mt-1">The hour when your daily goals reset (0-23)</p>
            </div>
          </div>

          {/* Interface Language */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Interface</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Interface Language</label>
              {isEditing ? (
                <select
                  value={interfaceLanguage}
                  onChange={(e) => setInterfaceLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-white/10 rounded-lg bg-app-bg text-white focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/50 transition"
                >
                  <option value="en">English</option>
                  <option value="ru">Russian</option>
                  <option value="de">German</option>
                  <option value="es">Spanish</option>
                  <option value="ko">Korean</option>
                  <option value="ja">Japanese</option>
                  <option value="fr">French</option>
                  <option value="zh">Chinese</option>
                </select>
              ) : (
                <p className="text-white font-medium">{interfaceLanguageLabel(interfaceLanguage)}</p>
              )}
            </div>
          </div>

          {/* Streak Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Activity</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Current Streak</label>
                <p className="text-white font-medium text-2xl">{settings.currentStreak} days</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Streak</label>
                <p className="text-white font-medium text-2xl">{settings.maxStreak} days</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Billing</h3>
            <p className="text-sm text-gray-400">
              Subscription and payment management live in the account profile and are outside the scope
              of this app version.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Password</h3>
            <p className="text-sm text-gray-400">
              Password changes are handled by the account profile / identity service and are outside the
              scope of this app version.
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
