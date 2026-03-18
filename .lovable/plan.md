

## Analysis

Looking at the reference images alongside the existing code reveals something important: the screenshots show the **existing `StickyRecoveryBar`** with two CTA buttons (blue "View AI Scan Demo" + gold "Start My Scan →"), not a separate component. The current `StickyRecoveryBar` code already accepts an `onDemoCTAClick` prop but never renders a demo button — that button was likely stripped at some point.

However, the user's instruction explicitly asks for a new `StickyCTAFooter.tsx`. I'll follow that instruction precisely, with two critical observations:

1. **Two fixed-bottom bars will fight for space.** The `StickyRecoveryBar` uses `z-index: 8000` and `position: fixed; bottom: 0`. The new footer at `z-50` would sit underneath it. The `isVisible` prop (gated on `!gradeRevealed && !showRecoveryBar`) prevents overlap.

2. **The `showRecoveryBar` boolean already exists** in Index.tsx (line 67), so we can pass `!showRecoveryBar` directly — no hallucinated state needed.

---

## Plan

### Step 1 — Create `src/components/StickyCTAFooter.tsx`

Production-ready component matching the user's corrected code exactly:

- `Lock` icon from lucide-react (not emoji)
- `flex-1 max-w-[240px]` on buttons prevents desktop stretching
- Blue (`bg-[#22B6CB]`) and Gold (`bg-[#C8952A]`) to match the reference images (not generic `bg-blue-600`)
- `isVisible` prop controls rendering — returns null when false
- Tailwind `animate-in slide-in-from-bottom-10` for entrance
- Trust text: `text-[11px] text-muted-foreground` with Lock icon

**Color note from reference images**: The blue button is closer to a teal/cyan (`#22B6CB`) than a standard blue-600. The gold matches the existing `#C8952A` used throughout StickyRecoveryBar. I'll use those exact hex values.

### Step 2 — Integrate in `src/pages/Index.tsx`

- Import `StickyCTAFooter`
- Render after `StickyRecoveryBar` (line ~170)
- Props:
  - `onScanClick={() => triggerTruthGate('sticky_footer')}`
  - `onDemoClick={() => { setPowerToolTriggered(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}`
  - `isVisible={!gradeRevealed && !showRecoveryBar}`
- Add `pb-32` to the wrapper div (line 87)

### Step 3 — No changes to other files

`TrustBullets.tsx`, `PowerToolDemo.tsx`, `StickyRecoveryBar.tsx` remain untouched.

### Files Changed

| File | Action |
|------|--------|
| `src/components/StickyCTAFooter.tsx` | Create |
| `src/pages/Index.tsx` | Import, render, add `pb-32` |

