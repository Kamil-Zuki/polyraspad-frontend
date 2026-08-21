/**
 * Allows only same-origin relative paths for post-study navigation (open-redirect safe).
 * Accepts paths like `/reader` or `/library`; rejects protocol-relative and absolute URLs.
 */
export function sanitizeInternalReturnPath(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("://")) return null;
  return trimmed;
}
