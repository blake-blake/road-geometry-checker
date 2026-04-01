# US-014 — Smart Defaults: emax and Object Height

**Status:** ✅ Complete

## Story

As a road designer,
I want emax to default to 6% and object height to default to 0.2 m with a clean auto-selected display,
so that the most common mine road design settings are immediately active without configuration, while other options are accessible via a simple dropdown.

## Default Settings

| Setting | Default | Alternative Options |
|---------|---------|---------------------|
| emax | 6% | 7% (Austroads), 10% (MRWA) |
| Object height | 0.2 m | 0 m |

## emax and Minimum Radius

| emax | Min Radius at 100 km/h (Absolute) | Context |
|------|------------------------------------|---------|
| 10% | 370 m | MRWA public roads |
| 7% | 600 m | Austroads standard |
| 6% | ~680 m | Mine roads / conservative default |

## UI Behaviour

- The settings panel shows: `emax: 6% ✓` and `h₂: 0.2 m ✓` by default — compact, no dropdown visible
- Clicking the emax value reveals a small dropdown with 6%, 7%, 10% options
- Clicking the object height value reveals a small dropdown with 0.2 m, 0 m options
- Selected value is highlighted; others are accessible choices
- The vehicle type and road surface selectors remain always-visible (not collapsed)
- The existing Design Speed buttons remain visible
- The existing Standard selector (Austroads / MRWA) is removed — emax replaces it as the primary horizontal geometry control

## Acceptance Criteria

- [x] Default emax is 6% on app load
- [x] Default object height is 0.2 m on app load
- [x] emax selector shows 6%, 7%, 10% as options; clicking current value opens dropdown
- [x] Object height selector shows 0.2 m, 0 m; clicking current value opens dropdown
- [x] Minimum horizontal curve radius lookup uses the selected emax directly
- [x] Maximum superelevation check uses the selected emax directly
- [x] The old "Austroads / MRWA" standard selector is replaced by the emax selector
- [x] Changing emax recalculates all horizontal alignment and superelevation checks

## Notes

- The emax = 6% min radius table uses values slightly above the emax = 7% table (lower emax → higher required radius)
- The `Standard` type in the codebase is replaced by `EmaxValue` for emax-dependent checks
