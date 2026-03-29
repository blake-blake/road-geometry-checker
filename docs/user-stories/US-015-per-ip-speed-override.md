# US-015 — Per-IP Design Speed Override

**Status:** 🔲 Planned

## Story

As a road designer,
I want to override the design speed for a specific horizontal or vertical IP,
so that I can check a single curve against a different speed limit (e.g. a localised speed restriction or a curve that was designed to a lower speed) without changing the global design speed for the entire alignment.

## Acceptance Criteria

- [x] Each row in the horizontal IP matrix has a small speed override control in the IP column
- [x] Each row in the vertical IP matrix has a small speed override control in the VIP column
- [x] The override control shows the global design speed by default (no override active)
- [x] Selecting a different speed from the override control applies that speed to all checks for that IP only
- [x] When an override is active on an IP, the IP identifier is visually distinguished (e.g. different colour or italic)
- [x] Removing the override (selecting the global speed) restores the IP to use the global setting
- [x] Speed override options are the same set as the global speed selector (40–130 km/h)
- [x] Overrides persist when the design speed or other settings are changed globally
- [x] Overrides are cleared when a new file is loaded

## Notes

- The override applies to ALL checks for the specific IP (radius, transitions, K values, grades, etc.)
- Horizontal IP override affects: min radius, curve length, transition lengths, broken back/reverse curve tangent
- Vertical IP override affects: max grade, K value, VC length, VC spacing
- The override speed is passed to the check functions via the `ipSpeedOverrides` map keyed by IP id
