"use client"

import { useState, useEffect, useRef } from "react"
import { X, ImageIcon, Upload, ClipboardPaste } from "lucide-react"
import { useCreateDeck, useDeck, useUpdateDeck } from "@/lib/react-query/queries"
import { uploadImage } from "@/lib/api/media-client"
import type { CreateDeckDto, UpdateDeckDto } from "@/lib/api/types"
import { ContributionPolicyDto } from "@/lib/api/types"
import { cn } from "@/lib/utils"

interface CreateDeckDialogProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  parentDeckId?: string | null
  deckId?: string | null
  initialData?: {
    title: string
    description?: string
    coverImageUrl?: string | null
  }
  isEditing?: boolean
  onEditSubmit?: (formData: {
    title: string
    description: string
    coverImageUrl: string
    isPublic: boolean
    contributionPolicy: ContributionPolicyDto
  }) => Promise<void>
  isFolder?: boolean
}

export function CreateDeckDialog({
  isOpen,
  onClose,
  projectId,
  parentDeckId,
  deckId,
  initialData,
  isEditing = false,
  onEditSubmit,
  isFolder = false,
}: CreateDeckDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [contributionPolicy, setContributionPolicy] = useState<ContributionPolicyDto>(ContributionPolicyDto.Open)
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [error, setError] = useState("")
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const coverImageUrlRef = useRef("")
  const coverFileInputRef = useRef<HTMLInputElement>(null)
  const createDeck = useCreateDeck()
  const updateDeck = useUpdateDeck()
  const { data: deckDetails } = useDeck(isEditing && deckId ? deckId : "")

  // Reset form when dialog opens or initialData changes
  useEffect(() => {
    if (!isOpen) return

    if (isEditing && deckDetails) {
      const nextCover = deckDetails.coverImageUrl ?? initialData?.coverImageUrl ?? ""
      setTitle(deckDetails.title)
      setDescription(deckDetails.description || initialData?.description || "")
      setIsPublic(deckDetails.isPublic)
      setContributionPolicy(deckDetails.contributionPolicy ?? ContributionPolicyDto.Open)
      setCoverImageUrl(nextCover)
      coverImageUrlRef.current = nextCover
      return
    }

    if (initialData) {
      const nextCover = initialData.coverImageUrl ?? ""
      setTitle(initialData.title)
      setDescription(initialData.description || "")
      setCoverImageUrl(nextCover)
      coverImageUrlRef.current = nextCover
    } else {
      setTitle("")
      setDescription("")
      setCoverImageUrl("")
      coverImageUrlRef.current = ""
    }

    setIsPublic(false)
    setContributionPolicy(ContributionPolicyDto.Open)
  }, [deckDetails, initialData, isEditing, isOpen])

  if (!isOpen) return null

  const uploadCoverBlob = async (blob: Blob) => {
    setError("")
    setIsUploadingCover(true)
    try {
      const { url } = await uploadImage(blob)
      coverImageUrlRef.current = url
      setCoverImageUrl(url)
    } catch (err: any) {
      setError(err.message || "Failed to upload cover image")
    } finally {
      setIsUploadingCover(false)
    }
  }

  const readImageFromClipboard = async () => {
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type)
            await uploadCoverBlob(blob)
            return
          }
        }
      }
      setError("No image found in clipboard")
    } catch {
      setError("Clipboard access failed")
    }
  }

  const handleCoverPaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const item = Array.from(e.clipboardData.items).find((entry) => entry.type.startsWith("image/"))
    if (!item) return
    e.preventDefault()
    const file = item.getAsFile()
    if (!file) {
      setError("Could not read image from clipboard")
      return
    }
    await uploadCoverBlob(file)
  }

  const handleCoverFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file")
      return
    }
    await uploadCoverBlob(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!title.trim()) {
      setError("Title is required")
      return
    }

    if (isEditing && onEditSubmit) {
      // Call the parent's edit submit handler
      try {
        await onEditSubmit({
          title: title.trim(),
          description: description.trim(),
          coverImageUrl: (coverImageUrlRef.current || coverImageUrl).trim(),
          isPublic,
          contributionPolicy,
        })
      } catch (err: any) {
        setError(err.message || "Failed to update deck")
      }
    } else {
      // Create new deck
      try {
        const data: CreateDeckDto = {
          projectId,
          title: title.trim(),
          description: description.trim() || null,
          parentDeckId: parentDeckId || null,
          isPublic,
          coverImageUrl: (coverImageUrlRef.current || coverImageUrl).trim() || null,
        }

        await createDeck.mutateAsync(data)
        setTitle("")
        setDescription("")
        setIsPublic(false)
        setContributionPolicy(ContributionPolicyDto.Open)
        onClose() // This will trigger refetch in parent component
      } catch (err: any) {
        setError(err.message || "Failed to create deck")
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d10] p-6 shadow-2xl shadow-black/60">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-white/5 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="mb-6 text-xl font-bold text-white">
          {isEditing ? "Edit" : isFolder ? "Create Folder" : "Create Deck"}
        </h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-gray-300">
              {isFolder ? "Folder" : "Deck"} Title <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder-gray-500 transition focus:border-brand-primary/50 focus:outline-none focus:ring-1 focus:ring-brand-primary/50"
              placeholder={isFolder ? "e.g. Vocabulary Folders" : "Inbox"}
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-300">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder-gray-500 transition focus:border-brand-primary/50 focus:outline-none focus:ring-1 focus:ring-brand-primary/50"
              placeholder="Optional description..."
            />
          </div>

          {!isFolder && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Cover image</label>
              <div
                role="button"
                tabIndex={0}
                onPaste={handleCoverPaste}
                className={cn(
                  "relative overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-4 text-sm text-gray-300 transition focus:outline-none focus:ring-1 focus:ring-brand-primary/50",
                  coverImageUrl ? "pb-0" : ""
                )}
              >
                {coverImageUrl ? (
                  <div className="relative">
                    <img
                      src={coverImageUrl}
                      alt="Cover preview"
                      className="h-40 w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCoverImageUrl("")
                        coverImageUrlRef.current = ""
                      }}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80"
                      aria-label="Remove cover"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-1">
                    <span className="flex items-center gap-2 font-medium text-white">
                      <ImageIcon className="h-4 w-4 text-brand-primary" />
                      Paste cover from clipboard
                    </span>
                    <span className="text-xs text-gray-500">
                      Click here and press{" "}
                      <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-gray-300">Ctrl+V</kbd>{" "}
                      /{" "}
                      <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-gray-300">Cmd+V</kbd>
                    </span>
                  </div>
                )}
              </div>

              <input
                ref={coverFileInputRef}
                type="file"
                accept="image/*"
                aria-label="Choose cover image"
                onChange={handleCoverFileSelect}
                className="hidden"
              />

              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => coverFileInputRef.current?.click()}
                  disabled={isUploadingCover}
                  className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/10 disabled:opacity-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Choose from device
                </button>
                <button
                  type="button"
                  onClick={readImageFromClipboard}
                  disabled={isUploadingCover}
                  className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/10 disabled:opacity-50"
                >
                  <ClipboardPaste className="h-3.5 w-3.5" />
                  {isUploadingCover ? "Uploading..." : "Paste from clipboard"}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2">
              <input
                id="isPublic"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-white/10 bg-white/[0.03] text-brand-primary focus:ring-brand-primary focus:ring-1"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-300">
                Make this {isFolder ? "folder" : "deck"} public
              </label>
            </div>

            {isEditing && (
              <div>
                <label htmlFor="contributionPolicy" className="mb-1.5 block text-xs font-medium text-gray-400">
                  Contribution policy
                </label>
                <select
                  id="contributionPolicy"
                  value={contributionPolicy}
                  onChange={(e) => setContributionPolicy(Number(e.target.value) as ContributionPolicyDto)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white focus:border-brand-primary/50 focus:outline-none"
                >
                  <option value={ContributionPolicyDto.Open}>Open — anyone can contribute</option>
                  <option value={ContributionPolicyDto.Restricted}>Restricted — only approved contributors</option>
                  <option value={ContributionPolicyDto.Closed}>Closed — only owner can edit</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploadingCover || (isEditing ? updateDeck.isPending : createDeck.isPending)}
              className="rounded-lg bg-brand-primary px-5 py-2 text-sm font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.25)] transition hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploadingCover || (isEditing ? updateDeck.isPending : createDeck.isPending)
                ? "Processing..."
                : isEditing
                  ? "Update"
                  : isFolder
                    ? "Create Folder"
                    : "Create Deck"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
