/**
 * Парсинг CSV/TSV для превью импорта.
 * Читает файл через file.text(), определяет разделитель по расширению (.tsv → tab)
 * или по первой строке (наличие таба), возвращает заголовки и до maxRows строк.
 */

const DEFAULT_MAX_ROWS = 5

/**
 * Разбирает одну строку с учётом кавычек: поля в кавычках не разбиваются по разделителю внутри.
 */
function parseLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (!inQuotes && ch === delimiter) {
      result.push(current.trim())
      current = ""
      continue
    }
    current += ch
  }
  result.push(current.trim())
  return result
}

/**
 * Определяет разделитель: таб для .tsv или если в первой строке есть таб, иначе запятая.
 */
function detectDelimiter(firstLine: string, fileName: string): string {
  if (fileName.toLowerCase().endsWith(".tsv")) return "\t"
  if (firstLine.includes("\t")) return "\t"
  return ","
}

/**
 * Парсит файл CSV/TSV и возвращает заголовки и превью строк (по умолчанию до 5).
 */
export async function parseCsvPreview(
  file: File,
  maxRows: number = DEFAULT_MAX_ROWS
): Promise<{ headers: string[]; rows: string[][] }> {
  const text = await file.text()
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0)
  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }
  const firstLine = lines[0]
  const delimiter = detectDelimiter(firstLine, file.name)
  const headers = parseLine(firstLine, delimiter)
  const rows: string[][] = []
  for (let i = 1; i < lines.length && rows.length < maxRows; i++) {
    rows.push(parseLine(lines[i], delimiter))
  }
  return { headers, rows }
}
