# US-008 — Results Display (IP Matrix Table)

**Status:** ✅ Complete

## Story

As a road designer,
I want to see all check results in a matrix layout with one row per IP and one column per check,
so that I can quickly scan the full alignment and identify which IPs have issues without reading through a long list.

## Acceptance Criteria

### Summary Cards
- [x] Four cards show counts for: Total Checks, Pass, Fail, Warning
- [x] Cards update immediately when design speed or standard is changed

### Alignment Info Tiles
- [x] Four info tiles show: Horizontal IP count, Vertical IP count, Superelevation point count, Chainage range

### Horizontal IP Matrix
- [x] One row per horizontal IP
- [x] Fixed columns: IP, Chainage, Direction, Radius, Arc Length
- [x] Check columns: Min Radius, Curve Length, Trans In, Trans Out, Comp. Ratio, Short Curve, Broken Back, Reverse Curve
- [x] Optional Superelevation column if superelevation data is present
- [x] Overall column showing worst status with a bulleted list of failing checks
- [x] Each check cell shows: status icon (✓/✗/⚠/ℹ), actual value, and limit in parentheses when failing or warning
- [x] Cells with no applicable check show `—`
- [x] Hovering a cell shows a tooltip with full check name, value, limit, and notes
- [x] Alternating row background for readability
- [x] IP column is sticky (stays visible when scrolling horizontally)

### Vertical IP Matrix
- [x] One row per vertical IP
- [x] Fixed columns: VIP, Chainage, VC Type, Grade In, Grade Out
- [x] Check columns: Max Grade In, Max Grade Out, Min Grade Out, K Value, VC Length, VC Spacing
- [x] Overall column with same treatment as horizontal matrix
- [x] IP column is sticky

### Chainage Issues Banner
- [x] Separate section below both matrices
- [x] Lists any chainage continuity failures with element, check, and value
- [x] Hidden when no chainage issues exist

## Notes

- The overall column aggregates all checks for that IP (including superelevation checks within the arc extent)
- Grade section checks are matched to the adjacent VIP by comparing chainages with a ±0.5 m tolerance
