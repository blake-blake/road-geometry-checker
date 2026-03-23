# Road Geometry Checker

A browser-based tool for checking road alignment geometry against **Austroads** (AGRD03) and **Main Roads WA** design standards. Upload a 12d Model HTML alignment report and get an instant pass/fail/warning audit across horizontal alignment, vertical alignment, and superelevation.

## Features

- **Horizontal alignment checks**
  - Minimum curve radius (absolute and desirable) per design speed
  - Minimum curve length (3-second travel time rule)
  - Transition/spiral lengths (absolute and desirable)
  - Short curve appearance (deflection < 5°)
  - Compound curve radius ratio (≤ 2:1)
  - Overlapping tangent detection between adjacent curves

- **Vertical alignment checks**
  - Maximum longitudinal grade
  - Minimum K-value for crest and sag vertical curves
  - Minimum vertical curve length

- **Superelevation checks**
  - Left/right crossfall rates

- **Standards support**
  - Austroads AGRD03 (emax = 7%)
  - Main Roads WA supplement (emax = 10%)

- **Input format**
  - 12d Model HTML alignment reports (UTF-8 or UTF-16)
  - Auto-detects horizontal IPs, vertical IPs, and superelevation tables by header keywords

## Getting Started

### Prerequisites

- Node.js 18+

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build
```

## Usage

1. Export an alignment report from 12d Model as HTML (use the standard IP report template)
2. Open the app and upload the HTML file
3. Select the design speed and applicable standard
4. Review the results table — each check shows the element, actual value, required limit, status, and clause reference

## Input Format

The parser expects a 12d Model HTML report containing one or more of the following tables:

| Table | Key columns |
|---|---|
| Horizontal IPs | `PT`, `Chainage`, `Radius`, `A. Length`, `Defl. Angle`, `Leading`, `Trailing` |
| Vertical IPs | `PT`, `Chainage`, `Height`, `VC Type`, `K Value`, `Radius`, `Length` |
| Superelevation | `Chainage`, `Left`, `Right` |

Radius is treated as signed — negative values indicate left-hand curves. Deflection direction is derived from the radius sign rather than an L/R suffix.

## Tech Stack

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

## Project Structure

```
src/
├── checks/
│   ├── horizontalAlignment.ts   # AGRD03 horizontal geometry checks
│   ├── verticalAlignment.ts     # AGRD03 vertical geometry checks
│   ├── superelevation.ts        # Crossfall/superelevation checks
│   └── chainages.ts             # Chainage continuity checks
├── parsers/
│   └── parse12dHtml.ts          # 12d Model HTML report parser
├── standards/
│   └── austroads.ts             # Limit tables (AGRD03 + MRWA supplement)
├── types/
│   └── geometry.ts              # AlignmentData, HorizontalIP, VerticalIP, etc.
└── components/
    ├── FileUpload.tsx
    ├── DesignSpeedSelector.tsx
    ├── ResultsTable.tsx
    └── CheckSummary.tsx
```

## License

MIT
