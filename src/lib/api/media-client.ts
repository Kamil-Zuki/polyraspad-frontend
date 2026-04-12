import { API_ENDPOINTS } from "../constants";
import { ApiError } from "./errors";
import { resolvePublicApiBaseUrl } from "./public-api-url";

const API_BASE_URL = resolvePublicApiBaseUrl();

export interface UploadImageResponse {
  url: string;
  imageId?: string;
}

/**
 * Uploads an image file (from file picker or clipboard blob) and returns the public URL.
 * Used by the editor for "paste from clipboard" and "choose from device".
 */
export async function uploadImage(file: File | Blob): Promise<UploadImageResponse> {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const headers: HeadersInit = {
    ...(token && { Authorization: `Bearer ${token}` }),
  };
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

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/auth";
    }
    throw ApiError.fromResponse({ detail: "Unauthorized" }, response.status);
  }

  if (!response.ok) {
    let error: { detail?: string; error?: string } = { detail: "Upload failed" };
    const contentType = response.headers.get("content-type");
    try {
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        error.detail = data.error ?? data.detail ?? error.detail;
      } else {
        error.detail = await response.text().catch(() => "") || `HTTP ${response.status}`;
      }
    } catch {
      error.detail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw ApiError.fromResponse(error, response.status);
  }

  return response.json() as Promise<UploadImageResponse>;
}
