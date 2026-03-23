/**
 * PDF export for road geometry compliance reports.
 * Produces a landscape A4 document suitable for attachment to a design report.
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AlignmentData, CheckResult, CheckStatus, DesignSpeed, Standard } from '../types/geometry'

// ─── Colour palette ───────────────────────────────────────────────────────────

type RGB = [number, number, number]

const C = {
  navy:      [30,  58,  138] as RGB,
  navyLight: [59,  130, 246] as RGB,
  slate:     [71,  85,  105] as RGB,
  slateLight:[248, 250, 252] as RGB,
  border:    [226, 232, 240] as RGB,
  text:      [30,  41,  59]  as RGB,
  muted:     [100, 116, 139] as RGB,
  white:     [255, 255, 255] as RGB,

  passBg:    [220, 252, 231] as RGB,
  passFg:    [21,  128, 61]  as RGB,
  failBg:    [254, 226, 226] as RGB,
  failFg:    [185, 28,  28]  as RGB,
  warnBg:    [254, 243, 199] as RGB,
  warnFg:    [146, 64,  14]  as RGB,
  infoBg:    [219, 234, 254] as RGB,
  infoFg:    [29,  78,  216] as RGB,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_RANK: Record<CheckStatus, number> = { fail: 0, warning: 1, info: 2, pass: 3 }

function worstStatus(results: CheckResult[]): CheckStatus {
  if (results.length === 0) return 'pass'
  return results.reduce<CheckStatus>(
    (w, r) => STATUS_RANK[r.status] < STATUS_RANK[w] ? r.status : w,
    'pass',
  )
}

function statusBg(s: CheckStatus): RGB {
  return s === 'pass' ? C.passBg : s === 'fail' ? C.failBg : s === 'warning' ? C.warnBg : C.infoBg
}
function statusFg(s: CheckStatus): RGB {
  return s === 'pass' ? C.passFg : s === 'fail' ? C.failFg : s === 'warning' ? C.warnFg : C.infoFg
}
function statusLabel(s: CheckStatus): string {
  return s === 'pass' ? 'PASS' : s === 'fail' ? 'FAIL' : s === 'warning' ? 'WARN' : 'INFO'
}

/** Build a coloured autoTable cell for a CheckResult */
function cell(result?: CheckResult): object {
  if (!result) {
    return { content: '—', styles: { textColor: C.border, halign: 'center' } }
  }
  const showLimit = result.status === 'fail' || result.status === 'warning'
  const lines: string[] = [statusLabel(result.status), result.value]
  if (showLimit) lines.push(result.limit)
  return {
    content: lines.join('\n'),
    styles: {
      fillColor: statusBg(result.status),
      textColor: statusFg(result.status),
      fontStyle: 'bold',
      halign:    'center',
      fontSize:  6,
    },
  }
}

/** Overall status cell — bold status + bulleted failures */
function overallCell(checks: CheckResult[]): object {
  const status  = worstStatus(checks)
  const issues  = checks.filter(r => r.status === 'fail' || r.status === 'warning')
  const bullets = issues.map(r => `${r.status === 'fail' ? '✗' : '⚠'} ${r.check.replace(/ \(.*\)/, '')}: ${r.value}`)
  const lines   = [statusLabel(status), ...bullets]
  return {
    content: lines.join('\n'),
    styles: {
      fillColor: statusBg(status),
      textColor: statusFg(status),
      fontStyle: 'bold',
      fontSize:  6,
    },
  }
}

// ─── Page chrome ─────────────────────────────────────────────────────────────

function drawPageHeader(doc: jsPDF, pageW: number) {
  doc.setFillColor(...C.navy)
  doc.rect(0, 0, pageW, 8, 'F')
}

function drawFooter(doc: jsPDF, pageW: number, pageH: number, pageNum: number, totalPages: number, date: string) {
  const y = pageH - 7
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.line(10, y - 2, pageW - 10, y - 2)
  doc.setTextColor(...C.muted)
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.text('Road Geometry Checker  |  Austroads AGRD Part 3', 10, y + 1)
  doc.text(`Page ${pageNum} of ${totalPages}`, pageW / 2, y + 1, { align: 'center' })
  doc.text(date, pageW - 10, y + 1, { align: 'right' })
}

// ─── Section heading ─────────────────────────────────────────────────────────

function sectionHeading(doc: jsPDF, text: string, x: number, y: number, w: number) {
  doc.setFillColor(...C.navy)
  doc.rect(x, y, w, 6, 'F')
  doc.setTextColor(...C.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(text, x + 3, y + 4.2)
  return y + 6
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function exportPdf(
  data: AlignmentData,
  results: CheckResult[],
  designSpeed: DesignSpeed,
  standard: Standard,
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW  = doc.internal.pageSize.getWidth()   // 297 mm
  const pageH  = doc.internal.pageSize.getHeight()  // 210 mm
  const margin = 12
  const cw     = pageW - margin * 2                 // content width
  const date   = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })

  const pass    = results.filter(r => r.status === 'pass').length
  const fail    = results.filter(r => r.status === 'fail').length
  const warning = results.filter(r => r.status === 'warning').length
  const total   = results.length

  // ── Cover block ─────────────────────────────────────────────────────────────
  drawPageHeader(doc, pageW)

  // Report title
  doc.setFillColor(...C.navy)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(...C.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('ROAD GEOMETRY COMPLIANCE REPORT', margin, 16)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(
    standard === 'mainroads_wa'
      ? 'Austroads AGRD Part 3  +  Main Roads WA Supplement'
      : 'Austroads Guide to Road Design — Part 3',
    margin, 23,
  )

  // Alignment name + meta
  doc.setTextColor(...C.text)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(data.name, margin, 38)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...C.slate)
  const meta = [
    `Design Speed: ${designSpeed} km/h`,
    `Standard: ${standard === 'mainroads_wa' ? 'Main Roads WA (emax = 10%)' : 'Austroads (emax = 7%)'}`,
    `Chainage Range: ${data.startChainage.toFixed(0)} – ${data.endChainage.toFixed(0)} m`,
    `Date: ${date}`,
  ]
  doc.text(meta, margin, 44, { lineHeightFactor: 1.7 })

  // Summary stat boxes
  const statBoxes: Array<{ label: string; value: number; bg: RGB; fg: RGB }> = [
    { label: 'TOTAL',   value: total,   bg: C.slate,  fg: C.white },
    { label: 'PASS',    value: pass,    bg: C.passFg, fg: C.white },
    { label: 'FAIL',    value: fail,    bg: C.failFg, fg: C.white },
    { label: 'WARNING', value: warning, bg: C.warnFg, fg: C.white },
  ]
  const bW = 38, bH = 22, bY = 33, gap = 4
  let bX = pageW - margin - statBoxes.length * (bW + gap) + gap
  for (const b of statBoxes) {
    doc.setFillColor(...b.bg)
    doc.roundedRect(bX, bY, bW, bH, 2, 2, 'F')
    doc.setTextColor(...b.fg)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(String(b.value), bX + bW / 2, bY + 13, { align: 'center' })
    doc.setFontSize(5.5)
    doc.text(b.label, bX + bW / 2, bY + 19, { align: 'center' })
    bX += bW + gap
  }

  // Divider
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.4)
  doc.line(margin, 60, pageW - margin, 60)

  let y = 63

  // ── Horizontal IPs table ───────────────────────────────────────────────────
  if (data.horizontalIPs.length > 0) {
    const hResults = results.filter(r => r.category === 'Horizontal Alignment')
    const cResults = results.filter(r => r.category === 'Chainages')

    function hFind(ipId: string, fragment: string) {
      const el = `IP ${ipId}`
      return [...hResults, ...cResults].find(r =>
        (r.element === el || r.element === `${el} (compound)`) && r.check.includes(fragment)
      )
    }
    function hAll(ipId: string) {
      const el = `IP ${ipId}`
      return [...hResults, ...cResults].filter(r =>
        r.element === el || r.element === `${el} (compound)`
      )
    }

    y = sectionHeading(doc, 'HORIZONTAL ALIGNMENT', margin, y, cw) + 2

    const head = [[
      'IP', 'Chainage\n(m)', 'Dir', 'Radius\n(m)', 'Arc\n(m)',
      'Min\nRadius', 'Curve\nLength', 'Trans\nIn', 'Trans\nOut',
      'Comp.\nRatio', 'Short\nCurve', 'Broken\nBack', 'Reverse\nCurve',
      'Overall',
    ]]

    const body = data.horizontalIPs.map(ip => [
      { content: ip.id,                       styles: { fontStyle: 'bold', textColor: C.text } },
      { content: ip.chainage.toFixed(1),      styles: { halign: 'right',  textColor: C.slate } },
      { content: ip.deflectionDirection,      styles: { halign: 'center', fontStyle: 'bold', textColor: ip.deflectionDirection === 'L' ? C.failFg : C.passFg } },
      { content: ip.radius.toFixed(1),        styles: { halign: 'right',  textColor: C.slate } },
      { content: ip.arcLength.toFixed(1),     styles: { halign: 'right',  textColor: C.slate } },
      cell(hFind(ip.id, 'Minimum curve radius (absolute)')),
      cell(hFind(ip.id, 'Minimum curve length')),
      cell(hFind(ip.id, 'Transition length in (absolute min)')),
      cell(hFind(ip.id, 'Transition length out (absolute min)')),
      cell(hFind(ip.id, 'Compound curve radius ratio')),
      cell(hFind(ip.id, 'Short curve appearance')),
      cell(hFind(ip.id, 'Broken back curve')),
      cell(hFind(ip.id, 'Reverse curve')),
      overallCell(hAll(ip.id)),
    ])

    autoTable(doc, {
      head,
      body,
      startY: y,
      margin: { left: margin, right: margin },
      tableWidth: cw,
      styles:         { fontSize: 7, cellPadding: 1.8, minCellHeight: 9, overflow: 'linebreak', valign: 'middle' },
      headStyles:     { fillColor: C.navy, textColor: C.white, fontStyle: 'bold', fontSize: 6.5, halign: 'center', minCellHeight: 10 },
      alternateRowStyles: { fillColor: C.slateLight },
      columnStyles:   {
        0:  { cellWidth: 12 },
        1:  { cellWidth: 20 },
        2:  { cellWidth: 8  },
        3:  { cellWidth: 18 },
        4:  { cellWidth: 16 },
        5:  { cellWidth: 'auto' },
        6:  { cellWidth: 'auto' },
        7:  { cellWidth: 'auto' },
        8:  { cellWidth: 'auto' },
        9:  { cellWidth: 'auto' },
        10: { cellWidth: 'auto' },
        11: { cellWidth: 'auto' },
        12: { cellWidth: 'auto' },
        13: { cellWidth: 34 },
      },
      didDrawPage: () => drawPageHeader(doc, pageW),
    })

    y = (doc as any).lastAutoTable.finalY + 8
  }

  // ── Vertical IPs table ────────────────────────────────────────────────────
  if (data.verticalIPs.length > 0) {
    if (y > pageH - 55) { doc.addPage(); y = 14 }

    const vResults = results.filter(r => r.category === 'Vertical Alignment')
    const cResults = results.filter(r => r.category === 'Chainages')

    function vFind(vipId: string, fragment: string) {
      return vResults.find(r => r.element === `VIP ${vipId}` && r.check.includes(fragment))
    }
    function gradeFind(from: number, to: number, fragment: string) {
      const label = `Ch ${from.toFixed(0)}\u2013${to.toFixed(0)}`
      return vResults.find(r => r.element === label && r.check.includes(fragment))
    }
    function vAll(vipId: string, vipCh: number) {
      const direct = [...vResults, ...cResults].filter(r => r.element === `VIP ${vipId}`)
      const sectionChecks = vResults.filter(r => {
        if (!r.element.startsWith('Ch ')) return false
        const parts = r.element.replace('Ch ', '').split('\u2013')
        if (parts.length !== 2) return false
        const from = parseFloat(parts[0]), to = parseFloat(parts[1])
        return Math.abs(from - vipCh) < 1 || Math.abs(to - vipCh) < 1
      })
      return [...direct, ...sectionChecks]
    }

    y = sectionHeading(doc, 'VERTICAL ALIGNMENT', margin, y, cw) + 2

    const head = [[
      'VIP', 'Chainage\n(m)', 'VC Type', 'Grade In\n(%)', 'Grade Out\n(%)',
      'Max Grade\nIn', 'Max Grade\nOut', 'Min Grade\nOut', 'K\nValue',
      'VC\nLength', 'VC\nSpacing', 'Overall',
    ]]

    const body = data.verticalIPs.map(vip => {
      const secIn  = data.gradeSections.find(s => Math.abs(s.toChainage   - vip.chainage) < 0.5)
      const secOut = data.gradeSections.find(s => Math.abs(s.fromChainage - vip.chainage) < 0.5)
      const vcTypeLabel = vip.vcType === 'none' ? 'Line'
        : vip.vcType === 'crest' ? 'Crest' : 'Sag'
      return [
        { content: vip.id,                    styles: { fontStyle: 'bold', textColor: C.text } },
        { content: vip.chainage.toFixed(1),   styles: { halign: 'right',  textColor: C.slate } },
        { content: vcTypeLabel,               styles: { halign: 'center', textColor: C.slate } },
        { content: vip.gradeIn.toFixed(2),    styles: { halign: 'right',  textColor: C.slate } },
        { content: vip.gradeOut.toFixed(2),   styles: { halign: 'right',  textColor: C.slate } },
        cell(secIn  ? gradeFind(secIn.fromChainage,  secIn.toChainage,  'Maximum longitudinal grade') : undefined),
        cell(secOut ? gradeFind(secOut.fromChainage, secOut.toChainage, 'Maximum longitudinal grade') : undefined),
        cell(secOut ? gradeFind(secOut.fromChainage, secOut.toChainage, 'Minimum grade')              : undefined),
        cell(vFind(vip.id, 'K value')),
        cell(vFind(vip.id, 'Minimum vertical curve length')),
        cell(vFind(vip.id, 'Vertical curve spacing')),
        overallCell(vAll(vip.id, vip.chainage)),
      ]
    })

    autoTable(doc, {
      head,
      body,
      startY: y,
      margin: { left: margin, right: margin },
      tableWidth: cw,
      styles:         { fontSize: 7, cellPadding: 1.8, minCellHeight: 9, overflow: 'linebreak', valign: 'middle' },
      headStyles:     { fillColor: C.navy, textColor: C.white, fontStyle: 'bold', fontSize: 6.5, halign: 'center', minCellHeight: 10 },
      alternateRowStyles: { fillColor: C.slateLight },
      columnStyles:   {
        0: { cellWidth: 12 },
        1: { cellWidth: 20 },
        2: { cellWidth: 18 },
        3: { cellWidth: 18 },
        4: { cellWidth: 18 },
        5: { cellWidth: 'auto' },
        6: { cellWidth: 'auto' },
        7: { cellWidth: 'auto' },
        8: { cellWidth: 'auto' },
        9: { cellWidth: 'auto' },
        10: { cellWidth: 'auto' },
        11: { cellWidth: 34 },
      },
      didDrawPage: () => drawPageHeader(doc, pageW),
    })
  }

  // ── Chainage issues (if any) ──────────────────────────────────────────────
  const chainIssues = results.filter(r => r.category === 'Chainages' && r.status !== 'pass')
  if (chainIssues.length > 0) {
    y = (doc as any).lastAutoTable.finalY + 8
    if (y > pageH - 45) { doc.addPage(); y = 14 }

    y = sectionHeading(doc, 'CHAINAGE ISSUES', margin, y, cw) + 2

    autoTable(doc, {
      head: [['Element', 'Check', 'Value', 'Limit', 'Notes']],
      body: chainIssues.map(r => [
        { content: r.element, styles: { fontStyle: 'bold' } },
        r.check,
        r.value,
        r.limit,
        r.notes ?? '',
      ]),
      startY: y,
      margin: { left: margin, right: margin },
      tableWidth: cw,
      styles:     { fontSize: 7, cellPadding: 1.8 },
      headStyles: { fillColor: C.navy, textColor: C.white, fontStyle: 'bold', fontSize: 6.5 },
      didDrawPage: () => drawPageHeader(doc, pageW),
    })
  }

  // ── Footers (all pages) ───────────────────────────────────────────────────
  const totalPages = (doc.internal as any).pages.length - 1
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    drawFooter(doc, pageW, pageH, p, totalPages, date)
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  const safeName = data.name.replace(/[^\w-]/g, '_')
  doc.save(`RGC_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`)
}
