"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { UserSettingsForm } from "@/components/settings/user-settings-form"
import { ProfileIdentitySection } from "@/components/profile/profile-identity-section"
import { ProfileBillingSection } from "@/components/profile/profile-billing-section"
import { ProfileStudioFsrsSection } from "@/components/profile/profile-studio-fsrs-section"
import { ProfileStudioTtsSection } from "@/components/profile/profile-studio-tts-section"
import { useProfileAvatar } from "@/hooks/use-profile-avatar"

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { avatarUrl, setAvatarUrl } = useProfileAvatar()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  const displayName = user?.userName || user?.email?.split("@")[0] || "User"
  const email = user?.email ?? ""
  const initial = (user?.userName?.[0] || user?.email?.[0] || "?").toUpperCase()
  const verificationLabel = user?.emailConfirmed ? "Verified account" : "Verification pending"
  const heroStats = [
    { label: "Identity", value: displayName },
    { label: "Email", value: email || "Private" },
    { label: "Photo", value: avatarUrl ? "Synced" : "Not set" },
  ]

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      setLogoutError(null)
      await logout()
      router.push("/auth")
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "Failed to log out")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative custom-scroll h-full">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,130,92,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(84,196,255,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_38%)] pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto space-y-8">
          <header className="glass-panel border border-app-border rounded-[2rem] p-6 sm:p-8 lg:p-10 overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-brand-primary/12 via-white/0 to-brand-secondary/12 pointer-events-none" />
            <div className="relative flex flex-col gap-8">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-[1.75rem] shadow-[0_20px_60px_rgba(0,0,0,0.28)] shrink-0 border border-white/10 overflow-hidden bg-app-bg flex items-center justify-center">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className="h-full w-full bg-gradient-to-br from-brand-primary via-[#ff9365] to-brand-secondary flex items-center justify-center text-4xl font-bold text-white"
                      aria-hidden
                    >
                      {initial}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 text-center lg:text-left">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium tracking-[0.16em] uppercase text-emerald-300">
                      {verificationLabel}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium tracking-[0.16em] uppercase text-gray-300">
                      Profile Studio
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-4 truncate">
                    {displayName}
                  </h1>
                  {email ? (
                    <p className="text-gray-400 text-sm sm:text-base mt-2 truncate" title={email}>
                      {email}
                    </p>
                  ) : (
                    <p className="text-gray-500 text-sm mt-2">Sign in to see your account email.</p>
                  )}
                  <p className="text-sm text-gray-400 mt-4 max-w-2xl leading-6">
                    Studio hub: FSRS per project, identity, and learning defaults in one place.
                  </p>
                </div>
                <div className="lg:self-start lg:ml-auto">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="btn-secondary whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoggingOut ? "Signing out..." : "Log out"}
                  </button>
                  {logoutError && <p className="text-sm text-red-400 mt-3 max-w-xs">{logoutError}</p>}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {heroStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4 backdrop-blur-sm"
                  >
                    <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">{stat.label}</p>
                    <p className="mt-2 text-sm font-medium text-white truncate">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </header>

          <div className="space-y-8">
            <ProfileIdentitySection avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl} />
            <ProfileBillingSection />
            <ProfileStudioFsrsSection />
            <ProfileStudioTtsSection />

            <section className="glass-panel border border-app-border rounded-[2rem] p-6 sm:p-8 h-fit">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-white">Learning &amp; routine</h2>
                  <p className="mt-1 text-sm text-gray-500 leading-relaxed max-w-2xl">
                    Daily study caps, when your day resets, UI language, streaks, and notification
                    channels.
                  </p>
                </div>
                <span
                  className={
                    user?.emailConfirmed
                      ? "inline-flex shrink-0 items-center rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200"
                      : "inline-flex shrink-0 items-center rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-200"
                  }
                >
                  {user?.emailConfirmed ? "Account verified" : "Verify email to sync"}
                </span>
              </div>
              <div className="mt-8">
                <UserSettingsForm variant="profile" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
