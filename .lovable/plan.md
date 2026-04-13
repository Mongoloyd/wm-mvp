

## Plan: Fix Sidebar Contrast — Strip Opacity Traps in OrangeScanner.tsx

### What This Fixes
Text in the TrustScoreWidget, Live Audit Log, terminal, and Metadata sections is nearly invisible due to dark colors combined with opacity fades on a dark background. We replace all low-contrast patterns with a clean white baseline (`slate-200`/`slate-300`), reserving `cyan-400` for active-only states.

### Changes (single file: `src/components/OrangeScanner.tsx`)

**1. TrustScoreWidget Header & Scrape Ticker (lines 94-136)**
- Line 99: `text-slate-500` → `text-slate-200` ("Contractor Integrity Score")
- Line 106: `text-slate-600` → `text-slate-400` ("/100" suffix)
- Line 123: `text-cyan-500/70` → `text-slate-200` ("Deep Web Background Audit")
- Line 131: Remove `opacity-40` from inactive state, change to `border border-transparent text-slate-200`; active state stays as-is (already has `bg-cyan-500/10 border border-cyan-500/30 scale-[1.02]`), add `text-cyan-400` to active
- Line 136: `text-slate-500` → `text-slate-400` (check detail text)

**2. Terminal Log (lines 143-155)**
- Line 148: Remove base `text-slate-500`, change to: active (`idx === 0`) gets `text-cyan-400`, inactive gets `text-slate-300`; remove `opacity-60`
- Line 150: `text-cyan-900` → `text-slate-400` (timestamps)

**3. Live Audit Log (lines 756-772)**
- Line 758: `text-slate-400` → `text-slate-200` ("Live Audit Log" header)
- Line 769: `text-slate-600` → `text-slate-300`, remove `opacity-50` ("Awaiting scan initialization")

**4. Metadata Footer Box (lines 821-824)**
- Line 821: `text-cyan-600` → `text-slate-200` ("Extracted Metadata Specs")
- Line 824: `text-cyan-300/80` → `text-slate-300` (grid text)

### Files Modified
1. `src/components/OrangeScanner.tsx`

