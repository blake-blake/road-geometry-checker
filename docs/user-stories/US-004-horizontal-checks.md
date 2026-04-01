# US-004 — Horizontal Alignment Checks

**Status:** ✅ Complete

## Story

As a road designer,
I want the tool to check every horizontal IP against Austroads AGRD03 and MRWA requirements,
so that I can identify geometry issues before submitting for design acceptance.

## Acceptance Criteria

### Minimum Curve Radius
- [x] Checks actual radius against absolute minimum for the selected speed and standard (AGRD03 Table 3.1)
- [x] Issues a **fail** if radius is below absolute minimum
- [x] Issues a **warning** if radius meets absolute but not desirable minimum, with a note that justification is required

### Minimum Curve Length (3-Second Rule)
- [x] Checks arc length against `(V / 3.6) × 3` metres (AGRD03 Section 7.4)
- [x] Issues a **fail** if arc length is below minimum

### Transition Curve Lengths
- [x] Checks leading and trailing transition lengths against absolute and desirable minimums
- [x] Minimum calculated from rate of change of centripetal acceleration: `v³ / (R × q)` where q = 0.6 m/s³ absolute, 0.3 desirable (AGRD03 Section 8.3)
- [x] Issues a **fail** for below absolute; **warning** for below desirable
- [x] Skips transition checks if no transition lengths are tabulated for the IP

### Short Curve Appearance
- [x] Checks curves with deflection angle < 5° for minimum 150 m arc length (AGRD03 Section 7.4)
- [x] Issues a **warning** if arc < 150 m on a small deflection curve (kink appearance risk)

### Broken Back Curves
- [x] Detects consecutive curves in the **same direction** with a tangent between them
- [x] Estimates tangent length from `R × tan(Δ/2)` when not directly tabulated
- [x] Issues a **fail** if tangent < V m (absolute); **warning** otherwise (AGRD03 Section 7.5)

### Reverse Curves
- [x] Detects consecutive curves in **opposite directions** without transitions on both sides
- [x] Issues a **fail** if tangent < V m; **warning** if < 2V m; **info** if ≥ 2V m (AGRD03 Section 7.5)

### Compound Curve Radius Ratio
- [x] For consecutive curves, calculates `R_large / R_small`
- [x] Issues a **fail** if ratio > 2:1; **warning** if > 1.5:1 (AGRD03 Section 7.5)

### Overlapping Tangent Points
- [x] Detects when the tangent points of adjacent curves geometrically overlap (negative tangent between them)
- [x] Issues a **fail** — curves must not overlap

## Notes

- Tangent points (radius = 0) are skipped for all checks
- Standard clause references are embedded in each result for traceability
