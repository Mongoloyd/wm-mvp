

## Fix: Export FunnelStep & FUNNEL_STEPS from arbitrageengine.tsx, clean up About.tsx

### File 1: `src/components/arbitrageengine.tsx`

**A. Line 30** — Add `export` to the type:
```tsx
export type FunnelStep =
```

**B. After line 43** (after the type closing semicolon) — Add the exported constant:
```tsx
export const FUNNEL_STEPS: FunnelStep[] = [
  "scope", "intent_filter", "status", "comp_a", "comp_b",
  "contact", "identity", "intent", "call", "timeframe",
  "done", "secret_capture", "secret_success",
];
```

### File 2: `src/pages/About.tsx`

**Delete lines 21-40** — Remove the duplicate local `FunnelStep` type and the `ALLOWED_STEPS` constant. The import on line 11 (`import ArbitrageEngine, { type FunnelStep, FUNNEL_STEPS } from "@/components/arbitrageengine"`) now resolves correctly and replaces both.

Line 48 already references `FUNNEL_STEPS` — no further changes needed.

### Summary
Two files, three edits. No logic changes, no routing changes, no deletions of usage code.

