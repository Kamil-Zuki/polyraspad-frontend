import { ApiError } from "./errors";
import { resolvePublicApiBaseUrl } from "./public-api-url";

const API_BASE_URL = resolvePublicApiBaseUrl();

export abstract class BaseApiClient {
  private handleUnauthorized(): never {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      if (window.location.pathname !== "/auth") {
        window.location.assign("/auth");
      }
    }

    throw ApiError.fromResponse(
      { detail: "Unauthorized" },
      401
    );
  }

  protected getAuthHeaders(): HeadersInit {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    // Logging for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${options.method || 'GET'} ${url}`, {
        body: options.body,
        headers: config.headers,
      });
    }

    const response = await fetch(url, config);

    if (response.status === 401) {
      this.handleUnauthorized();
    }

    if (!response.ok) {
      let error: any = { detail: "Unknown error" };
      const contentType = response.headers.get("content-type");

      try {
        if (contentType && contentType.includes("application/json")) {
          error = await response.json();

          // Handle AggregatorService format: { error: "..." }
          if (response.status === 402 && error.code === "BILLING_LIMIT_EXCEEDED") {
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("billingLimitExceeded", {
                  detail: { limitKey: error.limitKey }
                })
              );
            }
            error.detail = error.message || "Billing limit exceeded";
          }
          else if (error.error && !error.detail) {
            error.detail = error.error;
            // If this is a general exception message, try to extract useful info
            if (error.detail.includes("ResponseException") && error.detail.includes("was thrown")) {
              // Try to find more specific message
              // Usually this is "User not found" or "Invalid login attempt"
              if (error.detail.includes("User not found")) {
                error.detail = "User not found. Check the email or sign up.";
              } else if (error.detail.includes("Invalid login attempt")) {
                error.detail = "Invalid email or password";
              } else {
                error.detail = "Authentication failed. Check your details and try again.";
              }
            }
          }
          // Handle authorization-module format: { Errors: [{ ErrorMessage: "..." }] }
          else if (error.Errors && Array.isArray(error.Errors) && error.Errors.length > 0) {
            const firstError = error.Errors[0];
            error.detail = firstError.ErrorMessage || firstError.message || error.detail;
          }
          // Handle ProblemDetails format: { errors: { errors: { Email: [...], Password: [...] } } }
          else if (error.errors && typeof error.errors === 'object') {
            const errorMessages: string[] = [];
            Object.keys(error.errors).forEach(key => {
              const fieldErrors = error.errors[key];
              if (Array.isArray(fieldErrors)) {
                errorMessages.push(...fieldErrors);
              }
            });
            if (errorMessages.length > 0) {
              error.detail = errorMessages[0]; // Take the first error
            }
          }
          // ProblemDetails format: { detail, title, status, type, instance }
          else if (!error.detail && error.title) {
            error.detail = error.title;
          }
        } else {
          // If response is not JSON, read as text
          const text = await response.text().catch(() => "");
          error = { detail: text || `HTTP ${response.status}: ${response.statusText}` };
        }
      } catch (e) {
        // If parsing fails, use status
        error = {
          detail: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        };
      }

      throw ApiError.fromResponse(error, response.status);
    }

    const text = await response.text();
    // 202 Accepted / 204 No Content may have no body
    if (!text || !text.trim()) {
      if (response.status === 202 || response.status === 204) {
        return {} as T;
      }
      throw ApiError.fromResponse(
        { detail: `Server returned empty response (${response.status})` },
        response.status
      );
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      throw ApiError.fromResponse(
        { detail: `Invalid JSON in response (${response.status})` },
        response.status
      );
    }
  }

  /**
   * Same as request() but returns null when response is 204 No Content (e.g. study session finished).
   */
  protected async requestOrNoContent<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T | null> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    if (process.env.NODE_ENV === "development") {
      console.log(`[API] ${options.method || "GET"} ${url}`, { body: options.body });
    }

    const response = await fetch(url, config);

    if (response.status === 401) {
      this.handleUnauthorized();
    }

    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      let error: any = { detail: "Unknown error" };
      const contentType = response.headers.get("content-type");
      try {
        if (contentType?.includes("application/json")) {
          error = await response.json();
          if (error.error && !error.detail) error.detail = error.error;
        } else {
          error = { detail: await response.text().catch(() => "") || `HTTP ${response.status}` };
        }
      } catch {
        error = { detail: `HTTP ${response.status}: ${response.statusText}` };
      }
      throw ApiError.fromResponse(error, response.status);
    }

    return response.json();
  }
}
