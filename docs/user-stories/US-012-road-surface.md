# US-012 — Road Surface Type (Sealed / Unsealed)

**Status:** 🔲 Planned

## Story

As a road designer,
I want to select whether the road is sealed or unsealed,
so that the tool applies the correct friction values, grade limits, and vehicle type restrictions for the road surface type.

## Surface Applicability Rules

| Vehicle Type | Sealed | Unsealed |
|-------------|--------|----------|
| LME | ✓ | ✓ |
| Truck | ✓ | ✓ |
| RAV-4S | ✓ | ✗ (N/A — public road standard) |
| HME | ✗ (N/A — mine haul roads only) | ✓ |

## Standards by Surface

| Surface | Standard Reference |
|---------|-------------------|
| Sealed | Austroads AGRD03 / MRWA Supplement |
| Unsealed | ARRB Guide to Unsealed Road Design |

## Unsealed Road Parameters (ARRB)

| Design Speed | Max Grade | Friction Coefficient |
|-------------|-----------|---------------------|
| 40 km/h | 16% | 0.40 |
| 50 km/h | 14% | 0.37 |
| 60 km/h | 12% | 0.33 |
| 70 km/h | 10% | 0.30 |
| 80 km/h | 9% | 0.27 |
| 90 km/h | 8% | 0.24 |
| 100 km/h | 7% | 0.22 |

## Acceptance Criteria

- [x] Toggle between Sealed and Unsealed road surface
- [x] Default is Sealed
- [x] When Unsealed is selected: HME checkbox is enabled, RAV-4S checkbox is disabled and deselected
- [x] When Sealed is selected: RAV-4S checkbox is enabled, HME checkbox is disabled and deselected
- [x] Unsealed road uses ARRB friction values for SSD computation
- [x] Unsealed road uses ARRB max grade limits (different from sealed AGRD03 limits)
- [x] Unsealed SSD and K values are computed using the unsealed friction coefficient
- [x] Results show surface type in the standard/clause reference field

## Notes

- HME is only checked on unsealed roads (mine haul roads)
- RAV-4S is a Main Roads WA public sealed road standard and does not apply to unsealed
- Grade limits for unsealed roads are based on ARRB Guide to Unsealed Road Design (conservative values)
- Friction values on unsealed roads are highly variable depending on surface material and condition; values used are representative dry/good condition values
