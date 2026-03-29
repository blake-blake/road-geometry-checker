# US-009 — PDF Export

**Status:** ✅ Complete

## Story

As a road designer,
I want to export the check results as a formatted PDF report,
so that I can attach it to a design report or share it with the project team as a record of the geometry audit.

## Acceptance Criteria

- [x] Export triggered by "Export PDF" button in the header (only visible after a file is loaded)
- [x] Output is landscape A4
- [x] Header includes: alignment name, design speed, applicable standard, export date
- [x] Four summary stat boxes (Total, Pass, Fail, Warning) shown in the header section
- [x] Horizontal IP table with all check columns, coloured cells (PASS/FAIL/WARN labels + value + limit)
- [x] Vertical IP table with all check columns, same colour treatment
- [x] Chainage issues section included if any failures exist
- [x] Page footer shows "Page X of Y", export date, and tool branding on every page
- [x] File saved as `RGC_<AlignmentName>_<YYYY-MM-DD>.pdf`

## Notes

- Uses jsPDF + jspdf-autotable
- Cell colours in the PDF mirror the on-screen status colours (green/red/amber)
- Long tables automatically continue across pages with repeated headers
