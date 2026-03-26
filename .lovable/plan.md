

# Homepage Upgrade: Tactile Realism + Conversion Hierarchy

## Current State Assessment

From visual inspection, the homepage has:
- **Flat feel**: Shadows exist in CSS but many components don't apply them effectively. TruthGate has `card-raised-hero` but sits on bare `bg-background` with no visual dominance.
- **CTA parity**: "Scan My Quote", "Getting Quotes Soon?", sticky footer buttons, and demo CTAs all compete at similar visual weight.
- **Mid-page energy drop**: After hero + social proof + demo, passive reading sections (IndustryTruth, ProcessSteps, NarrativeProof) lack interactive feel.
- **`whileTap={{ scale: 0.98 }}` everywhere**: Fights with CSS `:active` press physics on 10+ buttons across 7 files.
- **Demo section** has no capture moment — it runs and ends.
- **TruthGate** lacks the visual weight to feel like the core system entry.

## Files Changed (12)

### 1. `src/index.css` — Shadow & Elevation System Refinement
- Add `--shadow-dominant` variable for TruthGate: strongest shadow on page (4-layer, 0.18 opacity, wide spread)
- Add `.card-dominant` utility: uses `--shadow-dominant` + 2px primary top-border accent + stronger gradient
- Strengthen `--shadow-shelf` and `--shadow-shelf-up` to 0.12 opacity (currently too subtle)
- Add `.section-recessed` utility: subtle inset top shadow for passive sections to feel like panels
- Add hover micro-interaction: `.card-raised:hover` with subtle `translateY(-1px)` + `--shadow-elevated`

### 2. `src/components/TruthGateFlow.tsx` — HIGHEST PRIORITY: Dominance
- **Outer wrapper**: Replace bare `<section className="bg-background">` with a visually dominant treatment:
  - Add `card-dominant` wrapper around the `max-w-2xl` container
  - Add a 2px `border-t border-primary` accent bar at top
  - Add section eyebrow label "THE SCANNER" above the card to frame it as a system entry
- **Progress bar**: Already uses `input-well` — keep
- **Input fields**: Already use `--shadow-sunken` — keep
- **Submit button**: Remove `whileHover={{ scale: 1.01 }}` — let CSS handle it
- **Option buttons**: Add hover `translateY(-1px)` via CSS for tactile affordance

### 3. `src/components/AuditHero.tsx` — CTA Hierarchy Clarity
- **Primary CTA** ("Scan My Quote"): Increase padding to `py-5 px-10`, increase font to 18px — make it visually largest
- **Secondary CTA** ("Getting Quotes Soon?"): Reduce padding slightly, ensure `btn-secondary-tactile` reads clearly as tier 2
- Remove `whileHover={{ scale: 1.02 }}` from both buttons — CSS handles hover lift
- Add subtle `text-shadow` to primary CTA for stamped authority

### 4. `src/components/InteractiveDemoScan.tsx` — Conversion Upgrade
- Wrap the demo card in `card-raised` instead of bare `border bg-card`
- Add a persistent bottom CTA bar below the demo card (always visible, not just during phases):
  - "Want to see YOUR quote graded? →" linking to TruthGate
  - Uses `btn-depth-primary` at smaller size
- Make the mock document use `input-well` background for recessed feel
- Hook phase CTA: replace `bg-gold` flat button with `btn-depth-primary` + orange variant

### 5. `src/components/SocialProofStrip.tsx` — Physical Panel
- Add `card-raised` treatment to the inner stat container (currently just `border border-border`)
- Increase the recessed section feel with stronger `--shadow-sunken`

### 6. `src/components/IndustryTruth.tsx` — Mid-Page Energy
- Evidence cards (icon squares): already `card-raised` — add `:hover` lift via CSS utility
- Add `section-recessed` to the outer section for panel feel
- Bottom CTA buttons: remove `whileTap={{ scale: 0.98 }}` 

### 7. `src/components/ProcessSteps.tsx` — Tactile Timeline
- Step number badges: already `card-raised` — good
- Section uses `bg-card border-y` — add subtle `shadow-inner` via `section-recessed`
- Remove `whileTap={{ scale: 0.98 }}` from both CTA buttons (lines 85, 90)
- Deliverable list items: add subtle `card-raised` treatment for each row

### 8. `src/components/NarrativeProof.tsx` — Story Card Depth
- Ensure story cards use `card-raised` with hover lift
- Remove any `whileTap` scale from CTAs

### 9. `src/components/ClosingManifesto.tsx` — Final CTA Authority
- Primary CTA: already `btn-depth-primary` — ensure `whileTap` removed (already done in prior pass)
- Checkmark items: already `card-raised` — good
- Add `whileHover` removal from buttons (lines 50, 55) — let CSS handle

### 10. `src/components/FlowBEntry.tsx` — Flow B Tactile Pass
- Remove `whileTap={{ scale: 0.98 }}` from CTA button (line 51)
- Timeline step badges: already `card-raised` — good
- Blurred preview cards: add `input-well` for recessed feel

### 11. `src/components/FlowCEntry.tsx` — Flow C Capture Moment
- Leverage callout card: already `card-raised` with destructive border — good
- Outcome icon boxes: already `card-raised` — good
- CTA button: ensure no `whileTap` scale

### 12. `src/components/QuoteWatcher.tsx` & `src/components/ForensicChecklist.tsx` — Remove whileTap
- Remove `whileTap={{ scale: 0.98 }}` from all buttons that use `btn-depth-primary` (lines 90, 103 in QuoteWatcher; lines 80, 94 in ForensicChecklist)

## What This Achieves

### CTA Hierarchy (Before → After)
- **Before**: All CTAs same visual weight, user choice-paralyzed
- **After**: "Scan My Quote" is largest + most prominent. "See AI Demo" is secondary tactile. "Build Baseline" is tertiary. Clear visual priority.

### TruthGate Dominance (Before → After)
- **Before**: Content sits on bare `bg-background`, no card, blends into page
- **After**: Wrapped in `card-dominant` with strongest shadow on page + primary accent bar. Feels like the core system entry — a physical instrument panel.

### Demo Conversion (Before → After)
- **Before**: Demo runs, hook phase shows briefly, then auto-cycles. No persistent capture.
- **After**: Persistent "Grade YOUR quote" CTA below demo card. Demo card feels more physical (raised, recessed document).

### Physical Realism (Before → After)
- **Before**: Centered glows, `whileTap` scale shrink fights CSS press, flat sections
- **After**: All buttons use CSS `:active` physics only. Sections feel like recessed panels. Cards hover-lift on interaction. Consistent directional shadows.

## What Does NOT Change
- No routes modified
- No backend/Supabase/Twilio logic
- No copy rewriting (only repositioning)
- No report/reveal components
- No color system changes (blue primary, orange accent preserved)
- No layout structure changes

