# US-011 — Vehicle Type Selection

**Status:** ✅ Complete

## Story

As a road designer,
I want to select one or more vehicle types to check against,
so that the geometry validation uses sight distance and curve parameters appropriate for the actual vehicle mix using the road.

## Vehicle Types

| Type | Description | Applicable Surface |
|------|-------------|-------------------|
| **LME** | Light Mining Equipment — light vehicles, utes, passenger cars | Sealed & Unsealed |
| **HME** | Heavy Mining Equipment — Komatsu 930E, Cat 777 haul trucks | Unsealed only |
| **RAV-4S** | MRWA Road Alignment Volume, 4-second reaction time standard | Sealed only |
| **Truck** | Standard freight trucks (non-RAV-4S standard) | Sealed & Unsealed |

## Vehicle Parameters

| Type | Reaction Time | Deceleration | Eye Height (h1) | Max Design Speed |
|------|--------------|--------------|-----------------|-----------------|
| LME | 2.5 s | 3.4 m/s² | 1.15 m | 130 km/h |
| Truck | 2.5 s | 2.44 m/s² | 2.4 m | 130 km/h |
| RAV-4S | 4.0 s | 2.44 m/s² | 2.4 m | 130 km/h |
| HME | 4.0 s | 1.47 m/s² | 6.5 m | 55 km/h |

## Acceptance Criteria

- [x] Multi-select checkboxes for LME, HME, RAV-4S, Truck — at least one must remain selected
- [x] Default selection is LME only
- [x] Changing the selection immediately recalculates all checks
- [x] Crest K values are computed from the SSD of each selected vehicle type (scaled from LME AGRD03 baseline)
- [x] SSD calculated as: `SSD = V/3.6 × t + V²/(254 × f)` per vehicle type
- [x] When multiple vehicle types are selected, the **most conservative (highest K)** result is shown for each check
- [x] The controlling vehicle type is noted in the check result's notes field
- [x] Results label which vehicle type drives each K value failure

## Notes

- Crest K values are scaled from the AGRD03 lookup tables (LME baseline) using the ratio `(SSD_vehicle / SSD_LME)² × (h_LME / h_vehicle)²`
- Sag K values use existing comfort-based tables (not SSD-driven, same for all vehicle types)
- Horizontal alignment radius checks are not affected by vehicle type in this implementation
