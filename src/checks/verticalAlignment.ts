import type { AlignmentData, CheckResult, DesignSpeed, Standard } from '../types/geometry'
import { getKValue, getMaxGrade, MIN_GRADE, MIN_VCL } from '../standards/austroads'

let _id = 0
const id = () => `v${++_id}`

export function checkVerticalAlignment(
  data: AlignmentData,
  speed: DesignSpeed,
  _standard: Standard,
): CheckResult[] {
  _id = 0
  const results: CheckResult[] = []
  const { verticalIPs, gradeSections } = data
  if (verticalIPs.length === 0) return results

  const maxGrade = getMaxGrade(speed)

  // ── Grade section checks ──────────────────────────────────────────────────
  for (const section of gradeSections) {
    const absGrade = Math.abs(section.grade)
    const label = `Ch ${section.fromChainage.toFixed(0)}–${section.toChainage.toFixed(0)}`

    results.push({
      id: id(),
      category: 'Vertical Alignment',
      element: label,
      check: 'Maximum longitudinal grade',
      value: `${absGrade.toFixed(2)}%`,
      limit: `≤ ${maxGrade}%`,
      status: absGrade <= maxGrade ? 'pass' : 'fail',
      clause: 'AGRD03 Table 9.1',
    })

    results.push({
      id: id(),
      category: 'Vertical Alignment',
      element: label,
      check: 'Minimum grade (drainage)',
      value: `${absGrade.toFixed(2)}%`,
      limit: `≥ ${MIN_GRADE}%`,
      status: absGrade >= MIN_GRADE ? 'pass' : (absGrade === 0 ? 'fail' : 'warning'),
      clause: 'AGRD03 Section 9.6',
      notes: absGrade < MIN_GRADE && absGrade > 0 ? 'Grade below 0.3% — drainage provisions required.' : undefined,
    })
  }

  // ── VIP / Vertical curve checks ───────────────────────────────────────────
  for (const vip of verticalIPs) {
    if (vip.vcType === 'none' || vip.vcLength === 0) continue

    const label = `VIP ${vip.id}`
    const kReq  = getKValue(speed, vip.vcType)
    const clause = 'AGRD03 Table 9.1 & 9.2'

    // K value — absolute minimum
    results.push({
      id: id(),
      category: 'Vertical Alignment',
      element: label,
      check: `K value — ${vip.vcType} (absolute minimum)`,
      value: `K = ${vip.kValue.toFixed(1)}`,
      limit: `≥ K${kReq.absolute}`,
      status: vip.kValue >= kReq.absolute ? 'pass' : 'fail',
      clause,
    })

    // K value — desirable
    if (vip.kValue >= kReq.absolute && vip.kValue < kReq.desirable) {
      results.push({
        id: id(),
        category: 'Vertical Alignment',
        element: label,
        check: `K value — ${vip.vcType} (desirable)`,
        value: `K = ${vip.kValue.toFixed(1)}`,
        limit: `≥ K${kReq.desirable}`,
        status: 'warning',
        clause,
        notes: 'K value meets absolute but not desirable minimum. Justification required.',
      })
    }

    // Minimum vertical curve length
    results.push({
      id: id(),
      category: 'Vertical Alignment',
      element: label,
      check: 'Minimum vertical curve length',
      value: `${vip.vcLength.toFixed(1)} m`,
      limit: `≥ ${MIN_VCL} m`,
      status: vip.vcLength >= MIN_VCL ? 'pass' : 'fail',
      clause: 'AGRD03 Section 9.5',
    })

    // Grade change check — very small grade changes may not need a VC
    if (vip.gradeChange < 0.1 && vip.vcLength > 0) {
      results.push({
        id: id(),
        category: 'Vertical Alignment',
        element: label,
        check: 'Unnecessary vertical curve',
        value: `Grade change = ${vip.gradeChange.toFixed(2)}%`,
        limit: 'Review if VC required for grade change < 0.1%',
        status: 'warning',
        clause: 'AGRD03 Section 9.4',
        notes: 'Very small grade change — confirm vertical curve is necessary.',
      })
    }

    // Crest — derived sight distance from K value
    if (vip.vcType === 'crest') {
      // SSD from crest curve: SSD = L/2 + ... simplified check via K × A
      const impliedSSD = Math.sqrt(vip.kValue * vip.gradeChange * vip.vcLength)
      results.push({
        id: id(),
        category: 'Vertical Alignment',
        element: label,
        check: 'Crest curve — sight distance adequacy (indicative)',
        value: `L=${vip.vcLength.toFixed(0)}m, K=${vip.kValue.toFixed(1)}, A=${vip.gradeChange.toFixed(2)}%`,
        limit: `K ≥ ${kReq.absolute} (provides SSD ≈ ${impliedSSD.toFixed(0)} m)`,
        status: vip.kValue >= kReq.absolute ? 'pass' : 'fail',
        clause: 'AGRD03 Section 9.3',
        notes: 'Sight distance calculation is indicative. Full AGRD03 Appendix A check recommended.',
      })
    }
  }

  return results
}
