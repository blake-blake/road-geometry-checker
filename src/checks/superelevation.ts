import type { AlignmentData, CheckResult, DesignSpeed, EmaxValue } from '../types/geometry'
import { getMaxSuperelevation, NORMAL_CROSSFALL } from '../standards/austroads'

let _id = 0
const id = () => `s${++_id}`

export function checkSuperelevation(
  data: AlignmentData,
  _speed: DesignSpeed,
  emax: EmaxValue,
): CheckResult[] {
  _id = 0
  const results: CheckResult[] = []
  const { superelevation } = data
  if (superelevation.length === 0) return results

  const maxSuper = getMaxSuperelevation(emax)
  const clause = emax === 10
    ? 'AGRD03 Part 3 Sec 3.5 / MRWA Supplement (emax=10%)'
    : `AGRD03 Part 3 Section 3.5 (emax=${emax}%)`

  for (let i = 0; i < superelevation.length; i++) {
    const pt = superelevation[i]
    const label = `Ch ${pt.chainage.toFixed(0)}`
    const leftAbs  = Math.abs(pt.leftRate)
    const rightAbs = Math.abs(pt.rightRate)

    // ── Maximum superelevation ─────────────────────────────────────────────
    results.push({
      id: id(),
      category: 'Superelevation',
      element: label,
      check: 'Maximum superelevation — left lane',
      value: `${leftAbs.toFixed(1)}%`,
      limit: `≤ ${maxSuper}%`,
      status: leftAbs <= maxSuper ? 'pass' : 'fail',
      clause,
    })

    results.push({
      id: id(),
      category: 'Superelevation',
      element: label,
      check: 'Maximum superelevation — right lane',
      value: `${rightAbs.toFixed(1)}%`,
      limit: `≤ ${maxSuper}%`,
      status: rightAbs <= maxSuper ? 'pass' : 'fail',
      clause,
    })

    // ── Normal crossfall not exceeded on tangent ───────────────────────────
    // On a straight, both sides should be ≤ NORMAL_CROSSFALL
    const bothSameSide = pt.leftRate < 0 && pt.rightRate > 0 || pt.leftRate > 0 && pt.rightRate < 0
    if (!bothSameSide) {
      // Normal crown — check each side
      if (leftAbs > NORMAL_CROSSFALL) {
        results.push({
          id: id(),
          category: 'Superelevation',
          element: label,
          check: 'Normal crossfall (tangent) — left',
          value: `${leftAbs.toFixed(1)}%`,
          limit: `≤ ${NORMAL_CROSSFALL}%`,
          status: 'warning',
          clause: 'AGRD03 Part 3 Section 3.5',
          notes: 'Crossfall exceeds normal crown value on apparent tangent section.',
        })
      }
      if (rightAbs > NORMAL_CROSSFALL) {
        results.push({
          id: id(),
          category: 'Superelevation',
          element: label,
          check: 'Normal crossfall (tangent) — right',
          value: `${rightAbs.toFixed(1)}%`,
          limit: `≤ ${NORMAL_CROSSFALL}%`,
          status: 'warning',
          clause: 'AGRD03 Part 3 Section 3.5',
        })
      }
    }

    // ── Adverse crossfall check ────────────────────────────────────────────
    // Adverse crossfall occurs when the low side of a curve has +ve crossfall
    // (i.e. carriageway tilted the wrong way relative to curve direction)
    // Simple check: flag where both sides have same sign but are non-zero (single crossfall)
    // and one exceeds adverse limit
    const adverseLimit = 3.0  // % max adverse crossfall — MRWA standard
    if (bothSameSide) {
      // Check the "outside" of the curve doesn't have adverse crossfall
      // Without curve direction context we check both sides independently
      const adverseLeft  = pt.leftRate  > adverseLimit
      const adverseRight = pt.rightRate > adverseLimit
      if (adverseLeft || adverseRight) {
        results.push({
          id: id(),
          category: 'Superelevation',
          element: label,
          check: 'Adverse crossfall check',
          value: `L:${pt.leftRate.toFixed(1)}% R:${pt.rightRate.toFixed(1)}%`,
          limit: `Adverse side ≤ ${adverseLimit}%`,
          status: 'warning',
          clause: 'AGRD03 Part 3 Section 3.5 / MRWA',
          notes: 'Potential adverse crossfall detected. Verify curve direction and carriageway orientation.',
        })
      }
    }

    // ── Rate of superelevation development ────────────────────────────────
    if (i > 0) {
      const prev = superelevation[i - 1]
      const dCh = pt.chainage - prev.chainage
      if (dCh > 0) {
        const rateLeft  = Math.abs(pt.leftRate  - prev.leftRate)  / dCh * 100  // %/100m → %/m *100
        const rateRight = Math.abs(pt.rightRate - prev.rightRate) / dCh * 100

        // MRWA: max 0.7% per metre over the rotated width
        // For a 3.5 m lane width: twist = (Δe / dCh) × 3.5 — check as %/m
        const twistLeft  = Math.abs(pt.leftRate  - prev.leftRate)  / dCh
        const twistRight = Math.abs(pt.rightRate - prev.rightRate) / dCh
        const maxTwist   = 0.007  // 0.7% per metre

        if (twistLeft > maxTwist || twistRight > maxTwist) {
          results.push({
            id: id(),
            category: 'Superelevation',
            element: `Ch ${prev.chainage.toFixed(0)}–${pt.chainage.toFixed(0)}`,
            check: 'Superelevation development rate',
            value: `L: ${(twistLeft * 100).toFixed(3)}%/m  R: ${(twistRight * 100).toFixed(3)}%/m`,
            limit: `≤ 0.7%/m`,
            status: 'warning',
            clause: 'MRWA Supplement / AGRD03 Part 3 Section 3.6',
            notes: `Δe: L=${(Math.abs(pt.leftRate - prev.leftRate)).toFixed(2)}% over ${dCh.toFixed(0)} m. Verify lane width for twist calculation.`,
          })
        } else {
          void rateLeft; void rateRight  // suppress unused warning
        }
      }
    }
  }

  return results
}
