# US-005 — Vertical Alignment Checks

**Status:** ✅ Complete

## Story

As a road designer,
I want the tool to check every vertical IP and grade section against Austroads AGRD03 requirements,
so that I can confirm grades, K-values, and vertical curve lengths are compliant.

## Acceptance Criteria

### Maximum Longitudinal Grade
- [x] Checks each grade section against the speed-dependent maximum (AGRD03 Table 9.1)
- [x] Issues a **fail** if grade exceeds the maximum (range: 4% at 130 km/h to 16% at 40 km/h)

### Minimum Grade (Drainage)
- [x] Checks each grade section is ≥ 0.3% (AGRD03 Section 9.6)
- [x] Issues a **fail** if grade is exactly 0%; **warning** if between 0% and 0.3% with a drainage note

### K Value — Crest Curves
- [x] Checks K value against absolute minimum from AGRD03 Table 9.1 for the selected speed
- [x] Issues a **fail** if below absolute minimum
- [x] Issues a **warning** if meets absolute but not desirable minimum

### K Value — Sag Curves
- [x] Checks K value against absolute minimum from AGRD03 Table 9.2 for the selected speed
- [x] Issues a **fail** if below absolute minimum
- [x] Issues a **warning** if meets absolute but not desirable minimum

### Minimum Vertical Curve Length
- [x] Checks VC length against the 50 m practical minimum (AGRD03 Section 9.5)
- [x] Issues a **fail** if below 50 m

### Vertical Curve Spacing
- [x] Checks tangent length between consecutive vertical curves
- [x] Tangent = `VIP_B.chainage - VCL_B/2 - (VIP_A.chainage + VCL_A/2)`
- [x] Issues a **fail** if tangent < V m (absolute); **warning** if < 2V m (desirable) (AGRD03 Section 9.4)

### Unnecessary Vertical Curves
- [x] Flags vertical curves with a grade change < 0.1% as a **warning** — may not require a VC

### Crest Sight Distance (Indicative)
- [x] For crest curves, reports the sight distance implied by the K value with a note that a full AGRD03 Appendix A check is recommended
- [x] Pass/fail based on K value check (not an independent SSD calculation)

## Notes

- Grade sections are extracted as separate objects from the VIP table — grade checks run per section, not per VIP
- VC checks are skipped for VIPs with `vcType === 'none'` or `vcLength === 0`
