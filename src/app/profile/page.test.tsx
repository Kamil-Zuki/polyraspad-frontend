import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import ProfilePage from "./page"

const logoutMock = vi.fn()
const pushMock = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock("@/components/auth/protected-route", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/components/settings/user-settings-form", () => ({
  UserSettingsForm: () => <div>Settings form</div>,
}))

vi.mock("@/hooks/use-profile-avatar", () => ({
  useProfileAvatar: () => ({ avatarUrl: null as string | null, setAvatarUrl: vi.fn() }),
}))

vi.mock("@/components/profile/profile-identity-section", () => ({
  ProfileIdentitySection: () => <div>Identity section</div>,
}))

vi.mock("@/components/profile/profile-billing-section", () => ({
  ProfileBillingSection: () => <div>Billing section</div>,
}))

vi.mock("@/components/profile/profile-studio-fsrs-section", () => ({
  ProfileStudioFsrsSection: () => <div>Studio FSRS section</div>,
}))

vi.mock("@/components/profile/profile-studio-tts-section", () => ({
  ProfileStudioTtsSection: () => <div>Studio TTS section</div>,
}))

vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      userName: "Zuko",
      email: "zuko@example.com",
      emailConfirmed: true,
    },
    logout: logoutMock,
  }),
}))

describe("Profile page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    logoutMock.mockResolvedValue(undefined)
  })

  it("logs the user out from the profile page", async () => {
    render(<ProfilePage />)

    fireEvent.click(screen.getByRole("button", { name: /log out/i }))

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalledTimes(1)
      expect(pushMock).toHaveBeenCalledWith("/auth")
    })
  })
})
