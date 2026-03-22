/**
 * Parser for 12d Model HTML alignment reports.
 *
 * 12d outputs vary by report template. This parser attempts to identify
 * horizontal and vertical alignment tables by scanning for known header keywords,
 * then maps columns to data fields.
 */

import type { AlignmentData, HorizontalIP, VerticalIP, GradeSection, SuperelevationPoint, DesignSpeed } from '../types/geometry'

// ─── DMS parsing ─────────────────────────────────────────────────────────────

/** Convert "15°30'45\" L" or "15-30-45 L" or "15.512 L" to signed decimal degrees */
function parseDMS(raw: string): { degrees: number; direction: 'L' | 'R' } {
  const dir: 'L' | 'R' = /L/i.test(raw) ? 'L' : 'R'
  const clean = raw.replace(/[LlRr°'"]/g, ' ').trim()
  const parts = clean.split(/[\s\-:]+/).filter(Boolean).map(Number)
  let deg = 0
  if (parts.length >= 1) deg += parts[0]
  if (parts.length >= 2) deg += parts[1] / 60
  if (parts.length >= 3) deg += parts[2] / 3600
  return { degrees: deg, direction: dir }
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

const HORIZ_HEADER_KEYWORDS = /radius|arc\s*length|deflect|tangent\s*length|curve\s*length/i

function parseHorizontalTable(grid: CellGrid): HorizontalIP[] {
  // Find the header row
  const headerRowIdx = grid.findIndex(row => HORIZ_HEADER_KEYWORDS.test(row.join(' ')))
  if (headerRowIdx === -1) return []

  const headers = grid[headerRowIdx]
  const c = {
    id:          findColIndex(headers, 'ip\\s*no', 'point\\s*no', '^no$', 'id', 'point'),
    chainage:    findColIndex(headers, 'chainage', 'chain', 'ch\\.'),
    deflection:  findColIndex(headers, 'deflect', 'defl\\.', 'delta', 'angle'),
    radius:      findColIndex(headers, 'radius', '^r$'),
    arc:         findColIndex(headers, 'arc', 'curve\\s*len', 'arc\\s*len'),
    tangent:     findColIndex(headers, 'tangent', '^t$', 'tan\\s*len'),
    transIn:     findColIndex(headers, 'trans.*in', 'spiral.*in', 'ls.*in', 'l1'),
    transOut:    findColIndex(headers, 'trans.*out', 'spiral.*out', 'ls.*out', 'l2'),
    clothoid:    findColIndex(headers, 'clothoid', '^a$', 'param'),
  }

  const ips: HorizontalIP[] = []
  for (let r = headerRowIdx + 1; r < grid.length; r++) {
    const row = grid[r]
    if (row.length < 3 || row.every(c => c === '')) continue

    const chainageRaw = c.chainage !== -1 ? row[c.chainage] : ''
    if (!chainageRaw) continue
    const chainage = parseChainage(chainageRaw)
    if (isNaN(chainage)) continue

    const deflRaw = c.deflection !== -1 ? row[c.deflection] : '0'
    const { degrees: deflAngle, direction: deflDir } = parseDMS(deflRaw || '0')

    const radius = c.radius !== -1 ? parseNum(row[c.radius]) : 0
    if (radius === 0 && deflAngle === 0) continue  // likely a tangent start/end row

    ips.push({
      id:               c.id !== -1 ? row[c.id] : `IP${ips.length + 1}`,
      chainage,
      deflectionAngle:  deflAngle,
      deflectionDirection: deflDir,
      radius:           radius,
      arcLength:        c.arc !== -1      ? parseNum(row[c.arc])     : 0,
      tangentLength:    c.tangent !== -1  ? parseNum(row[c.tangent]) : 0,
      transitionLengthIn:  c.transIn !== -1  ? parseNum(row[c.transIn])  : 0,
      transitionLengthOut: c.transOut !== -1 ? parseNum(row[c.transOut]) : 0,
      clothoidParameter:   c.clothoid !== -1 ? parseNum(row[c.clothoid]) : undefined,
    })
  }
  return ips
}

// ─── Vertical alignment parser ────────────────────────────────────────────────

const VERT_HEADER_KEYWORDS = /grade|k\s*value|vc\s*len|vertical\s*curve|v\.?c\.?l|vip/i

function parseVerticalTable(grid: CellGrid): { vips: VerticalIP[]; grades: GradeSection[] } {
  const headerRowIdx = grid.findIndex(row => VERT_HEADER_KEYWORDS.test(row.join(' ')))
  if (headerRowIdx === -1) return { vips: [], grades: [] }

  const headers = grid[headerRowIdx]
  const c = {
    id:        findColIndex(headers, 'vip', 'ip\\s*no', 'point', '^no$'),
    chainage:  findColIndex(headers, 'chainage', 'chain', 'ch\\.'),
    level:     findColIndex(headers, 'level', 'elev', 'rl', 'height'),
    gradeIn:   findColIndex(headers, 'grade\\s*in', 'in\\s*grade', 'g1', 'incoming'),
    gradeOut:  findColIndex(headers, 'grade\\s*out', 'out\\s*grade', 'g2', 'outgoing'),
    kValue:    findColIndex(headers, 'k\\s*val', '^k$'),
    vcLength:  findColIndex(headers, 'vc\\s*len', 'vcl', 'curve\\s*len', 'l\\s*\\(vc\\)'),
  }

  const vips: VerticalIP[] = []
  for (let r = headerRowIdx + 1; r < grid.length; r++) {
    const row = grid[r]
    if (row.length < 3 || row.every(c => c === '')) continue
    const chainageRaw = c.chainage !== -1 ? row[c.chainage] : ''
    if (!chainageRaw) continue
    const chainage = parseChainage(chainageRaw)
    if (isNaN(chainage)) continue

    const gradeIn  = c.gradeIn  !== -1 ? parseNum(row[c.gradeIn])  : 0
    const gradeOut = c.gradeOut !== -1 ? parseNum(row[c.gradeOut]) : 0
    const kValue   = c.kValue   !== -1 ? parseNum(row[c.kValue])   : 0
    const vcLength = c.vcLength !== -1 ? parseNum(row[c.vcLength]) : 0
    const gradeChange = Math.abs(gradeOut - gradeIn)

    let vcType: 'crest' | 'sag' | 'none' = 'none'
    if (vcLength > 0) {
      vcType = gradeOut < gradeIn ? 'crest' : 'sag'
    }

    vips.push({
      id:          c.id !== -1 ? row[c.id] : `VIP${vips.length + 1}`,
      chainage,
      level:       c.level !== -1 ? parseNum(row[c.level]) : 0,
      gradeIn,
      gradeOut,
      gradeChange,
      kValue,
      vcLength,
      vcType,
    })
  }

  // Derive grade sections from adjacent VIPs
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
    chainage: findColIndex(headers, 'chainage', 'chain', 'ch\\.'),
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
      verticalIPs  = result.vips
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
