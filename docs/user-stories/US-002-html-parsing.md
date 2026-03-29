# US-002 — Parse 12d Model HTML Alignment Report

**Status:** ✅ Complete

## Story

As a road designer,
I want the tool to automatically extract horizontal IPs, vertical IPs, grade sections, and superelevation data from a 12d Model HTML report,
so that all geometry checks are based on the actual design data without manual entry.

## Acceptance Criteria

- [x] Extracts horizontal IP table (identifies table by headers containing `a.len`, `arc len`, `defl.*angle`, `leading`, `trailing`)
- [x] Extracts vertical IP table (identifies table by headers containing `vc type`, `k value`, `vc len`)
- [x] Extracts superelevation table when present
- [x] Reads chainage from the **"Raw Ch"** column (the "Chainage" column is always blank in 12d output)
- [x] Derives curve direction (L/R) from the **sign of the radius** — negative = left, positive = right
- [x] Computes grades from adjacent VIP levels and chainages when grade columns are absent
- [x] Determines `vcType` (crest/sag/none) from the VC Type column string ("Parabola" + radius sign)
- [x] Extracts alignment name from `h3` tags matching `cen <name>` pattern
- [x] Detects design speed from report if present
- [x] Collects parse warnings for missing tables or unrecognised columns and displays them in the UI
- [x] Handles files with missing superelevation table gracefully (skips superelevation checks)
- [x] Column header matching is case-insensitive and whitespace-tolerant via regex

## Notes

- 12d HTML reports contain multiple `<table>` elements; the parser identifies each by scanning header rows
- The "Chainage" column appears in the header but all data rows in that column are blank — this was a critical discovery during development
- Signed radius convention: `radius < 0` → left curve; `Math.abs(radius)` stored in `HorizontalIP.radius`, direction stored in `deflectionDirection`
