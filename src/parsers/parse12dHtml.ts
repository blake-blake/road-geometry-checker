/**
 * Parser for 12d Model HTML alignment reports.
 *
 * Handles the standard 12d HTML output format with:
 *   - Horizontal IPs table (PT, Chainage, Radius, A. Length, Defl. Angle, Leading, Trailing)
 *   - Vertical IPs table (PT, Chainage, Height, VC Type, K Value, Radius, Length)
 *
 * Direction of horizontal curves is derived from the sign of the radius
 * (negative = left, positive = right) rather than an L/R suffix on the angle.
 * Grades are computed from adjacent VIP levels/chainages when not explicitly tabulated.
 */

import type { AlignmentData, HorizontalIP, VerticalIP, GradeSection, SuperelevationPoint, DesignSpeed } from '../types/geometry'

// ─── DMS parsing ─────────────────────────────────────────────────────────────

/** Convert "35°12'33.84\"" or "15.512" to decimal degrees (strips any L/R suffix) */
function parseDMSAngle(raw: string): number {
  const clean = raw.replace(/[LlRr°'"]/g, ' ').trim()
  const parts = clean.split(/[\s\-:]+/).filter(Boolean).map(Number)
  let deg = 0
  if (parts.length >= 1) deg += parts[0]
  if (parts.length >= 2) deg += parts[1] / 60
  if (parts.length >= 3) deg += parts[2] / 3600
  return deg
}

/** Parse a chainage string like "0+350.00" or "350.00" to a number */
function parseChainage(raw: string): number {
  const m = raw.match(/(\d+)\+(\d+(?:\.\d+)?)/)
  if (m) return parseInt(m[1]) * 1000 + parseFloat(m[2])
  return parseFloat(raw.replace(/[^\d.]/g, ''))
}

function parseNum(raw: string): number {
  const n = parseFloat(raw.replace(/[^\d.\-]/g, ''))
  return isNaN(n) ? 0 : n
}

// ─── Table identification helpers ────────────────────────────────────────────

type CellGrid = string[][]

function tableToGrid(table: Element): CellGrid {
  const rows = Array.from(table.querySelectorAll('tr'))
  return rows.map(row =>
    Array.from(row.querySelectorAll('td, th')).map(cell =>
      cell.textContent?.trim().replace(/\s+/g, ' ') ?? ''
    )
  )
}

function findColIndex(headers: string[], ...candidates: string[]): number {
  for (const candidate of candidates) {
    const re = new RegExp(candidate, 'i')
    const idx = headers.findIndex(h => re.test(h))
    if (idx !== -1) return idx
  }
  return -1
}

// ─── Horizontal alignment parser ─────────────────────────────────────────────

// Matches 12d Horizontal IPs table: has Radius + one of the curve geometry columns
const HORIZ_HEADER_KEYWORDS = /a\.\s*len|arc\s*len|defl.*angle|deflect|leading|trailing|tangent\s*len|curve\s*len/i

function parseHorizontalTable(grid: CellGrid): HorizontalIP[] {
  const headerRowIdx = grid.findIndex(row => HORIZ_HEADER_KEYWORDS.test(row.join(' ')))
  if (headerRowIdx === -1) return []

  const headers = grid[headerRowIdx]
  const c = {
    id:         findColIndex(headers, '^pt$', 'ip\\s*no', 'point\\s*no', '^no$', 'id'),
    chainage:   findColIndex(headers, 'raw\\s*ch', '^chainage$', 'chainage', 'chain', 'ch\\.'),
    deflection: findColIndex(headers, 'defl.*angle', 'deflect', 'defl\\.', 'delta'),
    radius:     findColIndex(headers, '^radius$', '^r$'),
    arc:        findColIndex(headers, 'a\\.\\s*len', '^arc$', 'arc\\s*len', 'curve\\s*len'),
    tangent:    findColIndex(headers, 'tangent', '^t$', 'tan\\s*len'),
    transIn:    findColIndex(headers, '^leading$', 'trans.*in', 'spiral.*in', 'ls.*in', 'l1'),
    transOut:   findColIndex(headers, '^trailing$', 'trans.*out', 'spiral.*out', 'ls.*out', 'l2'),
    clothoid:   findColIndex(headers, 'clothoid', '^a$', 'param'),
  }

  const ips: HorizontalIP[] = []
  for (let r = headerRowIdx + 1; r < grid.length; r++) {
    const row = grid[r]
    if (row.length < 3 || row.every(c => c === '')) continue

    const chainageRaw = c.chainage !== -1 ? row[c.chainage] : ''
    if (!chainageRaw) continue
    const chainage = parseChainage(chainageRaw)
    if (isNaN(chainage)) continue

    const radiusSigned = c.radius !== -1 ? parseNum(row[c.radius]) : 0
    // Skip tangent-only rows (TC, CT, TS, ST points with no curve)
    if (radiusSigned === 0) continue

    // 12d uses signed radius: negative = left-hand curve, positive = right-hand curve
    const deflectionDirection: 'L' | 'R' = radiusSigned < 0 ? 'L' : 'R'
    const radius = Math.abs(radiusSigned)

    const deflAngle = parseDMSAngle(c.deflection !== -1 ? (row[c.deflection] || '0') : '0')

    ips.push({
      id:                  c.id !== -1 ? row[c.id] : `IP${ips.length + 1}`,
      chainage,
      deflectionAngle:     deflAngle,
      deflectionDirection,
      radius,
      arcLength:           c.arc     !== -1 ? parseNum(row[c.arc])     : 0,
      tangentLength:       c.tangent !== -1 ? parseNum(row[c.tangent]) : 0,
      transitionLengthIn:  c.transIn  !== -1 ? parseNum(row[c.transIn])  : 0,
      transitionLengthOut: c.transOut !== -1 ? parseNum(row[c.transOut]) : 0,
      clothoidParameter:   c.clothoid !== -1 ? parseNum(row[c.clothoid]) : undefined,
    })
  }
  return ips
}

// ─── Vertical alignment parser ────────────────────────────────────────────────

// Matches 12d Vertical IPs table: has VC Type or K Value columns
const VERT_HEADER_KEYWORDS = /vc\s*type|k\s*value|vc\s*len|vertical\s*curve|v\.?c\.?l/i

function parseVerticalTable(grid: CellGrid): { vips: VerticalIP[]; grades: GradeSection[] } {
  const headerRowIdx = grid.findIndex(row => VERT_HEADER_KEYWORDS.test(row.join(' ')))
  if (headerRowIdx === -1) return { vips: [], grades: [] }

  const headers = grid[headerRowIdx]
  const c = {
    id:       findColIndex(headers, '^pt$', 'vip', 'ip\\s*no', 'point', '^no$'),
    chainage: findColIndex(headers, 'raw\\s*ch', '^chainage$', 'chainage', 'chain', 'ch\\.'),
    level:    findColIndex(headers, '^height$', 'level', 'elev', 'rl', 'height'),
    vcType:   findColIndex(headers, 'vc\\s*type'),
    kValue:   findColIndex(headers, 'k\\s*val', '^k$'),
    vcRadius: findColIndex(headers, '^radius$'),
    vcLength: findColIndex(headers, '^length$', 'vc\\s*len', 'vcl', 'curve\\s*len', 'l\\s*\\(vc\\)'),
    gradeIn:  findColIndex(headers, 'grade\\s*in', 'in\\s*grade', 'g1', 'incoming'),
    gradeOut: findColIndex(headers, 'grade\\s*out', 'out\\s*grade', 'g2', 'outgoing'),
  }

  interface RawVIP {
    id: string; chainage: number; level: number
    vcTypeStr: string; kValue: number; vcRadius: number; vcLength: number
    gradeIn: number; gradeOut: number
  }

  const raw: RawVIP[] = []
  for (let r = headerRowIdx + 1; r < grid.length; r++) {
    const row = grid[r]
    if (row.length < 3 || row.every(c => c === '')) continue
    const chainageRaw = c.chainage !== -1 ? row[c.chainage] : ''
    if (!chainageRaw) continue
    const chainage = parseChainage(chainageRaw)
    if (isNaN(chainage)) continue

    raw.push({
      id:        c.id       !== -1 ? row[c.id]              : `VIP${raw.length + 1}`,
      chainage,
      level:     c.level    !== -1 ? parseNum(row[c.level])    : 0,
      vcTypeStr: c.vcType   !== -1 ? row[c.vcType].trim()      : '',
      kValue:    c.kValue   !== -1 ? parseNum(row[c.kValue])   : 0,
      vcRadius:  c.vcRadius !== -1 ? parseNum(row[c.vcRadius]) : 0,
      vcLength:  c.vcLength !== -1 ? parseNum(row[c.vcLength]) : 0,
      gradeIn:   c.gradeIn  !== -1 ? parseNum(row[c.gradeIn])  : 0,
      gradeOut:  c.gradeOut !== -1 ? parseNum(row[c.gradeOut]) : 0,
    })
  }

  // When no explicit grade columns, compute grades from adjacent VIP levels/chainages
  if (c.gradeIn === -1 && raw.length >= 2) {
    for (let i = 0; i < raw.length; i++) {
      const prev = raw[i - 1]
      const curr = raw[i]
      const next = raw[i + 1]
      const gradeFromPrev = prev ? (curr.level - prev.level) / (curr.chainage - prev.chainage) * 100 : undefined
      const gradeToNext   = next ? (next.level - curr.level) / (next.chainage - curr.chainage) * 100 : undefined
      curr.gradeIn  = gradeFromPrev ?? gradeToNext ?? 0
      curr.gradeOut = gradeToNext   ?? gradeFromPrev ?? 0
    }
  }

  const vips: VerticalIP[] = raw.map(v => {
    const vcTypeStr = v.vcTypeStr.toLowerCase()
    let vcType: 'crest' | 'sag' | 'none' = 'none'
    if (v.vcLength > 0 && vcTypeStr !== 'line') {
      if (v.vcRadius !== 0) {
        // Positive radius = concave up = sag; negative = convex down = crest
        vcType = v.vcRadius > 0 ? 'sag' : 'crest'
      } else {
        vcType = v.gradeOut < v.gradeIn ? 'crest' : 'sag'
      }
    }
    return {
      id:          v.id,
      chainage:    v.chainage,
      level:       v.level,
      gradeIn:     v.gradeIn,
      gradeOut:    v.gradeOut,
      gradeChange: Math.abs(v.gradeOut - v.gradeIn),
      kValue:      v.kValue,
      vcLength:    v.vcLength,
      vcType,
    }
  })

  const grades: GradeSection[] = []
  for (let i = 0; i < vips.length - 1; i++) {
    grades.push({
      fromChainage: vips[i].chainage,
      toChainage:   vips[i + 1].chainage,
      grade:        vips[i].gradeOut,
    })
  }

  return { vips, grades }
}

// ─── Superelevation parser ───────────────────────────────────────────────────

const SUPER_HEADER_KEYWORDS = /superelevat|crossfall|cross\s*fall|left.*rate|right.*rate/i

function parseSuperelevationTable(grid: CellGrid): SuperelevationPoint[] {
  const headerRowIdx = grid.findIndex(row => SUPER_HEADER_KEYWORDS.test(row.join(' ')))
  if (headerRowIdx === -1) return []

  const headers = grid[headerRowIdx]
  const c = {
    chainage: findColIndex(headers, 'raw\\s*ch', 'chainage', 'chain', 'ch\\.'),
    left:     findColIndex(headers, 'left', 'l\\.?rate', 'lhs'),
    right:    findColIndex(headers, 'right', 'r\\.?rate', 'rhs'),
  }

  const points: SuperelevationPoint[] = []
  for (let r = headerRowIdx + 1; r < grid.length; r++) {
    const row = grid[r]
    const chainageRaw = c.chainage !== -1 ? row[c.chainage] : ''
    if (!chainageRaw) continue
    const chainage = parseChainage(chainageRaw)
    if (isNaN(chainage)) continue
    points.push({
      chainage,
      leftRate:  c.left  !== -1 ? parseNum(row[c.left])  : 0,
      rightRate: c.right !== -1 ? parseNum(row[c.right]) : 0,
    })
  }
  return points
}

// ─── Design speed extraction ─────────────────────────────────────────────────

function extractDesignSpeed(doc: Document): DesignSpeed | undefined {
  const text = doc.body?.textContent ?? ''
  const m = text.match(/design\s*speed[:\s]+(\d+)\s*km/i)
  if (m) {
    const v = parseInt(m[1])
    const valid: DesignSpeed[] = [40, 50, 60, 70, 80, 90, 100, 110, 120, 130]
    if (valid.includes(v as DesignSpeed)) return v as DesignSpeed
  }
  return undefined
}

function extractAlignmentName(doc: Document): string {
  // 12d reports use h3 with format "cen LME10->LME10 Horizontal IPs"
  const h3 = doc.querySelector('h3')?.textContent?.trim()
  if (h3) {
    const m = h3.match(/cen\s+([^-\s>]+)/i)
    if (m) return m[1]
    return h3
  }
  const title = doc.querySelector('title')?.textContent
  if (title) return title.trim()
  const h1 = doc.querySelector('h1, h2')?.textContent
  if (h1) return h1.trim()
  return 'Unknown Alignment'
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function parse12dHtml(htmlContent: string): AlignmentData {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  const warnings: string[] = []

  const tables = Array.from(doc.querySelectorAll('table'))
  const grids = tables.map(tableToGrid)

  let horizontalIPs: HorizontalIP[] = []
  let verticalIPs: VerticalIP[] = []
  let gradeSections: GradeSection[] = []
  let superelevation: SuperelevationPoint[] = []

  for (const grid of grids) {
    if (horizontalIPs.length === 0 && HORIZ_HEADER_KEYWORDS.test(grid.flat().join(' '))) {
      horizontalIPs = parseHorizontalTable(grid)
    }
    if (verticalIPs.length === 0 && VERT_HEADER_KEYWORDS.test(grid.flat().join(' '))) {
      const result = parseVerticalTable(grid)
      verticalIPs   = result.vips
      gradeSections = result.grades
    }
    if (superelevation.length === 0 && SUPER_HEADER_KEYWORDS.test(grid.flat().join(' '))) {
      superelevation = parseSuperelevationTable(grid)
    }
  }

  if (horizontalIPs.length === 0) warnings.push('No horizontal alignment table found.')
  if (verticalIPs.length === 0)   warnings.push('No vertical alignment table found.')
  if (superelevation.length === 0) warnings.push('No superelevation table found — superelevation checks skipped.')

  const allChainages = [
    ...horizontalIPs.map(ip => ip.chainage),
    ...verticalIPs.map(ip => ip.chainage),
  ]

  return {
    name:          extractAlignmentName(doc),
    designSpeed:   extractDesignSpeed(doc),
    horizontalIPs,
    verticalIPs,
    gradeSections,
    superelevation,
    startChainage: allChainages.length ? Math.min(...allChainages) : 0,
    endChainage:   allChainages.length ? Math.max(...allChainages) : 0,
    parseWarnings: warnings,
  }
}
