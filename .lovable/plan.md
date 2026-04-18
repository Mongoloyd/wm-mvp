

## Final sprint — Full-mode reorder + visual hierarchy + typography/contrast spec

### Order (locked)
```
1. Header / Report Identity
2. Verdict / Gut Punch
3. Top Risks (3 compact rows + grounded "what could happen")
4. Financial Forensics (punchy proof, compact)
5. Primary CTA Strip — "Get a Better Quote" + "See all findings ↓"
6. Forensic Findings accordion (id="forensic-findings")
7. Quote Price Math
8. Red Flags
9. Missing Items
10. WhatToDoNow (DEMOTED, no embedded primary CTA)
11. Forensic Pillar Section (full)
12. Bottom Contractor Match (ghost reinforcement only)
13. Fix-It / Negotiation Script / Footer

REMOVED: PillarSnapshotStrip
Sticky bottom CTA: mirrors in-page CTA exactly
Scroll-to-top on OTP unlock (preview→full)
```

### Typography & contrast spec (NEW — matches `/about`)

**Font stack (reuse `/about` tokens, no new fonts)**
- Display/headings: existing `font-display` token used by `SectionHeading` on `/about`
- Body: existing default sans (Inter/system)
- Metadata/emphasis: DM Sans 500/600 (already in mem://style/typography-dm-sans-preference)
- No condensed, decorative, or alternate font systems introduced

**Contrast floor: 5:1 minimum** against background for all visible text in full-report flow.

**Banned patterns**
- `text-muted-foreground` on `bg-muted` or pale fills
- `text-gray-400`/`text-gray-500` on white
- Off-white text on pale gradients
- Faint pill text (e.g., `text-red-300` on `bg-red-50`)

**Required pill/badge contrast**
- Critical/danger: `bg-red-600` + `text-white` (or `bg-destructive` + `text-destructive-foreground`)
- Warning/review: `bg-amber-500` + `text-white` or `bg-amber-100` + `text-amber-900`
- Success/green: `bg-emerald-600` + `text-white` or `bg-emerald-100` + `text-emerald-900`
- Info/brand: `bg-primary` + `text-primary-foreground` — never faded
- Pillar pills: `bg-slate-900` + `text-white` (dark) or `bg-slate-100` + `text-slate-900`

**Type sizing floors (full report)**
- H1 report title: `text-3xl md:text-4xl font-bold`
- H2 section headers: `text-xl md:text-2xl font-semibold`
- Body: `text-base` (never below `text-sm` for content)
- Helper/meta: `text-sm` minimum (no `text-xs` for findings, labels, pill text, or CTA)
- Microcopy floor: 10px absolute, only for truly secondary metadata
- Findings titles: `text-base font-medium` minimum
- CTA button text: `text-sm font-semibold` minimum (prefer `text-base`)

**CTA button contrast (all states)**
- Default: brand bg + `text-primary-foreground`
- Hover: darker brand bg, same text contrast
- Active: pressed brand bg, same text contrast
- Loading: keep bg + text colors, add spinner — never fade text below 5:1
- Disabled: `bg-muted` + `text-muted-foreground` only if still ≥4.5:1 — otherwise use darker disabled token

### Visual hierarchy & sizing budgets

**Dominance ladder**
1. Grade circle + Verdict (H1 weight)
2. Top Risks header (H2)
3. Primary CTA Strip button (brand bg, semibold)
4. Financial Forensics figures (tabular-nums, numeric emphasis)
5. Forensic Findings headers (text-base, medium)
6. WhatToDoNow recommendation (text-sm, secondary but readable)
7. Bottom reinforcement (ghost link)

**Mobile section budgets (390px)**
- Header + Verdict: ≤280px combined
- Top Risks: 3 rows × ~90px = ≤270px (row layout, not cards)
- Financial Forensics: ≤320px (compact proof, not essay)
- CTA Strip: ≤80px (1 row, not banner)
- Forensic Findings rows collapsed: ≤72px each, default-collapsed
- WhatToDoNow: ≤200px total

**Mobile density rules**
- Cap padding at `p-4 md:p-6` (no `p-8` on mobile)
- Cap section spacing at `space-y-4 md:space-y-6`
- Top Risks uses border-only row separators, not card stack
- Financial Forensics uses 2-col grid on mobile

**Desktop composition**
- `max-w-3xl mx-auto` (executive-summary feel, not stretched)
- `space-y-8 md:space-y-10` between major sections
- CTA Strip inline in flow, no full-bleed bg, no `shadow-lg`
- Financial Forensics `md:grid-cols-3` for stats
- Forensic Findings accordion never edge-to-edge

### CTA hierarchy (one meaning, mirrored)
- **Authoritative**: Primary CTA Strip under Top Risks → `Get a Better Quote`
- **Mirror**: Sticky bottom CTA → identical wording (shared `CTA_LABEL` constant), identical handler, identical loading/post-click states
- **WhatToDoNow**: text-link only (`text-sm underline text-primary`), scrolls to `#cta-strip`
- **Bottom Contractor Match**: ghost variant, never primary bg

### Consequence rule (locked)
- `flag.consequence?.trim()` → use it
- else `flag.impact?.trim()` → use it
- else **omit** (no fabrication, no sentence-splitting)

### Scroll-to-top on unlock
```ts
// PostScanReportSwitcher.tsx
const reportTopRef = useRef<HTMLDivElement>(null);
const prevAccessRef = useRef(accessLevel);
useEffect(() => {
  if (prevAccessRef.current !== "full" && accessLevel === "full") {
    requestAnimationFrame(() => {
      reportTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  prevAccessRef.current = accessLevel;
}, [accessLevel]);
```

### Files changed

| File | Action | Scope |
|---|---|---|
| `src/components/post-scan/PostScanReportSwitcher.tsx` | EDIT | Scroll-to-top on `preview→full`; export shared `CTA_LABEL = "Get a Better Quote"`; thread to children |
| `src/components/TruthReportClassic.tsx` | EDIT (full mode) | Apply order; remove `PillarSnapshotStrip`; insert CTA Strip after Financial Forensics; add `id="report-top"` + `id="forensic-findings"` + `id="cta-strip"`; soften bottom Contractor Match to ghost; apply typography/contrast/sizing classes; reuse `/about` font tokens |
| `src/components/report/TopRisksBlock.tsx` | EDIT | Row layout (not cards); line-clamp-2 on "why"; line-clamp-1 on consequence; tighten consequence rule; high-contrast pills; min `text-sm` body, `text-base` titles |
| `src/components/report/TopRisksCTAStrip.tsx` | NEW | Compact 1-row band ≤80px mobile; `Get a Better Quote` button (brand bg, `text-base font-semibold`) + `See all {N} forensic findings ↓` link (`text-sm underline-offset-2`); accepts `ctaLabel`, handler, loading state |
| `src/components/report/WhatToDoNowBlock.tsx` | EDIT | Remove embedded primary button; replace with `text-sm underline text-primary` link `↑ Get a better quote` → scrolls to `#cta-strip`; cap height ~200px; secondary but readable styling (≥5:1) |
| `src/components/StickyCTAFooter.tsx` | EDIT | When in full-report mode, render single button using shared `CTA_LABEL`; mirror handler + loading/post-click states; ensure 5:1 contrast in all states |

### Out of scope (unchanged)
Preview/pre-OTP rendering · `LockedOverlay` · OTP flow · `useAnalysisData` · edge functions · schema · RLS · scoring · extraction prompts · preview/full fetch contracts · Identity Ladder · backend gating

### Validation criteria
1. After OTP unlock, viewport lands on `#report-top` — verdict + start of Top Risks visible on first mobile screen
2. Full-mode order matches spec exactly
3. `PillarSnapshotStrip` removed from full mode
4. In-page CTA Strip wording === Sticky CTA wording === `CTA_LABEL` constant
5. Both CTA surfaces fire same handler with same loading state
6. WhatToDoNow contains zero `<button>` elements styled as primary
7. Section height budgets respected on mobile
8. Consequence text is explicit data or omitted (never invented)
9. Preview/pre-OTP rendering byte-identical to current
10. No backend, schema, RLS, scoring, or fetch-contract changes
11. **All visible text in full-report flow meets ≥5:1 contrast; no important labels, pills, findings, or CTA text below readable size floors; font tokens match `/about`; no faint gray-on-white or off-white-on-pale combinations anywhere in main report flow**

