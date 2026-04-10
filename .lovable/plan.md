

## Plan: Add Floating Quotes "Fairly Priced" Section

### What We're Building
A new component (`QuoteSpreadShowcase`) that displays 5 animated floating contractor quotes with red-flag stamps, a bold headline ("YOUR QUOTE IS EITHER PRICED FAIRLY OR IT ISN'T"), and two CTA buttons ("Grade My Quote" and "Translate Jargon"). The design matches the user's provided screenshot with a dark liquid-quartz background, 3D paper-drift animations, and glossy CTA buttons.

**Important**: The AI modal functionality from the provided code will NOT be included since WindowMan uses server-side AI via edge functions (per project rules). The "Grade My Quote" button will trigger the existing scan funnel, and "Translate Jargon" will trigger the existing PowerTool/demo flow.

### Placement
Between the `InteractiveDemoScan` / `ProcessSteps` block and the `Testimonials` ("Real Homeowner Results") section. Specifically, it will be inserted in `Index.tsx` at line 356, right before `IndustryTruth`.

### Implementation

**1. Create `src/components/QuoteSpreadShowcase.tsx`**
- 5 `MockEstimate` cards with company names, line items, totals, and colored "gotcha" stamps (e.g., "60% NON-REFUNDABLE DEPOSIT", "MISSING NOA CODES")
- CSS keyframe animations for paper drifting (`drift-paper-1` through `drift-paper-5`)
- Liquid quartz background with gradient blobs and noise texture overlay
- Mouse-tracking 3D tilt via `perspective` and `rotateX/Y` transforms
- Headline + subheadline with the provided copy
- Two glossy CTA buttons wired to `onScanClick` and `onDemoClick` props

**2. Edit `src/pages/Index.tsx`**
- Import `QuoteSpreadShowcase`
- Add it at ~line 356 (before `IndustryTruth`), passing `onScanClick={() => triggerTruthGate('quote_spread')}` and `onDemoClick` to trigger the PowerTool

### Files
1. **Create** `src/components/QuoteSpreadShowcase.tsx`
2. **Edit** `src/pages/Index.tsx` — add import + render

### No Risk
- Pure frontend visual component, no backend/OTP/data changes
- Reuses existing `triggerTruthGate` and `powerToolTriggered` handlers
- No new dependencies needed (uses standard React + CSS animations)

