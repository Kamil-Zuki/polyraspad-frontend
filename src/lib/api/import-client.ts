import { API_ENDPOINTS } from "../constants";
import { ApiError } from "./errors";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/** Маппинг колонок файла: индексы колонок для sentence, translation, target */
export interface ImportColumnMapping {
  sentence: number;
  translation: number;
  target: number;
}

/** Конфиг импорта карточек: колода, маппинг колонок, стратегия дубликатов */
export interface ImportConfig {
  deckId: string;
  mapping: ImportColumnMapping;
  duplicateStrategy: "SKIP" | "OVERWRITE";
}

/** Ответ 202 при старте импорта (асинхронная задача) */
export interface ImportJobResponse {
  jobId: string;
  status: string;
  message?: string;
  estimatedTimeSeconds?: number;
}

/**
 * Запускает импорт карточек из файла.
 * POST multipart (file + config как JSON) на BULK_CREATE, без заголовка Content-Type (boundary подставит браузер).
 * Обрабатывает 202 и парсит JSON тела ответа.
 */
export async function startImport(
  file: File,
  config: ImportConfig
): Promise<ImportJobResponse> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const headers: HeadersInit = {
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  // Не задаём Content-Type — браузер выставит multipart/form-data с boundary

  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("config", JSON.stringify(config));

  const response = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.CARDS.BULK_CREATE}`,
    {
      method: "POST",
      headers,
      body: formData,
    }
  );

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/auth";
    }
    throw ApiError.fromResponse({ detail: "Unauthorized" }, response.status);
  }

  if (!response.ok) {
    let error: { detail?: string } = { detail: "Import failed" };
    const contentType = response.headers.get("content-type");
    try {
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        error.detail = data.error ?? data.detail ?? error.detail;
      } else {
        error.detail =
          (await response.text().catch(() => "")) || `HTTP ${response.status}`;
      }
    } catch {
      error.detail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw ApiError.fromResponse(error, response.status);
  }

  const text = await response.text();
  if (!text?.trim()) {
    throw ApiError.fromResponse(
      { detail: "Empty response body" },
      response.status
    );
  }
  try {
    return JSON.parse(text) as ImportJobResponse;
  } catch {
    throw ApiError.fromResponse(
      { detail: "Invalid JSON in response" },
      response.status
    );
  }
}
