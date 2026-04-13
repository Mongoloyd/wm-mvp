

## Plan: Fix HUD Accessibility Contrast in OrangeScanner

### What This Fixes
The holographic HUD labels ("DATA EXTRACTION", "CONTEXTUAL INJECTION", "COMPLIANCE DETECTION") are nearly invisible against the dark `bg-cyan-950/40` background due to low-contrast colors (`text-slate-600`, `text-cyan-600`) and `opacity-50` on binary text.

### Changes (single file: `src/components/OrangeScanner.tsx`, lines 389-402)

**Line 389 — Phase label container classes:**
- Active: add `font-black`, strengthen glow to `drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]`
- Past: change `text-cyan-600` → `text-cyan-500 font-bold`
- Inactive: change `text-slate-600` → `text-slate-400 font-medium`

**Line 390 — Inner label div:**
- Remove hardcoded `font-bold` (now conditionally applied per state above)

**Line 394 — Binary subtext:**
- Remove `opacity-50`
- Add conditional color: `text-cyan-100` when active, `text-slate-500` when inactive

**Line 401 — Chevrons:**
- Change inactive from `text-slate-700` → `text-slate-500`

### Files Modified
1. `src/components/OrangeScanner.tsx` (lines 389-402)

