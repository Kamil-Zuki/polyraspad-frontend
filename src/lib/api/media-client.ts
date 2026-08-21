import { API_ENDPOINTS } from "../constants";
import type { GenerateAudioRequestDto, GenerateAudioResponseDto } from "./types";
import { ApiError } from "./errors";
import { resolvePublicApiBaseUrl } from "./public-api-url";
import type { ReaderCollection, ReaderLibraryBook } from "@/app/reader/library-storage";

const API_BASE_URL = resolvePublicApiBaseUrl();

export interface UploadImageResponse {
  url: string;
  imageId?: string;
}

export interface UploadDocumentResponse {
  url: string;
  documentId?: string;
}

export interface SaveReaderLibraryBookPayload {
  title: string;
  fileName: string;
  documentId?: string;
  pageCount?: number;
  uploadedAt: string;
  lastOpenedAt?: string;
  lastReadPage?: number;
  collectionId?: string;
  collectionName?: string;
  readingMode?: string;
  hasExtractedText?: boolean;
  coverImageUrl?: string;
  audioUrl?: string;
  cefrLevel?: string;
  summary?: string;
}

export interface SaveReaderCollectionPayload {
  id: string;
  projectId: string;
  name: string;
  description?: string;
}

export interface ShareReaderCollectionPayload {
  email: string;
  canEdit: boolean;
}

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return {
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function parseApiResponse<T>(response: Response, fallbackDetail: string): Promise<T> {
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/auth";
    }
    throw ApiError.fromResponse({ detail: "Unauthorized" }, response.status);
  }

  if (!response.ok) {
    let detail = fallbackDetail;
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        detail = data.error ?? data.detail ?? detail;
      } else {
        detail = await response.text().catch(() => "") || detail;
      }
    } catch {
      detail = `HTTP ${response.status}: ${response.statusText}`;
    }

    throw ApiError.fromResponse({ detail }, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Server-side TTS (OpenAI-compatible) + upload to MediaService. Returns public/presigned audio URL.
 */
export async function generateAudio(body: GenerateAudioRequestDto): Promise<GenerateAudioResponseDto> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MEDIA.GENERATE_AUDIO}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });

  return parseApiResponse<GenerateAudioResponseDto>(response, "Audio generation failed");
}

/** User-facing message when TTS fails; hints for language/provider rejections from MediaService. */
export function formatGenerateAudioUserMessage(error: unknown): string {
  const base =
    error instanceof ApiError
      ? String(error.detail?.trim() || error.message || "Audio generation failed.")
      : error instanceof Error
        ? error.message
        : "Audio generation failed.";
  const probe = base.toLowerCase();
  const isModelOrProviderConfigError =
    probe.includes("invalid model") ||
    probe.includes("invalid_model") ||
    probe.includes("api key") ||
    probe.includes("not configured") ||
    probe.includes("disabled");
  if (isModelOrProviderConfigError) {
    return base;
  }
  if (probe.includes("voice_id") || probe.includes("ai_tts_voice_id")) {
    return `${base} For local/Docker dev set AI_TTS_PROVIDER=espeak in .env, or create a Mistral voice and set AI_TTS_VOICE_ID.`;
  }
  if (
    probe.includes("language") ||
    (probe.includes("must be one of") && probe.includes("en"))
  ) {
    return `${base} TTS supports English (en), Russian (ru), and Korean (ko); unsupported study languages map to English.`;
  }
  return base;
}

/**
 * Uploads an image file (from file picker or clipboard blob) and returns the public URL.
 * Used by the editor for "paste from clipboard" and "choose from device".
 */
export async function uploadImage(file: File | Blob): Promise<UploadImageResponse> {
  const headers = getAuthHeaders();
  // Do not set Content-Type — browser will set multipart/form-data with boundary

  const formData = new FormData();
  const name = file instanceof File ? file.name : "image.png";
  const type = file instanceof File ? file.type : "image/png";
  formData.append("file", file, name);

  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MEDIA.UPLOAD_IMAGE}`, {
    method: "POST",
    headers,
    body: formData,
  });

  return parseApiResponse<UploadImageResponse>(response, "Upload failed");
}

/**
 * Uploads a Reader document (PDF, EPUB, or TXT) and returns stored URL / id.
 */
export async function uploadDocument(file: File): Promise<UploadDocumentResponse> {
  const headers = getAuthHeaders();

  const formData = new FormData();
  formData.append("file", file, file.name);

  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MEDIA.UPLOAD_DOCUMENT}`, {
    method: "POST",
    headers,
    body: formData,
  });

  return parseApiResponse<UploadDocumentResponse>(response, "Upload failed");
}

export async function getReaderLibrary(projectId: string): Promise<ReaderLibraryBook[]> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MEDIA.READER_LIBRARY(projectId)}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return parseApiResponse<ReaderLibraryBook[]>(response, "Could not load Reader library");
}

export async function saveReaderLibraryBook(
  projectId: string,
  bookId: string,
  payload: SaveReaderLibraryBookPayload
): Promise<ReaderLibraryBook> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MEDIA.READER_LIBRARY_BOOK(projectId, bookId)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  return parseApiResponse<ReaderLibraryBook>(response, "Could not save Reader library book");
}

export async function deleteReaderLibraryBook(projectId: string, bookId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MEDIA.READER_LIBRARY_BOOK(projectId, bookId)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  await parseApiResponse<void>(response, "Could not remove Reader library book");
}

export async function fetchDocumentBytes(documentUrl: string): Promise<ArrayBuffer> {
  const headers = getAuthHeaders();
  const proxyUrl = `${API_BASE_URL}${API_ENDPOINTS.MEDIA.SERVE_DOCUMENT}?url=${encodeURIComponent(documentUrl)}`;

  const response = await fetch(proxyUrl, {
    method: "GET",
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/auth";
    }
    throw ApiError.fromResponse({ detail: "Unauthorized" }, response.status);
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        detail = data.error ?? data.detail ?? detail;
      } else {
        detail = await response.text().catch(() => "") || detail;
      }
    } catch {
      detail = `HTTP ${response.status}: ${response.statusText}`;
    }

    throw ApiError.fromResponse({ detail }, response.status);
  }

  return response.arrayBuffer();
}

export async function getReaderCollections(projectId: string): Promise<ReaderCollection[]> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MEDIA.READER_COLLECTIONS(projectId)}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return parseApiResponse<ReaderCollection[]>(response, "Could not load Reader collections");
}

export async function saveReaderCollection(
  projectId: string,
  payload: SaveReaderCollectionPayload
): Promise<ReaderCollection> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MEDIA.READER_COLLECTIONS(projectId)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  return parseApiResponse<ReaderCollection>(response, "Could not save Reader collection");
}

export async function deleteReaderCollection(projectId: string, collectionId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MEDIA.READER_COLLECTION(projectId, collectionId)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  await parseApiResponse<void>(response, "Could not delete Reader collection");
}

export async function shareReaderCollection(
  projectId: string,
  collectionId: string,
  payload: ShareReaderCollectionPayload
): Promise<ReaderCollection> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MEDIA.READER_COLLECTION_SHARE(projectId, collectionId)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  return parseApiResponse<ReaderCollection>(response, "Could not share Reader collection");
}

export async function unshareReaderCollection(
  projectId: string,
  collectionId: string,
  collaboratorUserId: string
): Promise<ReaderCollection> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MEDIA.READER_COLLECTION_UNSHARE(projectId, collectionId, collaboratorUserId)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return parseApiResponse<ReaderCollection>(response, "Could not unshare Reader collection");
}

export async function getSharedReaderCollections(): Promise<ReaderCollection[]> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MEDIA.SHARED_READER_COLLECTIONS}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return parseApiResponse<ReaderCollection[]>(response, "Could not load shared Reader collections");
}
