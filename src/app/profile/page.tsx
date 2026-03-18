"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { UserSettingsForm } from "@/components/settings/user-settings-form"

/**
 * Страница профиля: шапка с аватаром/именем + настройки в том же стиле (не отдельная «сухая» settings).
 */
export default function ProfilePage() {
  const { user } = useAuth()
  const displayName = user?.userName || user?.email?.split("@")[0] || "User"
  const email = user?.email ?? ""
  const initial = (user?.userName?.[0] || user?.email?.[0] || "?").toUpperCase()

  return (
    <ProtectedRoute>
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 relative custom-scroll h-full">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-primary/8 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          <header className="glass-panel border border-app-border rounded-2xl p-8 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div
                className="h-24 w-24 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-3xl font-bold text-white shadow-lg shrink-0 border border-white/10"
                aria-hidden
              >
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate">
                  {displayName}
                </h1>
                {email ? (
                  <p className="text-gray-400 text-sm mt-1 truncate" title={email}>
                    {email}
                  </p>
                ) : (
                  <p className="text-gray-500 text-sm mt-1">Войдите, чтобы увидеть email</p>
                )}
                <p className="text-xs text-gray-500 mt-3">
                  Цели, язык интерфейса и уведомления — ниже. Старый адрес /settings перенаправляет сюда.
                </p>
              </div>
            </div>
          </header>

          <section className="glass-panel border border-app-border rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-white mb-1">Preferences</h2>
            <p className="text-sm text-gray-500 mb-6">Ежедневные цели, суточный сброс, уведомления</p>
            <UserSettingsForm variant="profile" />
          </section>
        </div>
      </div>
    </ProtectedRoute>
  )
}
