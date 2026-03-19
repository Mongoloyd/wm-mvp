

# Forensic Noir — Full Visual Redesign Plan

## Summary

Transform WindowMan from a clean white/light UI into a matte-black forensic investigation aesthetic. Every component becomes evidence pinned under a spotlight. This is a sweeping visual overhaul touching the design system, every section component, and the scan/report flow.

## Design System Changes

**Colors** (replace current palette):
- Background: Pure obsidian `#0A0A0A` (matte black, not navy)
- Surface cards: `#111111` with `1px solid #1A1A1A` borders
- Cobalt Blue (authority/action): `#2563EB` — CTAs, active states, system indicators
- Vivid Orange (danger/flags): `#F97316` — only appears for red flags, bad grades, predatory findings
- Text primary: `#E5E5E5` (off-white, not pure white)
- Text secondary: `#6B7280` (gray, clinical)
- Gold accent `#C8952A` demoted — replaced by Cobalt Blue as primary action color; gold only for the logo wordmark

**Typography**:
- Add `Barlow Condensed` (Google Font) for headlines — uppercase, tight tracking, heavy weight
- Body text stays `DM Sans` but shifts to gray clinical tone
- Mono stays `DM Mono` / `IBM Plex Mono` for terminal/system text

**Shape language**:
- Border radius: `0` everywhere (no rounded corners — sharp, angular, precise)
- No soft shadows — use hard-edge borders and subtle 1px lines
- Cards get sharp corners with thin border outlines

**Motion**:
- Replace all `ease-out` / spring transitions with snappy `duration: 0.15` or instant reveals
- No dissolves — use `opacity: [0, 1]` with short duration (shutter-click feel)

## Files to Modify

### 1. `index.html`
Add Barlow Condensed font import alongside existing fonts.

### 2. `src/index.css`
Rewrite `:root` CSS variables for the noir palette. Remove light mode entirely — this is a single-theme dark experience.

### 3. `tailwind.config.ts`
- Add `barlow` to `fontFamily` for headings
- Update all color tokens to noir palette
- Set `borderRadius` base to `0`
- Update keyframes to use snap timing

### 4. `src/components/LinearHeader.tsx`
- Background: `#0A0A0A` with `border-bottom: 1px solid #1A1A1A`
- Logo: white WINDOW + orange MAN stays
- CTA button: Cobalt Blue, sharp corners

### 5. `src/components/AuditHero.tsx` (Scene 1 — The Interrogation)
- Black background, headline in Barlow Condensed uppercase
- "YOUR QUOTE LOOKS LEGITIMATE. THAT'S EXACTLY WHAT THEY'RE COUNTING ON." — white, tight, heavy
- CTA glows Cobalt Blue
- Remove the hand-scanner hero image or place it as a muted background element
- Kill the green "Getting Quotes Soon?" button styling — make it a ghost outline

### 6. `src/components/SocialProofStrip.tsx`
- Dark strip with monospaced numbers, cobalt blue accents

### 7. `src/components/IndustryTruth.tsx` (Scene 2 — The Evidence Room)
- Black background, evidence blocks as sharp-cornered cards with thin borders
- Headlines: Barlow Condensed uppercase
- Badges: Orange only for danger, cobalt for neutral
- Images: add a subtle vignette or redacted-stamp overlay feel

### 8. `src/components/TruthGateFlow.tsx` (Scene 3 — The Truth Gate)
- Scanner terminal aesthetic: dashed border becomes solid 1px cobalt border
- Monospaced fonts throughout
- Progress indicators in cobalt, switching to orange when danger detected
- Sharp corners on all inputs and buttons

### 9. `src/components/ScanTheatrics.tsx`
- Already dark (`#0F1F35`) — shift to pure `#0A0A0A`
- Terminal lines: cobalt blue initially, flicker to vivid orange on danger detection
- Progress bar: cobalt-to-orange gradient
- Snap transitions between phases (no springs)

### 10. `src/components/TruthReport.tsx`
- Report header: black background, white Barlow Condensed headline
- Grade circle: sharp-cornered badge instead of circle, or keep circle but with hard border
- Pillar cards: dark cards with thin borders, sharp corners
- Findings: dark cards, orange left-border for critical, cobalt for review
- OTP gate overlay: pure black with cobalt input borders

### 11. `src/components/ProcessSteps.tsx`
- Dark background, step numbers in cobalt, sharp card edges

### 12. `src/components/NarrativeProof.tsx`
- Dark background, story cards as dark surface with thin borders
- Grade badges: orange for C/D, cobalt outline for context

### 13. `src/components/MarketMakerManifesto.tsx`
- Already dark — shift from navy to obsidian black

### 14. `src/components/ClosingManifesto.tsx` (Scene 4 — The Advocate Footer)
- Pure black, Barlow Condensed headline
- CTA: Cobalt Blue, sharp corners
- Footer text: gray, clinical

### 15. Supporting components
- `SampleGradeCard.tsx` — dark card, sharp corners
- `TrustBullets.tsx` — gray text on black, cobalt checkmarks
- `StickyCTAFooter.tsx` — black bar, cobalt CTA
- `StickyRecoveryBar.tsx` — dark, cobalt accent
- `ExitIntentModal.tsx` — dark modal, cobalt CTA
- `FlowBEntry.tsx`, `ForensicChecklist.tsx`, `QuoteWatcher.tsx` — all shift to noir palette
- `InteractiveDemoScan.tsx`, `PowerToolDemo.tsx` — noir treatment
- `ScamConcernImage.tsx` — dark container
- `EvidenceLocker.tsx`, `EvidenceCarousel.tsx` — dark treatment
- `GradeReveal.tsx` — snap animation, no spring

### 16. UI primitives
- `button.tsx` — default variant becomes cobalt blue, sharp corners
- `card.tsx` — dark bg, sharp corners, thin border
- `input.tsx` — dark bg, cobalt focus ring
- `progress.tsx` — cobalt fill
- `badge.tsx` — sharp corners
- `input-otp.tsx` — dark slots, cobalt focus

## Implementation Approach

This will be executed in phases to keep changes reviewable:

**Phase 1**: Design system foundation — `index.html` (font), `index.css` (variables), `tailwind.config.ts` (tokens, radius, fonts), UI primitives (button, card, input, badge, progress, input-otp)

**Phase 2**: Page shell — `LinearHeader`, `AuditHero`, `SocialProofStrip`, `ClosingManifesto`, `StickyCTAFooter`

**Phase 3**: Content sections — `IndustryTruth`, `ProcessSteps`, `NarrativeProof`, `MarketMakerManifesto` + supporting components

**Phase 4**: Scan & Report flow — `TruthGateFlow`, `ScanTheatrics`, `TruthReport` (including OTP gate), `GradeReveal`

## What Does NOT Change

- Backend logic, edge functions, Supabase schema — untouched
- Component structure and props — only styling changes
- Dev preview system — still works, just renders in noir
- Security model — no changes to gating, OTP, or `full_json` protection
- Functional behavior (scroll targets, flow switching, state management)

## Technical Notes

- Barlow Condensed loaded from Google Fonts via `<link>` in `index.html`
- All `borderRadius` values set to `0` globally via Tailwind config; components using `rounded-*` classes will automatically become sharp
- Motion transitions shortened globally — `transition={{ duration: 0.15 }}` replaces springs and long eases
- The `#0F1F35` navy used throughout is replaced with `#0A0A0A`; any `backgroundColor: "#FFFFFF"` or `bg-white` becomes `#0A0A0A` or `#111111`

