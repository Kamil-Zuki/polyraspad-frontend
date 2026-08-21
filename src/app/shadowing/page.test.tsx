import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import ShadowingPage from "./page"
import type { RecordingResult } from "@/lib/shadowing/shadowing-audio"

const mockProject = { id: "proj-1", title: "Test", sourceLang: "en", targetLang: "ru" }

vi.mock("@/contexts/project-context", () => ({
  useProjectContext: () => ({ currentProject: mockProject, setCurrentProject: vi.fn(), isLoading: false }),
}))

const generateAudioMock = vi.fn().mockResolvedValue({ url: "https://cdn.example/tts.mp3" })
vi.mock("@/lib/api/media-client", () => ({
  generateAudio: (...args: unknown[]) => generateAudioMock(...args),
  formatGenerateAudioUserMessage: (e: unknown) => (e instanceof Error ? e.message : "Audio generation failed."),
}))

const useAudioRecorderMock = vi.fn().mockReturnValue({
  isRecording: false,
  audioBlob: null,
  durationMs: 0,
  start: vi.fn(),
  stop: vi.fn(),
})
vi.mock("@/lib/shadowing/use-audio-recorder", () => ({
  useAudioRecorder: () => useAudioRecorderMock(),
}))

const mockRecording: RecordingResult = {
  blob: new Blob(["audio"], { type: "audio/webm" }),
  url: "blob:mock-recording",
  durationMs: 1500,
}

vi.mock("@/components/shadowing/shadowing-recorder", () => ({
  ShadowingRecorder: ({ onRecordingChange }: { onRecordingChange?: (r: RecordingResult | null) => void }) => {
    const [hasRecording, setHasRecording] = useState(false)
    useEffect(() => {
      if (hasRecording) onRecordingChange?.(mockRecording)
    }, [hasRecording, onRecordingChange])
    return (
      <button type="button" onClick={() => setHasRecording(true)} data-testid="mock-record">
        Record myself
      </button>
    )
  },
}))

vi.mock("@/components/auth/protected-route", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ token: "mock-token", isAuthenticated: true, login: vi.fn(), logout: vi.fn(), isLoading: false }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("sentence=Hello+world&sourceType=reader&sourceTitle=Test+Book"),
}))

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    matches: false,
    media: "",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

afterEach(cleanup)

function renderShadowing() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ShadowingPage />
    </QueryClientProvider>
  )
}

describe("ShadowingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    useAudioRecorderMock.mockReturnValue({
      isRecording: false,
      audioBlob: null,
      durationMs: 0,
      start: vi.fn(),
      stop: vi.fn(),
    })
  })

  it("renders sentence from query params and generates TTS", async () => {
    renderShadowing()

    expect(await screen.findByRole("heading", { name: /Shadowing Practice/i })).toBeInTheDocument()
    expect(screen.getByText(/Hello world/)).toBeInTheDocument()
    await waitFor(() => {
      expect(generateAudioMock).toHaveBeenCalledWith(
        expect.objectContaining({ text: "Hello world", language: "en" })
      )
    })
  })

  it("disables rating buttons when no recording exists", async () => {
    renderShadowing()

    await screen.findByRole("heading", { name: /Shadowing Practice/i })

    const badButton = screen.getByRole("button", { name: /Bad/i })
    expect(badButton).toBeDisabled()
  })

  it("enables rating buttons after a recording is available", async () => {
    renderShadowing()

    await screen.findByRole("heading", { name: /Shadowing Practice/i })

    fireEvent.click(screen.getByTestId("mock-record"))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Bad/i })).not.toBeDisabled()
      expect(screen.getByRole("button", { name: /Okay/i })).not.toBeDisabled()
      expect(screen.getByRole("button", { name: /Good/i })).not.toBeDisabled()
    })
  })
})
