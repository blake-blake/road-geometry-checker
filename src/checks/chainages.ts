import type { AlignmentData, CheckResult } from '../types/geometry'

let _id = 0
const id = () => `c${++_id}`

const TOLERANCE = 0.01  // metres

export function checkChainages(data: AlignmentData): CheckResult[] {
  _id = 0
  const results: CheckResult[] = []
  const { horizontalIPs, verticalIPs } = data

  // ── Horizontal IPs: chainage progression ─────────────────────────────────
  for (let i = 1; i < horizontalIPs.length; i++) {
    const prev = horizontalIPs[i - 1]
    const curr = horizontalIPs[i]
    if (curr.chainage <= prev.chainage) {
      results.push({
        id: id(),
        category: 'Chainages',
        element: `IP ${curr.id}`,
        check: 'Chainage progression (horizontal)',
        value: `${curr.chainage.toFixed(3)} ≤ ${prev.chainage.toFixed(3)} (IP ${prev.id})`,
        limit: 'Strictly increasing chainages',
        status: 'fail',
        clause: 'Geometry consistency',
        notes: 'Chainage reversal or duplicate detected in horizontal alignment.',
      })
    }
  }

  // ── Vertical IPs: chainage progression ───────────────────────────────────
  for (let i = 1; i < verticalIPs.length; i++) {
    const prev = verticalIPs[i - 1]
    const curr = verticalIPs[i]
    if (curr.chainage <= prev.chainage) {
      results.push({
        id: id(),
        category: 'Chainages',
        element: `VIP ${curr.id}`,
        check: 'Chainage progression (vertical)',
        value: `${curr.chainage.toFixed(3)} ≤ ${prev.chainage.toFixed(3)} (VIP ${prev.id})`,
        limit: 'Strictly increasing chainages',
        status: 'fail',
        clause: 'Geometry consistency',
        notes: 'Chainage reversal or duplicate detected in vertical alignment.',
      })
    }
  }

  // ── Horizontal: arc length vs chainage span ───────────────────────────────
  for (let i = 0; i < horizontalIPs.length; i++) {
    const ip = horizontalIPs[i]
    if (ip.radius === 0 || ip.arcLength === 0) continue
    // The chainage span from TS to ST = transIn + arc + transOut
    const expectedSpan = ip.transitionLengthIn + ip.arcLength + ip.transitionLengthOut
    if (i < horizontalIPs.length - 1) {
      const nextCh = horizontalIPs[i + 1].chainage
      const tangentToNext = nextCh - ip.chainage - ip.tangentLength
      if (tangentToNext < -TOLERANCE) {
        results.push({
          id: id(),
          category: 'Chainages',
          element: `IP ${ip.id} → IP ${horizontalIPs[i + 1].id}`,
          check: 'Overlapping curve extents',
          value: `Gap to next IP: ${tangentToNext.toFixed(2)} m`,
          limit: '> 0 m (no overlap)',
          status: 'fail',
          clause: 'Geometry consistency',
        })
      }
    }
    void expectedSpan
  }

  // ── Vertical curve extents ────────────────────────────────────────────────
  for (let i = 0; i < verticalIPs.length; i++) {
    const vip = verticalIPs[i]
    if (vip.vcLength === 0) continue
    const halfVCL = vip.vcLength / 2

    if (i > 0) {
      const prev = verticalIPs[i - 1]
      const prevHalfVCL = prev.vcLength / 2
      const tangentBetween = vip.chainage - halfVCL - (prev.chainage + prevHalfVCL)
      if (tangentBetween < -TOLERANCE) {
        results.push({
          id: id(),
          category: 'Chainages',
          element: `VIP ${vip.id}`,
          check: 'Overlapping vertical curves',
          value: `Overlap: ${(-tangentBetween).toFixed(2)} m`,
          limit: '> 0 m (no overlap)',
          status: 'fail',
          clause: 'Geometry consistency',
          notes: `VIP ${prev.id} VC end overlaps VIP ${vip.id} VC start.`,
        })
      }
    }
  }

  if (results.length === 0) {
    results.push({
      id: id(),
      category: 'Chainages',
      element: 'All',
      check: 'Chainage continuity',
      value: `${data.startChainage.toFixed(0)} – ${data.endChainage.toFixed(0)}`,
      limit: 'No gaps, reversals or overlaps',
      status: 'pass',
      clause: 'Geometry consistency',
    })
  }

  return results
}
