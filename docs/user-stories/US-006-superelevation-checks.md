# US-006 — Superelevation Checks

**Status:** ✅ Complete

## Story

As a road designer,
I want the tool to check superelevation rates at every tabulated chainage,
so that I can confirm crossfall values stay within limits and develop at an acceptable rate.

## Acceptance Criteria

### Maximum Superelevation
- [x] Checks left lane and right lane crossfall separately at each tabulated chainage
- [x] Limit is 7% for Austroads standard, 10% for MRWA (AGRD03 / MRWA Supplement)
- [x] Issues a **fail** if either lane exceeds the maximum

### Normal Crossfall on Tangent
- [x] Detects when both carriageway sides have crossfall in the same direction (crown profile) and checks each side is ≤ 3% (AGRD03 Section 3.5)
- [x] Issues a **warning** if crossfall on a tangent section exceeds normal crown value

### Adverse Crossfall
- [x] Detects when both lanes slope in the same direction (single crossfall) and checks neither side exceeds 3% adverse (AGRD03 / MRWA)
- [x] Issues a **warning** with a note to verify curve direction and carriageway orientation

### Rate of Superelevation Development
- [x] Calculates the rate of change between consecutive tabulated points: `Δe / Δchainage` (%/m)
- [x] Issues a **warning** if the rate exceeds 0.7%/m on either side (MRWA Supplement / AGRD03 Section 3.6)
- [x] Note included to verify lane width for accurate twist calculation

## Notes

- Superelevation checks are skipped entirely if no superelevation table is found in the HTML report
- When superelevation data is present, the results are shown as additional columns in the horizontal IP matrix row for the nearest IP
