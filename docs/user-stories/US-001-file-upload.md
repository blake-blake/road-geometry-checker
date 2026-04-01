# US-001 — Upload 12d Model HTML Report

**Status:** ✅ Complete

## Story

As a road designer,
I want to upload a 12d Model HTML alignment report by dragging and dropping it onto the page,
so that I can validate the geometry without copying data manually.

## Acceptance Criteria

- [x] Accepts `.html` and `.htm` files
- [x] Supports drag-and-drop onto the upload zone
- [x] Supports click-to-browse file picker as an alternative
- [x] Detects and handles UTF-16 LE encoding (standard 12d export format) via BOM detection (`0xFF 0xFE`)
- [x] Detects and handles UTF-16 BE encoding (`0xFE 0xFF`)
- [x] Falls back to UTF-8 for non-BOM files
- [x] Passes decoded file content and filename to the parser immediately on drop/select
- [x] Visual feedback when dragging a file over the drop zone (border and background change)

## Notes

- 12d Model exports HTML reports in UTF-16 LE with BOM by default
- Reading via `ArrayBuffer` + `TextDecoder` is required — `FileReader.readAsText()` assumes UTF-8
