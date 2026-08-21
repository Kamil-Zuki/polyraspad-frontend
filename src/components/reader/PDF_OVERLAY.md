# PDF text overlay

`pdf-reader.ts` exposes `getPageTextLayerSpans()` with percentage-based bounding boxes from pdf.js text items.

The Reader **Page + overlay** tab uses `PdfTextOverlay` to place invisible hit targets over the rendered canvas. Word clicks map to analyzed tokens by normalized surface match.

**Limitations:** spans are glyph runs, not linguistic tokens; multi-word phrases still use transcript drag-select or Shift+click. Scanned PDFs without a text layer fall back to Split / Page-only modes.
