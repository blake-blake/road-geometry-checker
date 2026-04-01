# US-003 — Select Design Speed and Standard

**Status:** ✅ Complete

## Story

As a road designer,
I want to select the design speed and applicable standard before viewing results,
so that all checks use the correct limits for the road being designed.

## Acceptance Criteria

- [x] Design speed selector shows options: 40, 50, 60, 70, 80, 90, 100, 110, 120, 130 km/h
- [x] Default speed is 100 km/h; overridden automatically if the parsed report contains a design speed
- [x] Standard selector shows two options: **Austroads (emax=7%)** and **MRWA (emax=10%)**
- [x] Default standard is MRWA (emax=10%)
- [x] Changing either setting immediately recalculates all checks and updates the results display
- [x] Active selections are visually distinct from inactive ones
- [x] Selector is only shown after a file has been successfully loaded

## Notes

- The two standards differ in maximum superelevation (7% vs 10%) which changes the minimum radius tables
- `DesignSpeed` is a union type — only valid speeds are accepted, not arbitrary numbers
