## SampleGradeCard: Glass Physics + 3-Score Carousel

### Changes (single file: `src/components/SampleGradeCard.tsx`)

#### 1. Remove scan line, upgrade container glass

- Delete the `motion.div` scan-line overlay (lines 147-155)
- Container changes:
  - Background: `hsla(222, 47%, 6%, 0.85)` → semi-transparent slate `rgba(15,23,42,0.70)` with `backdrop-blur: 40px`
  - Border: `border: 1px solid rgba(255,255,255,0.20)` (crisp glass edge)
  - Shadow: `0 40px 100px -20px rgba(34,182,203,0.35), 0 12px 32px -8px rgba(0,0,0,0.5)` (massive teal ambient glow)
- Add a "shine sweep" overlay: an `absolute inset-0 pointer-events-none` div with a diagonal `linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.10) 45%, rgba(255,255,255,0.04) 50%, transparent 55%)` that translates from `-100%` to `+100%` over 6s, looping infinitely

#### 2. Brighten typography

- Watermark opacity: `0.03` → `0.06`
- Header label ("SAMPLE GRADE REPORT"): `0.45` → `0.80`
- Grade subtitle ("GRADE C — ..."): `0.4` → `0.75`
- Financial sub-line ("Broward County..."): `0.35` → `0.65`
- Flag card sub-text: `0.4` → `0.6`
- Footer italic text: `0.3` → `0.5`

#### 3. Define 3 cycling mock reports

```ts
const REPORTS = [
  {
    grade: "C", percent: 55, delta: 4800,
    gradeColor: "hsl(25, 95%, 53%)",
    gradientStops: ["hsl(25,95%,53%)", "hsl(0,79%,50%)"],
    subtitle: "GRADE C — REVIEW BEFORE SIGNING",
    flags: [
      { stripe: "hsl(0,79%,43%)", icon: AlertTriangle, color: "hsl(0,79%,43%)", label: "No Window Brand Specified", sub: "Contractor can install any quality level" },
      { stripe: "hsl(32,90%,44%)", icon: Zap, color: "hsl(32,90%,44%)", label: "Labor Warranty: 1 Year Only", sub: "Industry standard is 2–5 years" },
      { stripe: "hsl(160,84%,39%)", icon: CheckCircle2, color: "hsl(160,84%,39%)", label: "Permit Cost Included", sub: "This is correctly structured" },
    ],
  },
  {
    grade: "F", percent: 20, delta: 12500,
    gradeColor: "hsl(0, 79%, 50%)",
    gradientStops: ["hsl(0,79%,50%)", "hsl(0,60%,40%)"],
    subtitle: "GRADE F — DO NOT SIGN",
    flags: [
      { stripe: "hsl(0,79%,43%)", icon: AlertTriangle, color: "hsl(0,79%,43%)", label: "Missing NOA Codes", sub: "Cannot verify product approval" },
      { stripe: "hsl(0,79%,43%)", icon: AlertTriangle, color: "hsl(0,79%,43%)", label: "Permit Fees Listed as TBD", sub: "Open-ended cost exposure" },
      { stripe: "hsl(32,90%,44%)", icon: Zap, color: "hsl(32,90%,44%)", label: "No Disposal Terms", sub: "Hidden cost risk on removal" },
    ],
  },
  {
    grade: "B", percent: 85, delta: 800,
    gradeColor: "hsl(160, 84%, 39%)",
    gradientStops: ["hsl(160,84%,39%)", "hsl(187,100%,40%)"],
    subtitle: "GRADE B — MOSTLY FAIR",
    flags: [
      { stripe: "hsl(160,84%,39%)", icon: CheckCircle2, color: "hsl(160,84%,39%)", label: "Quality Brand Specified", sub: "PGT WinGuard series confirmed" },
      { stripe: "hsl(160,84%,39%)", icon: CheckCircle2, color: "hsl(160,84%,39%)", label: "Permit Cost Included", sub: "This is correctly structured" },
      { stripe: "hsl(32,90%,44%)", icon: Zap, color: "hsl(32,90%,44%)", label: "Unclear Disposal Terms", sub: "Ask for written confirmation" },
    ],
  },
];
```

#### 4. State management & re-triggering animations

- Add `useState(0)` for `currentIndex`
- Add `useEffect` with `setInterval` every 5000ms to cycle `currentIndex` through 0→1→2→0...
- Pass `key={currentIndex}` to the `GradeRing` and `AnimatedCounter` components so they fully remount and re-animate from zero on each cycle
- Make `GradeRing` and `AnimatedCounter` accept the report's values as props (`percent`, `delta`, `gradeColor`, `gradientStops`)
- Use unique gradient IDs per render (`gradeGradient-${currentIndex}`) to avoid SVG conflicts
- Wrap the inner content in `<AnimatePresence mode="wait">` with a fade transition (opacity 0→1, 0.4s) keyed on `currentIndex` for smooth data swaps
- Card height stays consistent since all 3 reports have 3 flag cards each

### Files changed


| File                                 | Change                                                                                                                                              |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/SampleGradeCard.tsx` | Full rewrite: remove scan line, glass physics upgrade, shine sweep, brighten text, 3-report carousel with cycling state and re-triggered animations |
