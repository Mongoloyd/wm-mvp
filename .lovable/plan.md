

# Modern Skeuomorphic Migration — Homepage Visual Direction

## What This Is

A systematic visual overhaul of the homepage from "flat SaaS light theme" to a **Modern Skeuomorphic / Tactile 3D** design system. Every surface becomes a physical object with top-left lighting, cast shadows, recessed wells, and convex buttons. No glassmorphism. No blur. No flat fills.

## Phase 1: Foundation (`src/index.css`)

### Token Updates
- `--foreground` → `#1A2B3C` (16.8:1 contrast — stamped text-primary)
- `--muted-foreground` → `215 20% 35%` (~7:1 on all surfaces)
- `--border` → `#C8D8EC` (visible material edge, not hairline)
- `--background` → `#EEF4FB` (cool blue-white "table" surface)
- `--radius` → `10px` (physical objects have rounded corners)
- Add ambient directional gradient on body (subtle top-left blue glow, bottom-right warm glow)

### New CSS Custom Properties (from reference)
Add the full lighting/shadow system as CSS variables:
- `--light-top`, `--light-left`, `--light-card` (specular highlights)
- `--shadow-resting` (4-layer card shadow with top highlight)
- `--shadow-elevated` (hover/hero elevation)
- `--shadow-sunken` (input wells — inset shadows)
- `--shadow-pressed` (active button state)
- `--shadow-focus` (blue ambient glow)
- `--shadow-btn`, `--shadow-btn-hover` (convex button shadows)
- `--text-stamped`, `--text-engraved`, `--text-raised` (3D typography)

### Replace `.glass-card-strong` → `.card-raised`
- **Remove**: `backdrop-filter`, `rgba(255,255,255,0.92)` background
- **Add**: `background: linear-gradient(180deg, #FFFFFF, #F8FAFC)`, solid `border: 1px solid #C8D8EC`, `box-shadow: var(--shadow-resting)`, `border-radius: var(--r-lg)`
- Keep `.glass-card-strong` as alias → `.card-raised` for backward compat

### Add `.input-well`
- Recessed background: `linear-gradient(180deg, #E5EDF5, #EEF4FB)`
- Border: `1px solid #B8CCDE`
- Shadow: `var(--shadow-sunken)` (dark inset top, white glow bottom)

### Upgrade `.btn-depth-primary`
- Gradient: `linear-gradient(180deg, #49A5FF 0%, #1E7FCC 55%, #1565A8 100%)` (3-stop convex dome)
- Border: `1px solid #1565A8` (dark material edge)
- Shadow: `var(--shadow-btn)` (includes top highlight)
- Hover: `translateY(-2px)` + `var(--shadow-btn-hover)`
- Active: `translateY(1px)` + `var(--shadow-pressed)` (physically depressed)
- Text: `text-shadow: var(--text-raised)` (white text lifted off surface)

### Add `.btn-secondary-tactile`
- Surface gradient background, stamped text, resting shadow
- Hover lifts with elevated shadow

## Phase 2: Component Overhaul (15 files)

### `LinearHeader.tsx`
- Remove `backdrop-blur-xl`
- Solid `background: var(--surface-gradient)` + `box-shadow: var(--shadow-resting)` + `border-bottom: 1px solid #C8D8EC`
- Brand text gets `text-shadow: var(--text-stamped)`

### `AuditHero.tsx`
- Forensic badge: apply `card-raised` shadow treatment
- SampleGradeCard wrapper: remove blur glow div, replace with sharper cast shadow
- Secondary "Getting Quotes Soon?" button: apply `btn-secondary-tactile`

### `SampleGradeCard.tsx`
- Replace `glass-card-strong` → `card-raised` class
- Remove blue blur glow behind it
- Add `var(--shadow-elevated)` for "document resting on desk" feel
- Flag rows: add subtle left-border severity line with inset shadow

### `SocialProofStrip.tsx`
- Outer bar: add `var(--shadow-sunken)` for recessed instrument panel feel
- Stat dividers: stronger `#C8D8EC` border

### `TruthGateFlow.tsx`
- Main card: `glass-card-strong` → `card-raised` with `var(--shadow-elevated)` (highest homepage elevation — the focal point)
- Progress bar track: apply `input-well` treatment (sunken track with inner shadow)
- Progress fill: blue gradient with top highlight and glow
- Option buttons: idle gets `var(--shadow-resting)` + top highlight; selected gets `var(--shadow-pressed)` (pressed-in) + blue border
- Input fields (Step 5): apply `input-well` class — sunken background, inner shadow, `#B8CCDE` border
- Input focus: `var(--shadow-focus)` (blue ambient glow)

### `UploadZone.tsx`
- Outer card: `glass-card-strong` → `card-raised`
- Dropzone: apply `input-well` treatment (recessed, dashed border on sunken surface)

### `IndustryTruth.tsx`
- Evidence cards (3 blocks): wrap in `card-raised`
- Bottom CTA card: `glass-card-strong` → `card-raised`
- Icon squares: add top-left lighting highlight

### `ProcessSteps.tsx`
- Step number badges: add `card-raised` treatment with small shadow
- Section: add subtle `inset` top shadow for recessed panel feel
- Deliverable icons: add `filter: drop-shadow(...)` for grounding

### `NarrativeProof.tsx`
- Story cards: `glass-card-strong` → `card-raised`
- Grade badge squares: stronger border + cast shadow
- Result callout: subtle raised treatment

### `ClosingManifesto.tsx`
- Checkmark icons: raised pill treatment with `var(--shadow-resting)`
- Secondary button: `btn-secondary-tactile`

### `FlowBEntry.tsx`
- Outcome cards: add `card-raised` treatment
- Timeline step badges: `card-raised` with small shadow

### `StickyCTAFooter.tsx`
- Remove `backdrop-blur-xl`
- Solid `bg-card` with upward shadow: `0 -4px 12px rgba(10,25,55,0.08)`
- Physical shelf feel

### `MobileStickyUnlock.tsx`
- Same: remove blur, solid card + upward shadow

### `ExitIntentModal.tsx`
- Modal card: apply `card-raised` with `var(--shadow-elevated)`
- Keep `bg-black/80` overlay (standard UX)

## What Does NOT Change
- No layout restructuring
- No copy changes
- No business logic / Supabase / OTP / routing
- No report/reveal components (GradeReveal, TruthReportClassic, LockedOverlay, ScanTheatrics)
- No ResultTeaser, ThankYouPage, or post-scan flow
- Blue primary and orange accent colors preserved (upgraded to 3-stop gradients)

## Visual QA Checklist (post-implementation)
1. Every card has 1px white top-edge highlight
2. Shadows cast down-right consistently (no centered glows)
3. No `backdrop-blur` or `bg-white/xx` transparency remains
4. Background is `#EEF4FB` (cool table), not sterile `#FFFFFF`
5. Buttons look convex (lighter top, darker bottom)
6. Button click physically depresses (`translateY(1px)` + inset shadow)
7. Input fields are sunken with inner shadow
8. TruthGate card has highest elevation shadow on the page
9. Header/Footer feel like solid physical shelves
10. Muted text is at least 7:1 contrast

## Files Changed (17 total)
1. `src/index.css` — foundation tokens, shadow system, utility classes
2. `src/components/LinearHeader.tsx`
3. `src/components/AuditHero.tsx`
4. `src/components/SampleGradeCard.tsx`
5. `src/components/SocialProofStrip.tsx`
6. `src/components/TruthGateFlow.tsx`
7. `src/components/UploadZone.tsx`
8. `src/components/IndustryTruth.tsx`
9. `src/components/ProcessSteps.tsx`
10. `src/components/NarrativeProof.tsx`
11. `src/components/ClosingManifesto.tsx`
12. `src/components/FlowBEntry.tsx`
13. `src/components/StickyCTAFooter.tsx`
14. `src/components/MobileStickyUnlock.tsx`
15. `src/components/ExitIntentModal.tsx`
16. `src/components/FlowCEntry.tsx`
17. `index.html` (FOUC background → `#EEF4FB`)

