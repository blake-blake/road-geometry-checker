import type { AlignmentData, CheckResult, DesignSpeed, EmaxValue, RoadSurface, VehicleType } from '../types/geometry'
import { getKValue, getMaxGrade, MIN_GRADE, MIN_VCL, getMinVerticalTangent, getVehicleCrestK, VEHICLE_PARAMS } from '../standards/austroads'
import { UNSEALED_MAX_GRADE } from '../standards/unsealed'

let _id = 0
const id = () => `v${++_id}`

export function checkVerticalAlignment(
  data: AlignmentData,
  speed: DesignSpeed,
  _emax: EmaxValue,
  vehicleTypes: VehicleType[] = ['LME'],
  objectHeight: number = 0.2,
  roadSurface: RoadSurface = 'sealed',
  ipSpeedOverrides: Record<string, DesignSpeed> = {},
): CheckResult[] {
  _id = 0
  const results: CheckResult[] = []
  const { verticalIPs, gradeSections } = data
  if (verticalIPs.length === 0) return results

  const maxGrade = roadSurface === 'unsealed' ? UNSEALED_MAX_GRADE[speed] : getMaxGrade(speed)
  const gradeClause = roadSurface === 'unsealed' ? 'ARRB Unsealed Road Guide' : 'AGRD03 Table 9.1'

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
      clause: gradeClause,
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

  // ── Vertical curve spacing ────────────────────────────────────────────────
  for (let i = 1; i < verticalIPs.length; i++) {
    const prev = verticalIPs[i - 1]
    const curr = verticalIPs[i]
    if (prev.vcLength === 0 && curr.vcLength === 0) continue

    const tangentBetween = curr.chainage - curr.vcLength / 2 - (prev.chainage + prev.vcLength / 2)
    const currSpeed = ipSpeedOverrides[curr.id] ?? speed
    const minT = getMinVerticalTangent(currSpeed)

    if (tangentBetween < minT.desirable) {
      results.push({
        id: id(),
        category: 'Vertical Alignment',
        element: `VIP ${curr.id}`,
        check: 'Vertical curve spacing',
        value: `Tangent = ${tangentBetween.toFixed(1)} m`,
        limit: `≥ ${minT.absolute} m abs, ${minT.desirable} m desirable`,
        status: tangentBetween < minT.absolute ? 'fail' : 'warning',
        clause: 'AGRD03 Section 9.4',
        notes: tangentBetween < 0
          ? 'Vertical curves overlap.'
          : 'Tangent between vertical curves is below the desirable minimum.',
      })
    }
  }

  // ── VIP / Vertical curve checks ───────────────────────────────────────────
  for (const vip of verticalIPs) {
    if (vip.vcType === 'none' || vip.vcLength === 0) continue

    const vipSpeed = ipSpeedOverrides[vip.id] ?? speed
    const label = `VIP ${vip.id}`
    const clause = 'AGRD03 Table 9.1 & 9.2'

    // ── Crest K — compute worst required K across all selected vehicle types ──
    if (vip.vcType === 'crest') {
      // Find which vehicle type demands the highest (most conservative) K
      let worstK = { absolute: 0, desirable: 0, controlledBy: 'LME' as VehicleType }
      for (const vt of vehicleTypes) {
        const kv = getVehicleCrestK(vipSpeed, vt, objectHeight, roadSurface)
        if (kv.absolute > worstK.absolute) {
          worstK = { ...kv, controlledBy: vt }
        }
      }
      const vtLabel = vehicleTypes.length > 1 ? ` [${VEHICLE_PARAMS[worstK.controlledBy].label}]` : ''
      const h2Label = `h₂=${objectHeight}m`

      results.push({
        id: id(),
        category: 'Vertical Alignment',
        element: label,
        check: 'K value — crest (absolute minimum)',
        value: `K = ${vip.kValue.toFixed(1)}`,
        limit: `≥ K${worstK.absolute} (${h2Label})`,
        status: vip.kValue >= worstK.absolute ? 'pass' : 'fail',
        clause,
        notes: vehicleTypes.length > 1 ? `Controlled by ${VEHICLE_PARAMS[worstK.controlledBy].label}${vtLabel}` : undefined,
      })

      if (vip.kValue >= worstK.absolute && vip.kValue < worstK.desirable) {
        results.push({
          id: id(),
          category: 'Vertical Alignment',
          element: label,
          check: 'K value — crest (desirable)',
          value: `K = ${vip.kValue.toFixed(1)}`,
          limit: `≥ K${worstK.desirable} (${h2Label})`,
          status: 'warning',
          clause,
          notes: 'K value meets absolute but not desirable minimum. Justification required.',
        })
      }

      // Indicative sight distance
      const impliedSSD = Math.sqrt(vip.kValue * vip.gradeChange * vip.vcLength)
      results.push({
        id: id(),
        category: 'Vertical Alignment',
        element: label,
        check: 'Crest curve — sight distance adequacy (indicative)',
        value: `L=${vip.vcLength.toFixed(0)}m, K=${vip.kValue.toFixed(1)}, A=${vip.gradeChange.toFixed(2)}%`,
        limit: `K ≥ ${worstK.absolute} (SSD ≈ ${impliedSSD.toFixed(0)} m)`,
        status: vip.kValue >= worstK.absolute ? 'pass' : 'fail',
        clause: 'AGRD03 Section 9.3',
        notes: 'Sight distance calculation is indicative. Full AGRD03 Appendix A check recommended.',
      })
    }

    // ── Sag K — comfort criterion, same for all vehicle types ─────────────────
    if (vip.vcType === 'sag') {
      const kReq = getKValue(vipSpeed, 'sag')
      results.push({
        id: id(),
        category: 'Vertical Alignment',
        element: label,
        check: 'K value — sag (absolute minimum)',
        value: `K = ${vip.kValue.toFixed(1)}`,
        limit: `≥ K${kReq.absolute}`,
        status: vip.kValue >= kReq.absolute ? 'pass' : 'fail',
        clause,
      })
      if (vip.kValue >= kReq.absolute && vip.kValue < kReq.desirable) {
        results.push({
          id: id(),
          category: 'Vertical Alignment',
          element: label,
          check: 'K value — sag (desirable)',
          value: `K = ${vip.kValue.toFixed(1)}`,
          limit: `≥ K${kReq.desirable}`,
          status: 'warning',
          clause,
          notes: 'K value meets absolute but not desirable minimum. Justification required.',
        })
      }
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
  }

  return results
}
