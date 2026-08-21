/** Visible title from uploaded file name */
export function readerImportTitleFromFileName(fileName: string): string {
  const trimmed = fileName.trim()
  const base = trimmed.replace(/\.(pdf|txt|epub)$/i, "").trim()
  return base || "Imported text"
}

export { extractEpubPlainText } from "./epub-package"
