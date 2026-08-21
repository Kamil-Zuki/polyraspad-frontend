/**
 * Replaces `{{FieldKey}}` placeholders with plain text. Values are HTML-escaped for safe rendering.
 */
export function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function substituteNoteTemplate(
  template: string,
  fieldValues: Record<string, string | undefined | null>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    escapeHtmlText((fieldValues[key] ?? "").toString())
  )
}

/** Escaped HTML with newlines as `<br />` for preview panels. */
export function substituteNoteTemplateToHtml(
  template: string,
  fieldValues: Record<string, string | undefined | null>
): string {
  return substituteNoteTemplate(template, fieldValues).replace(/\n/g, "<br />")
}
