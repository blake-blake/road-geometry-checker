import type { AlignmentData, CheckResult, DesignSpeed, Standard } from '../types/geometry'
import {
  getMinRadius, getMinCurveLength, getMinTransitionLength, getMinTangentBetweenCurves,
} from '../standards/austroads'

let _id = 0
const id = () => `h${++_id}`

export function checkHorizontalAlignment(
  data: AlignmentData,
  speed: DesignSpeed,
  standard: Standard,
): CheckResult[] {
  _id = 0
  const results: CheckResult[] = []
  const { horizontalIPs } = data
  if (horizontalIPs.length === 0) return results

  const minR = getMinRadius(speed, standard)
  const minCurveLen = getMinCurveLength(speed)
  const emaxLabel = standard === 'mainroads_wa' ? 'emax=10%' : 'emax=7%'
  const clause = standard === 'mainroads_wa'
    ? 'AGRD03 Table 3.1 / MRWA Supplement'
    : 'AGRD03 Table 3.1'

  for (let i = 0; i < horizontalIPs.length; i++) {
    const ip = horizontalIPs[i]
    if (ip.radius === 0) continue  // tangent — no curve checks

    const label = `IP ${ip.id}`

    // ── 1. Minimum radius (absolute) ─────────────────────────────────────────
    results.push({
      id: id(),
      category: 'Horizontal Alignment',
      element: label,
      check: 'Minimum curve radius (absolute)',
      value: `${ip.radius} m`,
      limit: `≥ ${minR.absolute} m (${emaxLabel})`,
      status: ip.radius >= minR.absolute ? 'pass' : 'fail',
      clause,
    })

    // ── 2. Minimum radius (desirable) ────────────────────────────────────────
    if (ip.radius >= minR.absolute && ip.radius < minR.desirable) {
      results.push({
        id: id(),
        category: 'Horizontal Alignment',
        element: label,
        check: 'Minimum curve radius (desirable)',
        value: `${ip.radius} m`,
        limit: `≥ ${minR.desirable} m (${emaxLabel})`,
        status: 'warning',
        clause,
        notes: 'Radius meets absolute minimum but not desirable. Justification required.',
      })
    }

    // ── 3. Minimum curve length (3-second rule) ───────────────────────────────
    if (ip.arcLength > 0) {
      results.push({
        id: id(),
        category: 'Horizontal Alignment',
        element: label,
        check: 'Minimum curve length (3-second travel time)',
        value: `${ip.arcLength.toFixed(1)} m`,
        limit: `≥ ${minCurveLen.toFixed(1)} m`,
        status: ip.arcLength >= minCurveLen ? 'pass' : 'fail',
        clause: 'AGRD03 Section 7.4',
      })
    }

    // ── 4. Transition curve lengths ───────────────────────────────────────────
    if (ip.transitionLengthIn > 0 || ip.transitionLengthOut > 0) {
      const minTrans = getMinTransitionLength(speed, ip.radius)

      if (ip.transitionLengthIn > 0) {
        results.push({
          id: id(),
          category: 'Horizontal Alignment',
          element: label,
          check: 'Transition length in (absolute min)',
          value: `${ip.transitionLengthIn} m`,
          limit: `≥ ${minTrans.absolute} m`,
          status: ip.transitionLengthIn >= minTrans.absolute ? 'pass' : 'fail',
          clause: 'AGRD03 Section 8.3',
        })
        if (ip.transitionLengthIn >= minTrans.absolute && ip.transitionLengthIn < minTrans.desirable) {
          results.push({
            id: id(),
            category: 'Horizontal Alignment',
            element: label,
            check: 'Transition length in (desirable)',
            value: `${ip.transitionLengthIn} m`,
            limit: `≥ ${minTrans.desirable} m`,
            status: 'warning',
            clause: 'AGRD03 Section 8.3',
            notes: 'Below desirable transition length.',
          })
        }
      }

      if (ip.transitionLengthOut > 0) {
        results.push({
          id: id(),
          category: 'Horizontal Alignment',
          element: label,
          check: 'Transition length out (absolute min)',
          value: `${ip.transitionLengthOut} m`,
          limit: `≥ ${minTrans.absolute} m`,
          status: ip.transitionLengthOut >= minTrans.absolute ? 'pass' : 'fail',
          clause: 'AGRD03 Section 8.3',
        })
      }
    }

    // ── 5. Deflection angle vs curve length (short curve appearance) ──────────
    if (ip.deflectionAngle > 0 && ip.arcLength > 0) {
      // Austroads: for deflection < 5°, Lmin ≥ 150 m (appearance)
      if (ip.deflectionAngle < 5) {
        results.push({
          id: id(),
          category: 'Horizontal Alignment',
          element: label,
          check: 'Short curve appearance (deflection < 5°)',
          value: `Arc = ${ip.arcLength.toFixed(1)} m, Δ = ${ip.deflectionAngle.toFixed(2)}°`,
          limit: '≥ 150 m arc for Δ < 5° (appearance)',
          status: ip.arcLength >= 150 ? 'pass' : 'warning',
          clause: 'AGRD03 Section 7.4',
          notes: 'Small deflection curves may appear as kinks. Check driver perception.',
        })
      }
    }

    // ── 6. Broken back / reverse curve ───────────────────────────────────────
    if (i > 0) {
      const prev = horizontalIPs[i - 1]
      if (prev.radius > 0) {
        // Estimate tangent length (T) from radius and deflection when not tabulated
        const tPrev = prev.tangentLength > 0
          ? prev.tangentLength
          : prev.radius * Math.tan((prev.deflectionAngle / 2) * (Math.PI / 180))
        const tCurr = ip.tangentLength > 0
          ? ip.tangentLength
          : ip.radius * Math.tan((ip.deflectionAngle / 2) * (Math.PI / 180))
        const tangentBetween = ip.chainage - tCurr - (prev.chainage + tPrev)
        const minT = getMinTangentBetweenCurves(speed)

        if (prev.deflectionDirection === ip.deflectionDirection) {
          // ── Broken back: same direction, tangent between them
          results.push({
            id: id(),
            category: 'Horizontal Alignment',
            element: label,
            check: 'Broken back curve',
            value: `Tangent ≈ ${tangentBetween.toFixed(1)} m (both ${ip.deflectionDirection})`,
            limit: `Avoid; if unavoidable ≥ ${minT.desirable} m`,
            status: tangentBetween < minT.absolute ? 'fail' : 'warning',
            clause: 'AGRD03 Section 7.5',
            notes: 'Broken back curves should be avoided. Consider compound curve or longer tangent.',
          })
        } else {
          // ── Reverse curve: opposite directions
          const hasTransitions = prev.transitionLengthOut > 0 && ip.transitionLengthIn > 0
          if (!hasTransitions) {
            results.push({
              id: id(),
              category: 'Horizontal Alignment',
              element: label,
              check: 'Reverse curve — tangent adequacy',
              value: `Tangent ≈ ${tangentBetween.toFixed(1)} m`,
              limit: `≥ ${minT.absolute} m abs, ${minT.desirable} m desirable`,
              status: tangentBetween < minT.absolute ? 'fail' : tangentBetween < minT.desirable ? 'warning' : 'info',
              clause: 'AGRD03 Section 7.5',
              notes: 'Reverse curve without transitions — tangent required for superelevation reversal.',
            })
          }
        }
      }
    }

    // ── 7. Compound curves — radius ratio check ───────────────────────────────
    if (i > 0) {
      const prev = horizontalIPs[i - 1]
      if (prev.radius > 0 && ip.radius > 0) {
        const rLarge = Math.max(prev.radius, ip.radius)
        const rSmall = Math.min(prev.radius, ip.radius)
        const ratio = rLarge / rSmall
        results.push({
          id: id(),
          category: 'Horizontal Alignment',
          element: `${label} (compound)`,
          check: 'Compound curve radius ratio',
          value: `${rLarge}/${rSmall} = ${ratio.toFixed(2)}:1`,
          limit: '≤ 2:1 (desirable ≤ 1.5:1)',
          status: ratio <= 2 ? (ratio <= 1.5 ? 'pass' : 'warning') : 'fail',
          clause: 'AGRD03 Section 7.5',
          notes: ratio > 2 ? 'Ratio exceeds 2:1 — transition curve or tangent required.' : undefined,
        })
      }
    }
  }

  // ── 7. Minimum tangent length between consecutive curves ───────────────────
  for (let i = 0; i < horizontalIPs.length - 1; i++) {
    const a = horizontalIPs[i]
    const b = horizontalIPs[i + 1]
    if (a.radius === 0 || b.radius === 0) continue
    // Tangent length between end of a and start of b
    const tangentBetween = b.chainage - b.tangentLength - (a.chainage + a.tangentLength)
    if (tangentBetween < 0) {
      results.push({
        id: id(),
        category: 'Horizontal Alignment',
        element: `IP ${a.id} – IP ${b.id}`,
        check: 'Tangent length between curves',
        value: `${tangentBetween.toFixed(1)} m (overlapping tangents)`,
        limit: '> 0 m (curves must not overlap)',
        status: 'fail',
        clause: 'AGRD03 Section 7.5',
        notes: 'Tangent points of adjacent curves overlap. Review alignment.',
      })
    }
  }

  return results
}
