

## Assessment: Already Implemented

The current `ForensicShift.jsx` already matches every requirement in the task:

| Requirement | Current State |
|---|---|
| FAB is direct child of `order-first` wrapper, before `overflow-hidden` | Line 254 -- already correct |
| Position: `absolute top-[-40px] left-1/2 -translate-x-1/2 z-50 lg:hidden` | Line 256 -- already correct |
| Size: `w-24 h-24` circular | Line 256 -- already correct |
| Style: `bg-cyan-500`, cyan glow shadow | Line 256 -- already correct |
| Content: `Sparkles` icon + stacked "Start Scan" | Lines 258-260 -- already correct |
| `scan-glow` keyframe with scale oscillation | Lines 315-324 -- already correct |
| onClick opens modal | Line 255 -- calls `setShowModal(true)` (correct setter name) |

### Only Issue: Visibility on Current Viewport

The button may not be visible because:
1. The user is on a **768px wide viewport** which is below `lg` (1024px), so `lg:hidden` should make it visible
2. The `top-[-40px]` positions it above the document -- if the parent section has `overflow-hidden`, it could still clip

### Recommended Fix

Check if `Index.tsx` or any ancestor wrapper has `overflow-hidden` that clips the FAB at the page level. If so, change it to `overflow-x-hidden` (keeps horizontal clipping without vertical clipping).

### Changes

**File: `src/pages/Index.tsx`**
- Verify the wrapper around `<ForensicShift />` does not use `overflow-hidden`. If it does, change to `overflow-x-hidden`.

**File: `src/components/Forensicshift.jsx`**
- No changes needed -- implementation is already correct per the spec.

