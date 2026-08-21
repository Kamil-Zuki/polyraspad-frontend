"use client"

export interface ReaderLibraryBook {
  id: string
  title: string
  fileName: string
  url: string
  documentId?: string
  pageCount?: number
  uploadedAt: string
  lastOpenedAt?: string
  /** Last PDF page / EPUB spine chapter / manual text page (1-based) */
  lastReadPage?: number
  collectionId?: string
  collectionName?: string
  isShared?: boolean
  ownerUserId?: string
  ownerUserName?: string
  ownerEmail?: string
  readingMode?: string
  hasExtractedText?: boolean
  coverImageUrl?: string
  audioUrl?: string
  cefrLevel?: string
  summary?: string
}

export interface ReaderCollectionCollaborator {
  userId: string
  userName: string
  email: string
  canEdit: boolean
  sharedAt: string
}

export interface ReaderCollection {
  id: string
  projectId: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  ownerUserId: string
  ownerUserName: string
  ownerEmail: string
  isSharedWithMe: boolean
  canEdit: boolean
  bookCount: number
  collaborators: ReaderCollectionCollaborator[]
  books: ReaderLibraryBook[]
}

export function sortReaderLibraryBooks(books: ReaderLibraryBook[]) {
  return [...books].sort((a, b) => {
    const left = new Date(b.lastOpenedAt ?? b.uploadedAt).getTime()
    const right = new Date(a.lastOpenedAt ?? a.uploadedAt).getTime()
    return left - right
  })
}
