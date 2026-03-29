# US-007 — Chainage Continuity Checks

**Status:** ✅ Complete

## Story

As a road designer,
I want the tool to verify that chainages in the alignment are geometrically consistent,
so that data entry errors or 12d export issues are surfaced before any geometry checking proceeds.

## Acceptance Criteria

- [x] Checks horizontal IPs are in strictly increasing chainage order — **fail** on reversal or duplicate
- [x] Checks vertical IPs are in strictly increasing chainage order — **fail** on reversal or duplicate
- [x] Checks that tangent points of consecutive horizontal curves do not overlap (negative gap) — **fail**
- [x] Checks that vertical curve extents of consecutive VIPs do not overlap — **fail** with overlap distance
- [x] If no issues are found, records a single **pass** result showing the chainage range
- [x] Chainage issues are displayed in a separate banner section below the IP matrix tables

## Notes

- Overlap tolerance is 0.01 m to accommodate floating point rounding in 12d output
- These checks run independently of design speed and standard — they are geometry consistency checks, not standards checks
