

## Revised Plan: Integrate ArbitrageEngine on About Page (All Blind Spots Addressed)

### Code Audit Results

| Blind Spot | What the Code Actually Shows | Action Required |
|---|---|---|
| **Post-submission dead end** | After Supabase insert, flow advances through intent → call/timeframe → "done" screen showing "Audit Complete & Matched!" then auto-closes modal after 3.5s. User is stranded on the About page with no path to the scanner. | Add redirect after modal close |
| **Z-index collision** | Modal overlay: `fixed inset-0 z-50`. LinearHeader: `sticky top-0 z-50`. Same z-index. Fixed elements later in DOM *usually* win, but it's fragile — especially for the close/back buttons which are also `z-50` relative to the modal. | Bump modal overlay to `z-[100]` |
| **Double padding** | Engine root div: `px-4 py-6 sm:p-4`. About page container: `max-w-7xl` with section-level `px-6 md:px-8`. On mobile this stacks to ~40px+ horizontal inset per side. | Strip engine's outer `px-4 py-6 sm:p-4` |

---

### Files to Edit

| File | Changes |
|---|---|
| `src/components/arbitrageengine.tsx` | 1) Line 363: `min-h-screen` → `min-h-[600px]`; remove `px-4 py-6 sm:p-4` from root div. 2) Line 787: modal overlay `z-50` → `z-[100]`. 3) Lines 808, 818: modal back/close buttons `z-50` → `z-[110]`. 4) In `handleClose` (line 275): after `setFlowState("idle")`, if `hasCompletedFunnel` is true, fire a success toast and redirect to `/#truth-gate`. |
| `src/components/about/ArbitrageEngineSection.tsx` | Import `ArbitrageEngine` from `@/components/arbitrageengine`. Render it after the centered statement panel inside the `max-w-7xl` container, wrapped in `<div className="mt-16 md:mt-24 rounded-2xl overflow-hidden">`. |

No changes to `About.tsx` — `ArbitrageEngineSection` is already rendered in position.

---

### Fix 1: Post-Submission Routing

Current `handleClose` (line 275):
```ts
const handleClose = () => {
  setFlowState("idle");
  setTimeout(() => { ... reset state ... }, 300);
};
```

Amended behavior: If `hasCompletedFunnel` is true when modal closes, fire `toast.success("You're matched! Let's scan your quote.")` and `window.location.href = "/#truth-gate"` after a short delay. This routes the captured lead directly into the scanner funnel instead of leaving them on the About page.

### Fix 2: Z-Index Armor

- Modal backdrop (`fixed inset-0`): `z-50` → `z-[100]`
- Back button (`absolute top-4 left-4`): `z-50` → `z-[110]`
- Close button (`absolute top-4 right-4`): `z-50` → `z-[110]`

This guarantees the modal floats above LinearHeader's `sticky z-50`.

### Fix 3: Mobile Padding Audit

Engine root div currently:
```
className="min-h-screen bg-slate-950 text-white font-sans overflow-hidden relative flex flex-col items-center justify-center px-4 py-6 sm:p-4 ..."
```

Change to:
```
className="min-h-[600px] bg-slate-950 text-white font-sans overflow-hidden relative flex flex-col items-center justify-center py-6 ..."
```

Remove `px-4` and `sm:p-4`. The About page's `ArbitrageEngineSection` already provides horizontal padding via `px-6 md:px-8`. The inner `max-w-5xl` container (line 385) handles content width. Vertical padding (`py-6`) stays for breathing room.

### Risk: DevTesting page

`/devtesting` also renders `ArbitrageEngine`. Removing `px-4` from the engine means that page loses its horizontal padding. Check if DevTesting's own wrapper provides padding — if not, add `px-4` to DevTesting's wrapper div instead.

### Verification Checklist

- `min-h-screen` removed, replaced with `min-h-[600px]`
- No horizontal overflow on About page
- Engine renders inside `max-w-7xl` without double padding on mobile
- Modal overlay at `z-[100]` clears LinearHeader
- Lead capture → success toast → redirect to `/#truth-gate`
- DevTesting page still renders correctly
- No changes to Supabase schema, analytics, or funnel logic

