

# Bridge Strips + TruthGateFlow Inline Style Refactor

## Part A — Bridge Strips Between Mid-Page Sections

### Problem
The section sequence `IndustryTruth → MarketMakerManifesto → ProcessSteps → NarrativeProof` currently has hard cuts between each module. SocialProofStrip and ScamConcernImage already use `.wm-bridge-strip` (subtle gradient background, double border, inner highlight) to create visual continuity. The mid-page modules lack this treatment, making them feel like stacked islands rather than a connected system.

### Changes

**File: `src/pages/Index.tsx`**

Insert two `<div className="wm-bridge-strip py-3" />` elements:
1. Between `ProcessSteps` and `NarrativeProof` (line ~326)
2. Between `IndustryTruth` and `MarketMakerManifesto` (line ~324)

These are empty connector divs — no content, just the `.wm-bridge-strip` class providing: a `#f9fbff → #f3f8ff` gradient, `border-top` + `border-bottom` with `#d5e1f1`, and inset white highlights. They act as visual mortar between section blocks.

### Why this is an upgrade
- Eliminates the "flat gap" between mid-page sections scored 7/10 in the continuity audit
- Matches the existing bridge strip pattern already used above the fold (SocialProofStrip, ScamConcernImage)
- Creates the feeling of a continuous instrument panel rather than stacked cards
- Zero risk — purely additive visual connectors with no logic or layout changes

---

## Part B — TruthGateFlow Inline Style Refactor

### Problem
`TruthGateFlow.tsx` has 3 `React.CSSProperties` objects declared at module scope (`labelStyle`, `inputStyle`, `errorTextStyle`) plus 2 imperative event handlers (`handleInputFocus`, `handleInputBlur`) that manually mutate `style` properties. This bypasses the shared design system classes (`.wm-eyebrow`, `.wm-input-well`) that already exist in `index.css`.

### Changes

**File: `src/components/TruthGateFlow.tsx`**

1. **Labels** — Replace `style={labelStyle}` with `className="wm-eyebrow mb-1.5"` and add `text-muted-foreground` for color. Delete the `labelStyle` const entirely.

2. **Inputs** — Replace `style={{...inputStyle, borderColor: ...}}` with `className="wm-input-well"` plus conditional border classes:
   - Default: inherits `.wm-input-well` border (`#b0c4d8`)
   - Valid: `border-primary` (via className toggle)
   - Invalid: `border-orange-500` (via className toggle)
   - Validation icon padding: add `pr-10` class when status is not "untouched"
   - Delete the `inputStyle` const entirely

3. **Focus/blur handlers** — Delete `handleInputFocus` and `handleInputBlur` entirely. The `.wm-input-well:focus` rule in `index.css` already handles focus ring (`border-color: rgba(30,127,204,0.55)` + `box-shadow: sunken + 3px blue ring`). No JS needed.

4. **Error text** — Replace `style={errorTextStyle}` with `className="font-body text-xs text-orange-500 mt-1"`. Delete the `errorTextStyle` const.

5. **ValidationIcon** — Replace inline `style` with Tailwind: `className="absolute right-3 top-1/2 -translate-y-1/2 text-base leading-none"` with `text-primary` or `text-orange-500` conditional.

### Why this is an upgrade
- Removes ~60 lines of imperative inline styling from the most important conversion component
- Inputs now use the same `.wm-input-well` class used across the system — same gradient, same shadow, same focus ring
- Labels now use `.wm-eyebrow` — same font, size, tracking as every other eyebrow in the system
- Focus behavior is CSS-only (`:focus` pseudo-class) instead of JS `onFocus`/`onBlur` handlers that manually set `style` properties — more reliable, less code, better perf
- Error text uses Tailwind utilities instead of a one-off CSSProperties object
- Net result: TruthGateFlow's form inputs become indistinguishable from system inputs, eliminating the last major pocket of inline style drift

### Risk
Low. The `.wm-input-well` and `.wm-input-well:focus` rules already match the exact visual spec of the deleted inline styles (same gradient, same border, same shadow). The only behavioral change is that focus/blur is now CSS-driven instead of JS-driven, which is strictly better.

---

## Files changed
1. `src/pages/Index.tsx` — 2 bridge strip divs added
2. `src/components/TruthGateFlow.tsx` — delete `labelStyle`, `inputStyle`, `errorTextStyle`, `handleInputFocus`, `handleInputBlur`; replace with system classes

## What does NOT change
- No routes, backend, Supabase, copy, colors, or layout structure
- TruthGate card-dominant elevation preserved
- Hero/Demo dominance untouched

