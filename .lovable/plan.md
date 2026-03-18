

## Text Brightness Fix — PowerToolDemo.tsx

All the muted text in this component uses **inline styles** (not Tailwind classes), referencing two theme tokens defined at line 11:

- `T.muted` = `"rgba(241,245,249,0.55)"` — 55% opacity white-ish
- `T.faint` = `"rgba(241,245,249,0.32)"` — 32% opacity white-ish

### Text elements to brighten

| Text | Current color | Location (line) |
|------|--------------|-----------------|
| "Forensic consumer protection analysis — Pompano Beach, FL 33060" | `T.muted` (55% opacity) | Line 61, inside `DemoReport` |
| "Overall Risk Score" | `T.muted` (55% opacity) | Line 61, inside the score card |
| "/ 100" | `T.faint` (32% opacity) | Line 61, inside the score card |
| "Safety", "Scope", "Price", "Fine Print", "Warranty" (pillar labels) | `T.muted` (55% opacity) | Line 61, pillar map loop |

### The fix

Update the two theme token values in the `T` object (line 11) to increase their alpha:

- `T.muted`: `"rgba(241,245,249,0.55)"` → `"rgba(241,245,249,0.75)"` (crisp light gray, not stark white)
- `T.faint`: `"rgba(241,245,249,0.32)"` → `"rgba(241,245,249,0.55)"` (brings "/ 100" up to the old muted level)

Also update `DS.colors.muted` and `DS.colors.faint` on line 7 to match, keeping the two token sets in sync.

This single change brightens **all** the marked text elements at once since they all reference these tokens. No font size or weight changes.

### Files changed

| File | Change |
|------|--------|
| `src/components/PowerToolDemo.tsx` | Update `muted` and `faint` alpha values in both `DS` (line 7) and `T` (line 11) objects |

