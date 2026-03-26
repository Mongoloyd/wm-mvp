# System Normalization Pass — Visual Consistency + Design Token Adoption

## Why This Matters

The homepage currently has **17 different styling approaches** across its components. Each file uses slightly different inline styles for fonts, spacing, colors, shadows, and radii. The user has provided a reference `wm-*` CSS token system from their Cursor build that represents the target quality. This plan adopts the best patterns from that system and normalizes every component against a single canonical set of tokens and utility classes.

This is not a redesign. It is a **disciplining pass** that makes the page feel system-built instead of section-built.  
  
This is a normalization pass, not a flattening pass.

Preserve the stronger visual emphasis of:

- Hero

- TruthGate

- InteractiveDemoScan

- SampleGradeCard

Do not standardize those down to match support modules.

Normalize the system while preserving focal dominance.

## What Gets Normalized

### 1. CSS Foundation (`src/index.css`) — Token Consolidation

**Current problem:** Components use a mix of `var(--shadow-resting)`, inline `boxShadow` strings, Tailwind `shadow-*`, and hardcoded hex values. Font declarations repeat across 14 files via inline `style={{ fontFamily: ... }}`.  
  
If a normalization choice would reduce hero emphasis, TruthGate dominance, or scanner demo impact, preserve the stronger current implementation instead of forcing uniformity.  
  
Prioritize normalization of:

1. containers

2. spacing

3. CTA classes

4. card roles

5. typography utilities

Only then clean up smaller style drift.

Do not spend effort on low-value micro-edits before the high-value system pieces are unified.

**Changes:**

- Add CSS custom properties for fonts: `--wm-font-display`, `--wm-font-body`, `--wm-font-mono` (mapping to existing Barlow Condensed, DM Sans, DM Mono)
- Add typography utilities: `.wm-eyebrow` (mono 11px tracking-[0.12em] uppercase), `.wm-title-section` (display font, extrabold, uppercase, text-shadow stamp)
- Add spacing tokens as comments for reference: section padding `py-20 md:py-28`, card padding `p-7 md:p-8`
- Add `.wm-bridge-strip` utility for transition strips (SocialProof, ScamConcern)
- Normalize `--radius` usage: cards = `12px`, buttons = `8px`, inputs = `7px`, badges = `999px` — currently everything is `var(--radius)` = `10px` which makes cards, buttons, and inputs all the same radius
- Strengthen `.card-dominant` shadow to match reference `--wm-shadow-hero` (4-layer with blue ambient glow)
- Add `.wm-btn-primary` and `.wm-btn-secondary` as aliases that enforce canonical sizing (primary: `py-4 px-8 text-[16px]`, secondary: `py-3 px-6 text-[14px]`)
- Remove `hover:shadow-lg` from buttons (conflicts with shadow system)

**Why it improves UI:** Every card, button, and input will share the same material language. Eliminates the "close but not identical" feeling.

### 2. Section Container Normalization (All sections)

**Current problem:** Sections use inconsistent max-widths and padding:

- Hero: `max-w-7xl px-4 md:px-8`
- TruthGate: `max-w-2xl px-4 md:px-8`
- IndustryTruth: `max-w-5xl px-4 md:px-8`
- MarketMakerManifesto: `maxWidth: 1080` (inline)
- ProcessSteps: `max-w-5xl px-4 md:px-8`
- ClosingManifesto: `max-w-4xl px-4 md:px-8`

**Changes:**

- Standardize content sections to `max-w-5xl` (wide) or `max-w-2xl` (focused tools like TruthGate, UploadZone)
- Standardize section padding to `py-20 md:py-28` (currently ranges from `py-14` to `py-32`)
- MarketMakerManifesto: replace inline `maxWidth: 1080` with `max-w-5xl`
- ClosingManifesto: change `py-24 md:py-32` to `py-20 md:py-28` to match rhythm

**Why:** Sections currently have 5 different max-widths and 6 different vertical padding values. Normalizing creates the "one system" feel.

### 3. Card Surface Normalization (8 files)

**Current problem:** Cards use a mix of:

- `card-raised` class (NarrativeProof, UploadZone)
- `card-dominant` class (TruthGate)
- Inline `bg-muted border border-border` (FlowBEntry preview cards)
- Inline `bg-primary/5 border border-primary/20` (result callouts)
- Bare `bg-card border-t` (ProcessSteps, MarketMakerManifesto sections)
- `card-raised-hero` (SampleGradeCard, ExitIntentModal)

**Changes:**

- Normalize all content cards to `card-raised` with consistent internal padding `p-7`
- MarketMakerManifesto 3 value cards: wrap in `card-raised` instead of bare `bg-primary/[0.03] border`
- FlowBEntry preview cards (blurred price/grade): wrap in `card-raised` with `input-well` for the blurred content area
- ProcessSteps deliverable rows: add `card-raised` treatment instead of bare `bg-color` squares
- All inline badge/callout cards (result boxes in NarrativeProof, IndustryTruth): standardize to `bg-primary/5 border border-primary/20 p-4` (consistent pattern, no radius drift)
- ExitIntentModal: keep `card-raised-hero` (correct — it's a modal overlay)

**Why:** Cards serving similar roles (evidence, value prop, outcome) will look like they belong to the same product family.

### 4. CTA Button Discipline (12 files)

**Current problem:** Buttons have wildly inconsistent sizing:

- Hero primary: `py-5 px-8 sm:px-10` / `fontSize: 18`
- Section primary: `padding: "16px 32px"` / `fontSize: 16`
- ClosingManifesto: `padding: "18px 48px"` / `fontSize: 18`
- Header: `padding: "10px 20px"` / `fontSize: 14`
- Sticky footer: `padding: "12px 16px"` / `fontSize: 14`
- Demo persistent CTA: `py-3.5 text-[15px]`
- FlowB/C primary: `padding: "16px 36px"` / `fontSize: 17`

**Changes — canonical sizes:**

- **Primary CTA (full):** `py-4 px-8` / `fontSize: 16` / `font-weight: 700` — used in all section bottom CTAs
- **Primary CTA (hero):** `py-5 px-10` / `fontSize: 18` — hero only, one instance
- **Primary CTA (compact):** `py-3 px-5` / `fontSize: 14` — header, sticky footer, inline
- **Secondary CTA:** `py-3 px-6` / `fontSize: 14` / `font-weight: 600` — all secondary buttons
- Remove all remaining `whileTap={{ scale: 0.98 }}` and `whileHover={{ scale: 1.01 }}` from UploadZone (line 159) — last holdout
- Remove `hover:shadow-lg transition-shadow` from AuditHero primary button (conflicts with `btn-depth-primary` hover)

Files with CTA normalization: `AuditHero.tsx`, `IndustryTruth.tsx`, `ProcessSteps.tsx`, `NarrativeProof.tsx`, `ClosingManifesto.tsx`, `FlowBEntry.tsx`, `FlowCEntry.tsx`, `StickyCTAFooter.tsx`, `InteractiveDemoScan.tsx`, `LinearHeader.tsx`, `ExitIntentModal.tsx`, `UploadZone.tsx`

**Why:** Eliminates "visual parity" between primary and secondary CTAs. User can instantly distinguish CTA tiers.

### 5. Typography System Normalization (All component files)

**Current problem:** Font declarations are inline in 14 files:

- `style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700 }}`
- `style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(42px, 5.5vw, 58px)" }}`
- `style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}`

These repeat hundreds of times with slight variations.

**Changes:**

- Define CSS variables: `--font-display: 'Barlow Condensed', sans-serif`, `--font-body: 'DM Sans', sans-serif`, `--font-mono: 'DM Mono', monospace`
- Add Tailwind `font-display`, `font-body`, `font-mono` extensions in `tailwind.config.ts` (if not already present)
- Replace inline `fontFamily` declarations with Tailwind classes: `font-display`, `font-body`, `font-mono`
- Standardize eyebrow text: `font-mono text-[11px] tracking-[0.12em] uppercase text-primary` (currently varies from `text-[10px]` to `text-[13px]` and `tracking-[0.08em]` to `tracking-[0.15em]`)
- Standardize section headings: `font-display font-extrabold uppercase tracking-[0.02em]` with `fontSize: clamp(32px, 5vw, 48px)` (currently some use `clamp(30px, 4vw, 38px)`, others `clamp(36px, 5vw, 48px)`)
- Standardize body copy: `font-body text-[15px] text-muted-foreground leading-[1.7]`

**Why:** Removes the "random-feeling differences" in supporting copy. Creates typographic rhythm.

### 6. Spacing Rhythm Normalization

**Current problem:** Internal card padding varies: `p-6`, `p-7`, `p-8`, `p-8 md:p-10`, inline `padding: "clamp(28px, 5vw, 40px)"`. Gap between elements varies from `gap-2` to `gap-8`.

**Changes:**

- Standard card padding: `p-7 md:p-8`
- Standard inter-section gap: `py-20 md:py-28`
- Standard intra-card gap: `gap-4` for form elements, `gap-3` for list items
- Standard CTA-to-body margin: `mt-8` (currently varies from `mt-6` to `mt-14`)
- Standard eyebrow-to-heading margin: `mb-4` (currently varies from `mb-2` to `mb-5`)

### 7. Radius Scale Normalization

**Current problem:** Everything uses `var(--radius)` = 10px, or `rounded-none` (deliberately square), or inline `borderRadius`. No hierarchy.

**Changes:**

- Cards: `border-radius: 12px` (via new `--radius-card: 12px`)
- Buttons: `border-radius: 8px` (via new `--radius-btn: 8px`)
- Inputs: `border-radius: 7px` (via new `--radius-input: 7px`)
- Badges/pills: `rounded-full`
- Keep `rounded-none` for demo card elements (intentional "document" feel)

Update `card-raised`, `card-raised-hero`, `card-dominant`, `btn-depth-primary`, `btn-secondary-tactile`, `input-well` to use their respective radius tokens.

### 8. Mid-Page Continuity — Bridge Strips

**Current problem:** SocialProofStrip and ScamConcernImage are flat interruptions. MarketMakerManifesto uses bare `bg-card border-t` with no depth.

**Changes:**

- SocialProofStrip: apply `.wm-bridge-strip` utility (subtle gradient, double border, inner highlight)
- ScamConcernImage: apply `.wm-bridge-strip` background instead of bare `bg-background`
- MarketMakerManifesto: apply `.section-recessed` for panel-like depth. Apply `card-raised` to 3 value prop cards
- Remove `card-raised:hover` lift from SocialProofStrip stats (data bars shouldn't lift)

### 9. Shadow Hierarchy Enforcement

Verify and enforce the 4-tier elevation model:

- **L0 (flush):** SocialProof stats bar, bridge strips — no card shadow
- **L1 (resting):** Standard cards (NarrativeProof stories, IndustryTruth evidence, ProcessSteps badges) — `--shadow-resting`
- **L2 (elevated):** Hero elements (SampleGradeCard, ExitIntentModal) — `--shadow-elevated`
- **L3 (dominant):** TruthGate only — `--shadow-dominant`

Audit and fix any component that accidentally matches a higher tier.

### 10. Remaining `whileTap` / `whileHover` Cleanup

Remove from:

- `UploadZone.tsx` line 159: `whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}`
- `MobileStickyUnlock.tsx` line 44: `active:scale-[0.98]` CSS class (should use `translateY(1px)` press)

## Files Changed (15)

1. `src/index.css` — token consolidation, radius scale, bridge strip, typography utilities
2. `tailwind.config.ts` — font family extensions
3. `src/components/AuditHero.tsx` — CTA sizing, remove hover:shadow-lg
4. `src/components/TruthGateFlow.tsx` — card padding, eyebrow normalization
5. `src/components/InteractiveDemoScan.tsx` — CTA sizing, section padding
6. `src/components/SocialProofStrip.tsx` — bridge strip treatment, remove hover lift
7. `src/components/IndustryTruth.tsx` — CTA sizing, card padding, section padding
8. `src/components/ProcessSteps.tsx` — CTA sizing, deliverable card treatment, section padding
9. `src/components/NarrativeProof.tsx` — CTA sizing, card padding, section padding
10. `src/components/ClosingManifesto.tsx` — CTA sizing, section padding
11. `src/components/MarketMakerManifesto.tsx` — max-width, card-raised on value cards, section-recessed
12. `src/components/FlowBEntry.tsx` — CTA sizing, inline font cleanup
13. `src/components/FlowCEntry.tsx` — CTA sizing, inline font cleanup
14. `src/components/StickyCTAFooter.tsx` — CTA sizing normalization
15. `src/components/UploadZone.tsx` — remove whileTap/whileHover, CTA sizing
16. `src/components/MobileStickyUnlock.tsx` — replace scale with translateY press
17. `src/components/ScamConcernImage.tsx` — bridge strip background
18. `src/components/LinearHeader.tsx` — CTA sizing
19. `src/components/ExitIntentModal.tsx` — CTA sizing

## What Does NOT Change

- No routes, backend logic, Supabase, or OTP changes
- No copy rewording
- No layout restructuring
- No color system changes
- No report/reveal components