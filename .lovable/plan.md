

## Plan: OrangeScanner → Arbitrage Engine Direct-Entry Bridge

Three files changed. Zero routing changes. Zero changes to `ArbitrageEngineSection.tsx` or `Index.tsx`.

---

### File 1: `src/components/OrangeScanner.tsx`

**A. Add import** (line 1 area):
```tsx
import { useNavigate } from "react-router-dom";
```

**B. Update component signature** (line 618-621): Rename `onDemoClick` to `_onDemoClick` to suppress lint warnings while keeping the prop type stable.

**C. Add `const navigate = useNavigate();`** after line 628 (with other hooks).

**D. Replace `safeInvokeDemoClick` body** (lines 668-678): Remove callback delegation and warn logic. Replace with:
```tsx
const safeInvokeDemoClick = () => {
  console.info("demo_cta_clicked", {
    scenarioId: safeScenario.id,
    button: "want_quote",
  });
  navigate("/about?startArb=1&step=scope&src=orange-scanner");
};
```

Nothing else in OrangeScanner changes.

---

### File 2: `src/components/arbitrageengine.tsx`

**A. Add types** before line 173: `FunnelStep` union type and `ArbitrageEngineProps` type with `autoOpen`, `initialStep`, `hideBaseShell`, `source`, `onDirectEntryClose`.

**B. Replace signature** (line 173): `export default function App()` → `export default function ArbitrageEngine({...}: ArbitrageEngineProps)` with defaults.

**C. Type state** (lines 179-180): Type `funnelStep` as `FunnelStep`, `stepHistory` as `FunnelStep[]`.

**D. Add direct-entry `useEffect`** after line 200 (after `modalRef`): When `autoOpen` is true, set `flowState="modal_open"`, reset `funnelStep` to `initialStep`, clear `stepHistory`, set `hasCompletedFunnel=false`, `isExitIntent=false`. Log `arbitrage_direct_entry_opened`.

**E. Add `closeToAboutContent` helper** before line 276: Resets `flowState` to `"idle"`, clears funnel state, calls `onDirectEntryClose?.()`.

**F. Replace `handleClose`** (lines 276-305): Add early check — if `autoOpen && !hasCompletedFunnel && preCompletionStep && !isExitIntent`, call `closeToAboutContent()` and return. Otherwise keep all existing behavior unchanged.

**G. Upgrade scroll lock** (lines 210-217): Replace with scrollbar-width-aware version that captures/restores `overflow` and `paddingRight`.

**H. Wrap shell in `!hideBaseShell`** (lines 383-797): Wrap background effects, title, pipeline card, and audit reveal in `{!hideBaseShell && (<>...</>)}`. The modal block (line 799+) stays **outside** the wrapper.

---

### File 3: `src/pages/About.tsx`

- Add `useSearchParams` from react-router-dom
- Import `ArbitrageEngine` from `@/components/arbitrageengine`
- Parse `startArb`, `step`, `src` query params; validate `step` against `FunnelStep` allowlist
- Add `clearDirectEntryParams()` that deletes the three params with `replace: true`
- When `isDirectEntry`: render `<ArbitrageEngine autoOpen hideBaseShell source={source} initialStep={initialStep} onDirectEntryClose={clearDirectEntryParams} />` in a `<section>` wrapper instead of `<ArbitrageEngineSection />`
- When not direct entry: render `<ArbitrageEngineSection />` as before
- Include `direct_entry` and `source` in tracking event

---

### What stays untouched
- `ArbitrageEngineSection.tsx` — zero changes
- `Index.tsx` — zero changes
- OrangeScanner prop types, visual shell, scan engine, rotation, Decision Gate copy
- Arbitrage Engine funnel steps, question copy, Supabase insert, completion redirect
- All other About page sections

