"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useUpdateUsername } from "@/lib/react-query/queries"
import { uploadImage } from "@/lib/api/media-client"
import { cn } from "@/lib/utils"

const MIN_NAME_LEN = 3

export type ProfileIdentitySectionProps = {
  avatarUrl: string | null
  setAvatarUrl: (url: string | null) => Promise<void>
}

export function ProfileIdentitySection({ avatarUrl, setAvatarUrl }: ProfileIdentitySectionProps) {
  const { user, refreshUser } = useAuth()
  const updateUsername = useUpdateUsername()

  const [nameInput, setNameInput] = useState("")
  const [nameError, setNameError] = useState("")
  const [nameSaved, setNameSaved] = useState(false)

  const [avatarError, setAvatarError] = useState("")
  const [avatarSaved, setAvatarSaved] = useState(false)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null)
  const pendingPreviewRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const displayInitial = (user?.userName?.[0] || user?.email?.[0] || "?").toUpperCase()

  useEffect(() => {
    setNameInput(user?.userName ?? "")
  }, [user?.userName])

  useEffect(() => {
    return () => {
      if (pendingPreviewRef.current) {
        URL.revokeObjectURL(pendingPreviewRef.current)
        pendingPreviewRef.current = null
      }
    }
  }, [])

  const previewSrc =
    pendingBlob && pendingPreviewRef.current ? pendingPreviewRef.current : avatarUrl || null
  const pendingFileLabel =
    pendingBlob instanceof File ? `${pendingBlob.name} · ${Math.round(pendingBlob.size / 1024)} KB` : null

  const handlePickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.")
      return
    }
    if (pendingPreviewRef.current) {
      URL.revokeObjectURL(pendingPreviewRef.current)
    }
    pendingPreviewRef.current = URL.createObjectURL(file)
    setPendingBlob(file)
    setAvatarError("")
    setAvatarSaved(false)
  }

  const handleUploadAvatar = useCallback(async () => {
    if (!pendingBlob) return
    setAvatarError("")
    setAvatarSaving(true)
    try {
      const { url } = await uploadImage(pendingBlob)
      await setAvatarUrl(url)
      setPendingBlob(null)
      if (pendingPreviewRef.current) {
        URL.revokeObjectURL(pendingPreviewRef.current)
        pendingPreviewRef.current = null
      }
      setAvatarSaved(true)
      setTimeout(() => setAvatarSaved(false), 2500)
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Could not upload the image.")
    } finally {
      setAvatarSaving(false)
    }
  }, [pendingBlob, setAvatarUrl])

  const handleRemoveAvatar = async () => {
    setAvatarError("")
    setAvatarSaving(true)
    try {
      setPendingBlob(null)
      if (pendingPreviewRef.current) {
        URL.revokeObjectURL(pendingPreviewRef.current)
        pendingPreviewRef.current = null
      }
      await setAvatarUrl(null)
      setAvatarSaved(true)
      setTimeout(() => setAvatarSaved(false), 2500)
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Could not remove the photo.")
    } finally {
      setAvatarSaving(false)
    }
  }

  const handleSaveName = async () => {
    const nextName = nameInput.trim()
    setNameError("")
    setNameSaved(false)
    if (nextName.length < MIN_NAME_LEN) {
      setNameError(`Use at least ${MIN_NAME_LEN} characters.`)
      return
    }
    if (nextName === (user?.userName ?? "").trim()) {
      setNameError("There is nothing new to save.")
      return
    }
    try {
      await updateUsername.mutateAsync({ userName: nextName })
      await refreshUser()
      setNameSaved(true)
      setTimeout(() => setNameSaved(false), 2500)
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Could not save the display name.")
    }
  }

  return (
    <section className="glass-panel border border-app-border rounded-[2rem] p-6 sm:p-8 space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Identity and photo</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Upload a profile image and save it directly to your auth user record so it is reused throughout the app.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Persistence</p>
          <p className="mt-1 text-sm text-white">Auth user avatar URL</p>
        </div>
      </div>

      <div className="grid gap-6 lg:gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        <div className="rounded-[1.75rem] border border-white/8 bg-black/20 p-5 sm:p-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div
              className={cn(
                "h-32 w-32 rounded-[1.75rem] border border-white/10 overflow-hidden flex items-center justify-center bg-app-bg shadow-[0_20px_60px_rgba(0,0,0,0.22)]",
                !previewSrc && "bg-gradient-to-br from-brand-primary via-[#ff9365] to-brand-secondary",
              )}
            >
              {previewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary user URL / media storage asset
                <img src={previewSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-5xl font-bold text-white" aria-hidden>
                  {displayInitial}
                </span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-white">Profile photo</p>
              <p className="text-xs text-gray-500">
                JPG, PNG, WebP, or GIF. Upload first, then save the resulting URL back to your account.
              </p>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePickFile} />

          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 text-xs font-medium rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition"
            >
              Choose image
            </button>
            {pendingBlob && (
              <button
                type="button"
                onClick={handleUploadAvatar}
                disabled={avatarSaving}
                className="px-3 py-2 text-xs font-medium rounded-xl bg-brand-primary text-white hover:brightness-110 transition disabled:opacity-60"
              >
                {avatarSaving ? "Uploading..." : "Upload and save"}
              </button>
            )}
            {(avatarUrl || pendingBlob) && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={avatarSaving}
                className="px-3 py-2 text-xs font-medium rounded-xl text-red-300 border border-red-400/15 bg-red-500/5 hover:bg-red-500/10 transition disabled:opacity-60"
              >
                Remove photo
              </button>
            )}
          </div>

          {pendingFileLabel && <p className="mt-4 text-xs text-center text-gray-500">{pendingFileLabel}</p>}
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-5 sm:p-6">
            <label htmlFor="profile-display-name" className="block text-sm font-medium text-gray-300 mb-2">
              Display name
            </label>
            <p className="text-sm text-gray-500 mb-4">
              This name appears in your workspace and anywhere the app needs to identify your account.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <input
                id="profile-display-name"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-white/10 bg-app-bg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                placeholder="Your name"
                autoComplete="nickname"
                minLength={MIN_NAME_LEN}
              />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={updateUsername.isPending}
                className="px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:brightness-110 disabled:opacity-50 shrink-0"
              >
                {updateUsername.isPending ? "Saving..." : "Save name"}
              </button>
            </div>
            {nameError && <p className="text-sm text-red-400 mt-2">{nameError}</p>}
            {nameSaved && <p className="text-sm text-emerald-400/90 mt-2">Display name updated.</p>}
          </div>
        </div>
      </div>

      {avatarError && <p className="text-sm text-red-400 -mt-2">{avatarError}</p>}
      {avatarSaved && !avatarError && (
        <p className="text-sm text-emerald-400/90 -mt-2">Profile photo saved to your auth account.</p>
      )}
    </section>
  )
}
