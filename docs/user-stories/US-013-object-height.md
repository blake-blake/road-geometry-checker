# US-013 — Object Height Toggle for Crest Sight Distance

**Status:** ✅ Complete

## Story

As a road designer,
I want to toggle the object height used in stopping sight distance calculations between 0 m and 0.2 m,
so that crest curve K values reflect the correct sight distance target for the design context (e.g. mine haul roads may target an object height of 0 m for small object detection).

## Crest K Scaling Formula

Crest K values are scaled from the AGRD03 baseline (LME, h2 = 0.2 m) using:

```
K(h2_new) = K_baseline × (SSD_vehicle / SSD_LME)² × (h_LME / h_vehicle)²
```

Where:
- `h_x = √(2·h1_x) + √(2·h2)` is the combined height factor
- `h1` = driver/operator eye height (varies by vehicle type)
- `h2` = object height (0 m or 0.2 m, user-selected)
- `h_LME` = √(2×1.15) + √(2×0.2) = 2.149 (AGRD03 baseline)

## Effect of Object Height

| Object Height | Effect on K | Context |
|--------------|-------------|---------|
| 0.2 m | Baseline (AGRD03 standard) | Standard sealed road object detection |
| 0.0 m | K approximately doubles | Small/low object detection; mine haul road safety |

## Acceptance Criteria

- [x] Toggle between h2 = 0.2 m (default) and h2 = 0 m
- [x] Default is h2 = 0.2 m
- [x] Changing object height recalculates all crest K value checks immediately
- [x] Sag K value checks are unaffected (comfort-based, not sight-distance-based)
- [x] The object height used is shown in the check result's limit field for clarity
- [x] Results clause reference notes the object height applied

## Notes

- Switching from h2 = 0.2 m to h2 = 0 m approximately doubles the required crest K value
- Object height of 0 m represents detecting an object resting on the road surface (relevant for mine roads with debris)
- The exact multiplier depends on the vehicle type's eye height (h1)
