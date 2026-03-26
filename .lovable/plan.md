

# System-Level Light Theme Fix — Full Audit & Plan

## Root Cause

The light theme is broken at **three levels**, not just components:

### Level 0: HTML Shell (Critical)
**`index.html` line 89** has `html, body { background: #0A0A0A; }` — this is the FOUC-prevention style that loads before React. It makes the entire page dark before any CSS token applies. This is the single biggest issue.

### Level 1: Missed Homepage Components
Several components were **not included in P2A or P2B** and remain fully dark:

| File | Dark Patterns |
|------|--------------|
| `FlowBEntry.tsx` | `backgroundColor: "#0A0A0A"`, all text `color: "#E5E5E5"`, dark cards `#111111` |
| `QuoteWatcher.tsx` | `background: "#111111"`, `backgroundColor: "#0A0A0A"`, all text white/gray hex |
| `MarketBaselineTool.tsx` | Likely same dark inline pattern (needs verification) |
| `MobileStickyUnlock.tsx` | `bg-[#0A0F1A]/95`, `border-white/10`, dark gradient |
| `ScamConcernImage.tsx` | Minor — `text-cyan` class (undefined token) |

### Level 2: Report Components (P3 — noted but deferred)
`TruthReportClassic.tsx`, `LockedOverlay.tsx`, `GradeReveal.tsx`, `ScanTheatrics.tsx` — hundreds of dark hex values. These are P3 scope.

---

## Plan: System-Level Fix

### Step 1 — Fix `index.html` FOUC style
Change line 89 from:
```css
html, body { background: #0A0A0A; margin: 0; }
```
to:
```css
html, body { background: #f5f7fa; margin: 0; }
```
(`#f5f7fa` ≈ `hsl(210 40% 98%)`, the --background token value)

### Step 2 — Migrate `FlowBEntry.tsx`
Replace all `#0A0A0A` backgrounds → `bg-background` / semantic tokens.
Replace `#E5E5E5` / `#E5E7EB` text → `text-foreground` / `text-muted-foreground`.
Replace `#111111` cards → `bg-card border border-border`.

### Step 3 — Migrate `QuoteWatcher.tsx`
Same pattern: dark backgrounds, dark cards, white text → semantic light tokens.

### Step 4 — Migrate `MarketBaselineTool.tsx`
Same pattern as above.

### Step 5 — Migrate `MobileStickyUnlock.tsx`
Replace `bg-[#0A0F1A]` → `bg-card/95`, `border-white/10` → `border-border`.

### Step 6 — Fix `ScamConcernImage.tsx`
Replace `text-cyan` (undefined) → `text-primary`.

---

## Constraints
- No layout/structure changes
- No copy changes
- No report/reveal work (P3)
- No business logic changes
- Dev-only components (`RubricComparison.tsx`) excluded
- Modal overlays (`bg-black/80`) preserved — standard UX pattern

## Files Changed
1. `index.html` (1 line)
2. `src/components/FlowBEntry.tsx`
3. `src/components/QuoteWatcher.tsx`
4. `src/components/MarketBaselineTool.tsx`
5. `src/components/MobileStickyUnlock.tsx`
6. `src/components/ScamConcernImage.tsx`

## Expected Result
After this pass, every homepage section (both Flow A and Flow B paths) will render on a light canvas with no dark islands. Only report/reveal components (P3) will remain dark-styled.

