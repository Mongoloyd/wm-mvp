## Mode A Typography Reset — System UI Stack

### Diagnosis

The codebase loads custom webfonts (Barlow, Inter) via `@font-face` in `index.css` and references them everywhere through CSS variables (`--wm-font-display`, `--wm-font-body`), Tailwind classes (`font-display`, `font-heading`, `font-body`), and dozens of inline `fontFamily` overrides. The result is inconsistent rendering and unnecessary payload.

**GradeReveal status:**

**Do not assume GradeReveal is canonical.**

**The current main post-scan flow appears to be:**

**ScanTheatrics → PostScanReportSwitcher → TruthReportClassic**

**Before changing GradeReveal, verify whether it is actively used in production flow or is a legacy/alternate component.**

**Do not let GradeReveal define Mode A typography decisions unless active usage is confirmed.**

### Mode Boundary

**Mode A (in scope):** AuditHero, IndustryTruth, ProcessSteps, NarrativeProof, ClosingManifesto, Testimonials, MarketMakerManifesto, QuoteWatcher, TruthReportClassic, GradeReveal, EvidenceLocker, AnalysisPreview, TruthGateFlow, LinearHeader, PublicNavbar, SampleGradeCard, all `about/` components, all `report/` sub-components, SiteFooter, PublicLayout, FlowBEntry, FlowCEntry, InteractiveDemoScan section header only, static pages

**Mode B (untouched):** ScanTheatrics.tsx, PowerToolDemo.tsx, InteractiveDemoScan.tsx internal demo card

### Phase 1 — Foundation (3 files)

`**tailwind.config.ts**` (lines 16-21)
Replace font families:

```
sans:  ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif']
heading: same
display: same
body: same
mono: ['ui-monospace', '"SF Mono"', '"Cascadia Code"', 'monospace']
```

`**src/index.css**`

- Update CSS variables (lines 143-145):
  - `--wm-font-display` → system stack
  - `--wm-font-body` → system stack
  - `--wm-font-mono` → keep as-is (Mode B uses it)
- **Do NOT delete `@font-face` blocks** (lines 10-96). They may still be used by Mode B components. Leave them in place; Mode A just stops referencing them via the updated variables.
- Update `.wm-title-section` (lines 417-423): weight `700`, `letter-spacing: normal`, `text-transform: none`, `line-height: 1.2`
- Update `.wm-body` (lines 425-430): body line-height to `1.5`, font-size to `1rem`

`**index.html**` (lines 16-17)

- Remove the two `<link rel="preload" as="font">` for barlow-800 and inter-400. System fonts need no preloading.

### Phase 2 — Homepage Components (~8 files)

Pattern: remove inline `fontFamily` overrides, `font-display` → `font-heading`, forced uppercase → Title Case, tracking → normal, weight → 700 (H1/H2) or 600 (H3).


| File                         | Key Changes                                                                                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AuditHero.tsx**            | `font-display` → `font-heading`, `fontWeight: 800` → 700, `letterSpacing: "0.01em"` → `"normal"`                                                                                                        |
| **IndustryTruth.tsx**        | Remove `tracking-[0.01em]`, `font-display` → `font-heading`                                                                                                                                             |
| **ProcessSteps.tsx**         | Remove inline `fontWeight: 800`, `tracking-[0.01em]`                                                                                                                                                    |
| **NarrativeProof.tsx**       | `font-display` → `font-heading`, normalize weight                                                                                                                                                       |
| **ClosingManifesto.tsx**     | Remove `font-display font-black`, use `font-heading font-bold`                                                                                                                                          |
| **MarketMakerManifesto.tsx** | Same pattern                                                                                                                                                                                            |
| **Testimonials.tsx**         | `font-display` → `font-heading`, remove `font-extrabold` → `font-bold`, remove `tracking-[0.01em]` on H3                                                                                                |
| **QuoteWatcher.tsx**         | Replace `fontFamily: "'Barlow Condensed'"` → remove (inherits system). Replace `fontFamily: "'DM Sans'"` → remove. Remove `textTransform: "uppercase"` on H2/H3. Keep `DM Mono` on utility labels only. |


### Phase 3 — Report / Result Components (~4 files)

**No background or text color changes.** Typography properties only.


| File                       | Key Changes                                                                                                                                                                                                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GradeReveal.tsx**        | Remove all `fontFamily: "'DM Sans'"` inline refs (~10 instances). Remove `fontFamily: "var(--wm-font-display)"` (inherits system now). Remove `textTransform: "uppercase"` on H2. Weight 800→700, `letterSpacing: "0.02em"` → `"normal"`. Keep `DM Mono` on GRADE badge and data labels only. |
| **EvidenceLocker.tsx**     | Remove all `fontFamily: "'DM Sans'"` inline refs (~15 instances). Remove `fontFamily: "var(--wm-font-display)"` on H2. Remove uppercase on headings. Keep `DM Mono` on vault metadata eyebrows only.                                                                                          |
| **AnalysisPreview.tsx**    | Remove wrapper `fontFamily: "var(--wm-font-body)"`. Remove `fontFamily: "var(--wm-font-display)"` on H1/H2 tags. They inherit system stack.                                                                                                                                                   |
| **TruthReportClassic.tsx** | `font-display` → `font-heading`. Remove `letterSpacing: "-0.02em"` and `"0.02em"`. Remove `textTransform: "uppercase"` on the H2 at ~line 1014.                                                                                                                                               |


### Phase 4 — About / Shell / Static (~10 files)


| File                                                                           | Changes                                                                     |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| **about/SectionHeading.tsx**                                                   | Remove `uppercase`, `font-extrabold` → `font-bold`, remove `tracking-tight` |
| **about/*.tsx** (TransparencyShift, BestPrice, Arbitrage, Inevitability, etc.) | `font-display` → `font-heading`, remove `tracking-tight`                    |
| **PublicNavbar.tsx**                                                           | `font-display` → `font-heading`, remove `letterSpacing: "0.02em"`           |
| **LinearHeader.tsx**                                                           | Same                                                                        |
| **SampleGradeCard.tsx**                                                        | `font-display` → `font-heading`                                             |
| **ScamConcernImage.tsx**                                                       | `font-display` → `font-heading`, remove `font-extrabold` → `font-bold`      |
| **TopViolationSummaryStrip.tsx**                                               | `font-display` → `font-heading`                                             |


### Phase 5 — InteractiveDemoScan Section Header

Only the wrapper heading block (lines ~305-311):

- Remove inline `fontSize` override on H2 (let `wm-title-section` handle it)
- The `wm-title-section` class now outputs system stack, weight 700, normal tracking
- **Do not touch** anything below line 313 (the demo card)

### Safety Guarantees

- `@font-face` blocks for Barlow, Inter, DM Mono are **NOT deleted** — Mode B and edge components may still reference them directly
- Font asset woff2 files are **NOT deleted**
- No background colors changed anywhere
- No text colors changed (all existing colors pass readability)
- No layout, animation, or CTA behavior changes
- Mode B files (ScanTheatrics, PowerToolDemo, InteractiveDemoScan internal card) completely excluded

### Estimated scope: ~25 files

### Typography Token Summary

```text
H1:  font-heading (system), 700, clamp(2rem, 5vw, 3.25rem), line-height 1.15
H2:  font-heading (system), 700, clamp(1.5rem, 4vw, 2.25rem), line-height 1.2
H3:  font-heading (system), 600, clamp(1.25rem, 3vw, 1.75rem), line-height 1.25
Body: inherit (system), 400, 1rem, line-height 1.5
UI:  inherit (system), 500
All headings: Title Case, no text-transform, letter-spacing normal
```