export type ReaderReadingTheme = "paper" | "sepia" | "dark"

export const READER_READING_THEMES: { id: ReaderReadingTheme; label: string }[] = [
  { id: "paper", label: "Paper" },
  { id: "sepia", label: "Sepia" },
  { id: "dark", label: "Dark" },
]

export function readerReadingThemeClasses(theme: ReaderReadingTheme): {
  plate: string
  text: string
  muted: string
  border: string
  highlightNew: string
  activeWordRing: string
  tabActive: string
  tabInactive: string
  badgeSky: string
  bookStyleActive: string
} {
  switch (theme) {
    case "dark":
      return {
        plate:
          "border-[#2a3348]/60 bg-[linear-gradient(180deg,#1a2030_0%,#141a28_100%)] text-slate-100 shadow-[0_18px_42px_rgba(0,0,0,0.35)]",
        text: "text-slate-100",
        muted: "text-slate-400",
        border: "border-[#3a4660]/50",
        highlightNew: "border-b border-sky-400/40 bg-sky-500/15 text-sky-100",
        activeWordRing: "ring-1 ring-purple-400/60 bg-purple-500/25 text-white",
        tabActive: "border-purple-500/50 bg-purple-500/20 text-purple-300",
        tabInactive: "border-[#3a4660]/50 bg-[#141a28] text-slate-400 hover:text-white hover:bg-white/10",
        badgeSky: "border-sky-500/30 bg-sky-500/10 text-sky-300",
        bookStyleActive: "border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-sm",
      }
    case "sepia":
      return {
        plate:
          "border-[#c4a574]/40 bg-[linear-gradient(180deg,#f0e4c8_0%,#e6d4b0_100%)] text-[#3d2f1f] shadow-[0_18px_42px_rgba(84,57,30,0.12)]",
        text: "text-[#3d2f1f]",
        muted: "text-[#7b6342]",
        border: "border-[#cfb796]/55",
        highlightNew: "border-b border-sky-600/35 bg-sky-500/[0.08] text-[#0a1e36]",
        activeWordRing: "ring-1 ring-purple-700/60 bg-purple-700/18 text-[#2a1b10] font-semibold",
        tabActive: "border-purple-700/60 bg-purple-700/15 text-[#3b1c54] font-semibold",
        tabInactive: "border-[#cfb796]/55 bg-[#e4d2ae]/60 text-[#685237] hover:text-[#3d2f1f] hover:bg-[#e4d2ae]",
        badgeSky: "border-sky-700/40 bg-sky-600/15 text-[#0c2a4a] font-semibold",
        bookStyleActive: "border-amber-700/50 bg-amber-600/20 text-[#4d2800] font-semibold shadow-sm",
      }
    default:
      return {
        plate:
          "border-[#bda27f]/40 bg-[linear-gradient(180deg,rgba(255,251,243,0.98),rgba(246,236,215,0.96))] text-[#33271b] shadow-[0_18px_42px_rgba(84,57,30,0.09)]",
        text: "text-[#33271b]",
        muted: "text-[#8b6c47]",
        border: "border-[#cfb796]/60",
        highlightNew: "border-b border-sky-500/35 bg-sky-500/[0.07] text-[#0f2942]",
        activeWordRing: "ring-1 ring-purple-600/60 bg-purple-600/15 text-purple-950 font-semibold",
        tabActive: "border-purple-600/50 bg-purple-600/12 text-purple-900 font-semibold",
        tabInactive: "border-[#cfb796]/60 bg-[#f4e8d3]/50 text-[#73593b] hover:text-[#33271b] hover:bg-[#f4e8d3]",
        badgeSky: "border-sky-600/40 bg-sky-500/15 text-[#0f2d4a] font-semibold",
        bookStyleActive: "border-amber-600/50 bg-amber-500/20 text-[#542d00] font-semibold shadow-sm",
      }
  }
}

export function loadReaderReadingTheme(): ReaderReadingTheme {
  if (typeof window === "undefined") return "paper"
  const raw = window.localStorage.getItem("polyraspad.reader.readingTheme")
  if (raw === "sepia" || raw === "dark" || raw === "paper") return raw
  return "paper"
}

export function saveReaderReadingTheme(theme: ReaderReadingTheme): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem("polyraspad.reader.readingTheme", theme)
}

export function loadReaderBookStyle(): boolean {
  if (typeof window === "undefined") return true
  const raw = window.localStorage.getItem("polyraspad.reader.bookStyle")
  if (raw === null) return true
  return raw === "true"
}

export function saveReaderBookStyle(enabled: boolean): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem("polyraspad.reader.bookStyle", String(enabled))
}

