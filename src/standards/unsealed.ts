/**
 * Unsealed Road Design Standards
 * Based on ARRB Guide to Unsealed Road Design (conservative values).
 * Applicable to gravel/dirt roads in good-dry condition.
 *
 * Note: friction values on unsealed roads are highly variable depending
 * on surface material, moisture content, and maintenance condition.
 * These values represent conservative dry/good condition estimates.
 */

import type { DesignSpeed } from '../types/geometry'

/**
 * Longitudinal friction coefficients for unsealed roads (ARRB Guide).
 * Lower than sealed roads, especially at higher speeds.
 */
export const UNSEALED_FRICTION: Record<DesignSpeed, number> = {
  40: 0.40, 50: 0.37, 60: 0.33, 70: 0.30,
  80: 0.27, 90: 0.24, 100: 0.22, 110: 0.20,
  120: 0.18, 130: 0.16,
}

/**
 * Maximum longitudinal grade (%) for unsealed roads (ARRB Guide).
 * Slightly higher allowable grades than sealed at low speeds due to
 * mine/access road contexts, but drainage and erosion constraints apply.
 */
export const UNSEALED_MAX_GRADE: Record<DesignSpeed, number> = {
  40: 16, 50: 14, 60: 12, 70: 10,
  80: 9,  90: 8,  100: 7, 110: 6,
  120: 5, 130: 4,
}

/**
 * Compute SSD for an unsealed road.
 * Formula: SSD = V/3.6 × t + V²/(254 × f)
 * Uses unsealed friction coefficients × vehicle friction multiplier.
 */
export function computeUnsealedSSD(
  speed: DesignSpeed,
  reactionTime: number,
  frictionMultiplier: number,
): number {
  const f = UNSEALED_FRICTION[speed] * frictionMultiplier
  const V = speed
  return V / 3.6 * reactionTime + (V * V) / (254 * f)
}

/** Vehicle types not applicable to unsealed roads */
export const UNSEALED_EXCLUDED_VEHICLES = ['RAV4S'] as const

/** Vehicle types not applicable to sealed roads */
export const SEALED_EXCLUDED_VEHICLES = ['HME'] as const
