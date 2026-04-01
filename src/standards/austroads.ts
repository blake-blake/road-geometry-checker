/**
 * Austroads Guide to Road Design Part 3 — Geometric Design (AGRD03)
 * with Main Roads Western Australia Supplement values where noted.
 */

import type { DesignSpeed, EmaxValue, VehicleType, RoadSurface } from '../types/geometry'
import { UNSEALED_FRICTION, computeUnsealedSSD } from './unsealed'

// ─── Horizontal Alignment ────────────────────────────────────────────────────

/** Minimum horizontal curve radius (m). Austroads AGRD03 Table 3.1 */
const MIN_RADIUS_EMAX10: Record<DesignSpeed, { absolute: number; desirable: number }> = {
  40:  { absolute: 30,   desirable: 40 },
  50:  { absolute: 55,   desirable: 80 },
  60:  { absolute: 90,   desirable: 130 },
  70:  { absolute: 140,  desirable: 200 },
  80:  { absolute: 200,  desirable: 310 },
  90:  { absolute: 280,  desirable: 440 },
  100: { absolute: 370,  desirable: 600 },
  110: { absolute: 490,  desirable: 800 },
  120: { absolute: 630,  desirable: 1000 },
  130: { absolute: 800,  desirable: 1300 },
}

/**
 * emax = 6% (conservative mine road default). Values extrapolated from AGRD03 Table 3.1
 * using linear step from the emax=7% → emax=10% ratio per 1% emax change.
 */
const MIN_RADIUS_EMAX6: Record<DesignSpeed, { absolute: number; desirable: number }> = {
  40:  { absolute: 45,   desirable: 60 },
  50:  { absolute: 90,   desirable: 120 },
  60:  { absolute: 145,  desirable: 210 },
  70:  { absolute: 220,  desirable: 320 },
  80:  { absolute: 350,  desirable: 485 },
  90:  { absolute: 495,  desirable: 680 },
  100: { absolute: 680,  desirable: 920 },
  110: { absolute: 890,  desirable: 1205 },
  120: { absolute: 1125, desirable: 1510 },
  130: { absolute: 1470, desirable: 1970 },
}

/** emax = 7% (Austroads default, non-MRWA). Austroads AGRD03 Table 3.1 */
const MIN_RADIUS_EMAX7: Record<DesignSpeed, { absolute: number; desirable: number }> = {
  40:  { absolute: 40,   desirable: 55 },
  50:  { absolute: 80,   desirable: 110 },
  60:  { absolute: 130,  desirable: 190 },
  70:  { absolute: 200,  desirable: 290 },
  80:  { absolute: 310,  desirable: 440 },
  90:  { absolute: 440,  desirable: 620 },
  100: { absolute: 600,  desirable: 840 },
  110: { absolute: 790,  desirable: 1100 },
  120: { absolute: 1000, desirable: 1380 },
  130: { absolute: 1300, desirable: 1800 },
}

export function getMinRadius(
  speed: DesignSpeed,
  emax: EmaxValue,
): { absolute: number; desirable: number } {
  if (emax === 10) return MIN_RADIUS_EMAX10[speed]
  if (emax === 6)  return MIN_RADIUS_EMAX6[speed]
  return MIN_RADIUS_EMAX7[speed]
}

/**
 * Minimum horizontal curve length (m) — 3-second rule.
 * Austroads AGRD03 Section 7.4
 */
export function getMinCurveLength(speed: DesignSpeed): number {
  return (speed / 3.6) * 3  // 3 seconds travel at design speed
}

/**
 * Minimum transition curve length (m) based on rate of change of centripetal
 * acceleration. Austroads AGRD03 Section 8.3 (q = 0.6 m/s³ absolute, 0.3 desirable)
 */
export function getMinTransitionLength(
  speed: DesignSpeed,
  radius: number,
): { absolute: number; desirable: number } {
  const v = speed / 3.6  // m/s
  const absolute  = Math.pow(v, 3) / (radius * 0.6)
  const desirable = Math.pow(v, 3) / (radius * 0.3)
  return { absolute: Math.ceil(absolute), desirable: Math.ceil(desirable) }
}

/**
 * Minimum tangent length between consecutive horizontal curves.
 * Applies to both broken back (same direction) and reverse curves without transitions.
 * Absolute = V m, desirable = 2V m. AGRD03 Section 7.5
 */
export function getMinTangentBetweenCurves(speed: DesignSpeed): { absolute: number; desirable: number } {
  return { absolute: speed, desirable: speed * 2 }
}

// ─── Vertical Alignment ──────────────────────────────────────────────────────

/** K values for crest vertical curves. Austroads AGRD03 Table 9.1 */
const K_CREST: Record<DesignSpeed, { absolute: number; desirable: number }> = {
  40:  { absolute: 1,   desirable: 3 },
  50:  { absolute: 4,   desirable: 9 },
  60:  { absolute: 9,   desirable: 17 },
  70:  { absolute: 17,  desirable: 30 },
  80:  { absolute: 26,  desirable: 55 },
  90:  { absolute: 38,  desirable: 80 },
  100: { absolute: 55,  desirable: 115 },
  110: { absolute: 76,  desirable: 155 },
  120: { absolute: 100, desirable: 205 },
  130: { absolute: 128, desirable: 260 },
}

/** K values for sag vertical curves. Austroads AGRD03 Table 9.2 */
const K_SAG: Record<DesignSpeed, { absolute: number; desirable: number }> = {
  40:  { absolute: 3,   desirable: 5 },
  50:  { absolute: 8,   desirable: 13 },
  60:  { absolute: 14,  desirable: 20 },
  70:  { absolute: 22,  desirable: 30 },
  80:  { absolute: 32,  desirable: 44 },
  90:  { absolute: 44,  desirable: 61 },
  100: { absolute: 59,  desirable: 82 },
  110: { absolute: 77,  desirable: 106 },
  120: { absolute: 98,  desirable: 133 },
  130: { absolute: 122, desirable: 164 },
}

export function getKValue(
  speed: DesignSpeed,
  type: 'crest' | 'sag',
): { absolute: number; desirable: number } {
  return type === 'crest' ? K_CREST[speed] : K_SAG[speed]
}

/** Maximum longitudinal grade (%). Austroads AGRD03 Table 9.1 */
const MAX_GRADE: Record<DesignSpeed, number> = {
  40: 16, 50: 12, 60: 10, 70: 9,
  80: 8,  90: 7,  100: 6, 110: 5,
  120: 5, 130: 4,
}

export function getMaxGrade(speed: DesignSpeed): number {
  return MAX_GRADE[speed]
}

/** Minimum grade for drainage — typically 0.3%. Austroads AGRD03 Section 9.6 */
export const MIN_GRADE = 0.3

/**
 * Stopping sight distance (m). Austroads AGRD03 Table 4.1
 * (PIEV = 2.5s, deceleration = 3.4 m/s²)
 */
const SSD: Record<DesignSpeed, number> = {
  40: 40,  50: 60,  60: 85,  70: 110,
  80: 140, 90: 170, 100: 210, 110: 250,
  120: 295, 130: 345,
}

export function getSSD(speed: DesignSpeed): number {
  return SSD[speed]
}

/** Minimum vertical curve length (general, not SSD-derived). 50 m practical minimum. */
export const MIN_VCL = 50

// ─── Vehicle type parameters ─────────────────────────────────────────────────

/**
 * Parameters per vehicle type used for SSD and crest K computation.
 * reactionTime: PIEV / perception-reaction time in seconds
 * frictionMultiplier: applied to base road friction (accounts for vehicle braking capability)
 * eyeHeight: driver/operator eye height h1 (metres)
 * maxSpeed: practical maximum design speed for this vehicle type (km/h)
 */
export const VEHICLE_PARAMS: Record<VehicleType, {
  label: string
  reactionTime: number
  frictionMultiplier: number
  eyeHeight: number
  maxSpeed: number
}> = {
  LME:   { label: 'LME',    reactionTime: 2.5, frictionMultiplier: 1.0,  eyeHeight: 1.15, maxSpeed: 130 },
  Truck: { label: 'Truck',  reactionTime: 2.5, frictionMultiplier: 0.85, eyeHeight: 2.4,  maxSpeed: 130 },
  RAV4S: { label: 'RAV-4S', reactionTime: 4.0, frictionMultiplier: 0.85, eyeHeight: 2.4,  maxSpeed: 130 },
  HME:   { label: 'HME',   reactionTime: 4.0, frictionMultiplier: 0.50, eyeHeight: 6.5,  maxSpeed: 55  },
}

/** Sealed road friction coefficients (Austroads AGRD03 Table 4.1, calibrated to reproduce SSD table) */
const SEALED_FRICTION: Record<DesignSpeed, number> = {
  40: 0.36, 50: 0.35, 60: 0.33, 70: 0.31,
  80: 0.30, 90: 0.30, 100: 0.28, 110: 0.25,
  120: 0.24, 130: 0.23,
}

/**
 * Compute SSD for a given vehicle type and road surface.
 * Formula: SSD = V/3.6 × t + V²/(254 × f)
 * where t = reaction time (s) and f = friction coefficient × vehicle multiplier.
 * LME on sealed is calibrated to match AGRD03 Table 4.1.
 */
export function computeSSD(
  speed: DesignSpeed,
  vehicleType: VehicleType,
  roadSurface: RoadSurface = 'sealed',
): number {
  const params = VEHICLE_PARAMS[vehicleType]
  if (roadSurface === 'unsealed') {
    return computeUnsealedSSD(speed, params.reactionTime, params.frictionMultiplier)
  }
  const f = SEALED_FRICTION[speed] * params.frictionMultiplier
  const V = speed
  return V / 3.6 * params.reactionTime + (V * V) / (254 * f)
}

/**
 * Compute minimum crest K value for a given vehicle type, road surface, and object height.
 * Scales from the AGRD03 LME sealed baseline K table using:
 *   K_vehicle = K_LME × (SSD_vehicle / SSD_LME)² × (h_LME / h_vehicle)²
 * where h = √(2·h1) + √(2·h2)
 *
 * objectHeight h2: 0.2 m (AGRD03 standard) or 0.0 m (object on road surface)
 */
export function getVehicleCrestK(
  speed: DesignSpeed,
  vehicleType: VehicleType,
  objectHeight: number,
  roadSurface: RoadSurface = 'sealed',
): { absolute: number; desirable: number } {
  const baseK = K_CREST[speed]
  const lmeSSD = SSD[speed]
  const vehicleSSD = computeSSD(speed, vehicleType, roadSurface)

  // Combined height factor for LME baseline (h1=1.15m, h2=0.2m)
  const hLME = Math.sqrt(2 * 1.15) + Math.sqrt(2 * 0.2)
  // Combined height factor for this vehicle and object height
  const h1 = VEHICLE_PARAMS[vehicleType].eyeHeight
  const hVehicle = Math.sqrt(2 * h1) + Math.sqrt(2 * objectHeight)

  const scale = Math.pow(vehicleSSD / lmeSSD, 2) * Math.pow(hLME / hVehicle, 2)
  return {
    absolute:  Math.ceil(baseK.absolute  * scale),
    desirable: Math.ceil(baseK.desirable * scale),
  }
}

/** Unsealed friction lookup re-exported for use in check files */
export { UNSEALED_FRICTION }

/**
 * Minimum tangent between consecutive vertical curves for appearance and perception.
 * Absolute = V m, desirable = 2V m. AGRD03 Section 9.4
 */
export function getMinVerticalTangent(speed: DesignSpeed): { absolute: number; desirable: number } {
  return { absolute: speed, desirable: speed * 2 }
}

// ─── Superelevation ──────────────────────────────────────────────────────────

/** Maximum superelevation rate (%) — equals the selected emax value. */
export function getMaxSuperelevation(emax: EmaxValue): number {
  return emax
}

/** Normal crossfall (tangent) rate — both carriageways. Typically 3% max. */
export const NORMAL_CROSSFALL = 3.0

/**
 * Minimum superelevation on a curve (%).
 * Curves where superelevation is not required (radius very large) retain normal crossfall.
 * Below ~3000 m radius at 100 km/h superelevation should be applied.
 */
export function getMinSuperelevationOnCurve(radius: number, speed: DesignSpeed): number {
  // Simplified: if radius > 4× desirable min, normal crossfall is acceptable
  const desirableMin = MIN_RADIUS_EMAX7[speed].desirable * 4
  if (radius > desirableMin) return 2.0  // normal crossfall adequate
  return 3.0  // minimum development required
}

/**
 * Maximum rate of superelevation development (% per metre).
 * Main Roads WA: 0.7% per metre max twist on any 3 m transverse distance.
 */
export const MAX_SUPER_DEVELOPMENT_RATE = 0.7  // %/m
