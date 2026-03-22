/**
 * Austroads Guide to Road Design Part 3 — Geometric Design (AGRD03)
 * with Main Roads Western Australia Supplement values where noted.
 */

import type { DesignSpeed, Standard } from '../types/geometry'

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
  standard: Standard,
): { absolute: number; desirable: number } {
  return standard === 'mainroads_wa' ? MIN_RADIUS_EMAX10[speed] : MIN_RADIUS_EMAX7[speed]
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

// ─── Superelevation ──────────────────────────────────────────────────────────

/** Maximum superelevation rate (%). Main Roads WA = 10%, Austroads = 7% */
export function getMaxSuperelevation(standard: Standard): number {
  return standard === 'mainroads_wa' ? 10 : 7
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
