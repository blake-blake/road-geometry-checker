# Road Geometry Checker — Claude Code Guide

## Commands

```bash
npm run dev       # Start Vite dev server (http://localhost:5173/road-geometry-checker/)
npm run build     # Type-check + production build → dist/
npm run preview   # Serve production build locally
npm install       # Install dependencies after cloning
```

## Project Purpose

Browser-based tool for road designers to validate alignment geometry from 12d Model HTML reports against Austroads AGRD03 and Main Roads WA design standards. No backend — all logic runs in the browser.

## Architecture

```
src/
├── parsers/
│   └── parse12dHtml.ts     ← Entry point for file ingestion. Handles UTF-8 and
│                              UTF-16 LE/BE encoding via BOM detection. Extracts
│                              horizontal IPs, vertical IPs, grade sections, and
│                              superelevation from 12d Model HTML report tables.
│
├── checks/
│   ├── horizontalAlignment.ts  ← Radius, curve length, transitions, broken back,
│   │                              reverse curves, compound ratio
│   ├── verticalAlignment.ts    ← Grade, K-value, VC length, VC spacing
│   ├── superelevation.ts       ← Crossfall rates, development rate
│   └── chainages.ts            ← Chainage continuity and ordering
│
├── standards/
│   └── austroads.ts        ← All design limit tables. Functions keyed by
│                              DesignSpeed and Standard. Source of truth for
│                              limits — always check clause references here.
│
├── components/
│   ├── FileUpload.tsx          ← Drag-and-drop .html/.htm upload
│   ├── DesignSpeedSelector.tsx ← Speed (40–130 km/h) + standard picker
│   ├── CheckSummary.tsx        ← Pass/Fail/Warning count cards
│   └── IPMatrixTable.tsx       ← Main results view: one row per IP, check columns
│
├── types/
│   └── geometry.ts         ← All TypeScript types. Single source of truth.
│
├── utils/
│   └── exportPdf.ts        ← jsPDF + jspdf-autotable PDF export (landscape A4)
│
└── App.tsx                 ← State management, wires everything together
```

## Key Types (geometry.ts)

- `DesignSpeed` — `40 | 50 | 60 | 70 | 80 | 90 | 100 | 110 | 120 | 130`
- `Standard` — `'austroads' | 'mainroads_wa'`
- `CheckStatus` — `'pass' | 'fail' | 'warning' | 'info'`
- `CheckCategory` — `'Horizontal Alignment' | 'Vertical Alignment' | 'Superelevation' | 'Chainages'`
- `HorizontalIP` — id, chainage, deflectionAngle, radius, arcLength, transitionLengthIn/Out
- `VerticalIP` — id, chainage, level, gradeIn, gradeOut, kValue, vcLength, vcType
- `CheckResult` — id, category, element, check, value, limit, status, clause, notes?

## Check Result Schema

Every check function must return `CheckResult` objects:
```typescript
{
  id: string            // unique, e.g. "horiz-ip3-radius"
  category: CheckCategory
  element: string       // "IP 3" | "VIP 7" | "Ch 1000–1200"
  check: string         // human-readable check name
  value: string         // actual value as string with units
  limit: string         // required limit as string with units
  status: CheckStatus
  clause: string        // e.g. "AGRD03 Table 3.1"
  notes?: string
}
```

## Parser Notes (Important)

- Input files are 12d Model HTML alignment reports, **UTF-16 LE encoded** (BOM: `0xFF 0xFE`)
- The **"Chainage" column is always blank** in 12d output — actual values are in **"Raw Ch"**
- Column header matching uses regex (case-insensitive, whitespace-tolerant)
- Horizontal IP table identified by headers containing: `a.len`, `arc len`, `defl.*angle`, `leading`, `trailing`
- Vertical IP table identified by headers containing: `vc type`, `k value`, `vc len`
- Signed radius: negative = left-hand curve; direction derived from sign, not a column
- Grades computed from adjacent VIP levels when grade columns are absent

## Design Standards Reference

| Check | Clause | Notes |
|-------|--------|-------|
| Min horizontal radius | AGRD03 Table 3.1 | Different tables for emax=7% (Austroads) and emax=10% (MRWA) |
| Min curve length | AGRD03 Section 7.4 | 3-second rule: `(V/3.6) × 3` |
| Min transition length | AGRD03 Section 8.3 | q = 0.6 m/s³ absolute, 0.3 desirable |
| Broken back / reverse curve tangent | AGRD03 Section 7.5 | Absolute = V m, desirable = 2V m |
| Max grade | AGRD03 Table 9.1 | Speed-dependent, 4%–16% |
| Min grade | AGRD03 Section 9.6 | 0.3% for drainage |
| K value (crest) | AGRD03 Table 9.1 | SSD-based |
| K value (sag) | AGRD03 Table 9.2 | Comfort-based |
| Min VC length | AGRD03 general | 50 m practical minimum |
| VC spacing | AGRD03 Section 9.4 | Absolute = V m, desirable = 2V m |
| Max superelevation | AGRD03 / MRWA | 7% (Austroads) or 10% (MRWA) |

## Adding a New Check

1. Add the function to the appropriate file in `src/checks/`
2. Add limits/lookup tables to `src/standards/austroads.ts` if needed — always include the clause reference
3. Call the new function inside the existing `checkXxx(data, speed, standard)` function and spread results
4. The `IPMatrixTable` picks up new results automatically **if the `check` string fragment matches** what `findCheck()` searches for — add a new `<CheckCell>` column if the check needs its own column
5. Test with `sample inputs/LME10 CENTRELINE_250311-3.html`

## Files to Treat with Care

| File | Reason |
|------|--------|
| `src/standards/austroads.ts` | Legal design limits — verify accuracy against the published standard before changing any values |
| `src/parsers/parse12dHtml.ts` | Fragile regex-based HTML parsing — always test against the sample input after changes |
| `src/types/geometry.ts` | Type changes cascade to all checks, parser, and PDF export |

## Hosting

Deployed to GitHub Pages via GitHub Actions on push to `main`.
URL: `https://<username>.github.io/road-geometry-checker/`
Workflow: `.github/workflows/deploy.yml`
Vite base path: `/road-geometry-checker/` (set in `vite.config.ts`)

## Tech Stack

- React 18 + TypeScript (strict)
- Vite 5
- Tailwind CSS 3
- jsPDF + jspdf-autotable (PDF export)
- No backend, no API calls, no state management library
