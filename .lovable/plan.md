

# Fix: InteractiveDemoScan Pushing UploadZone Down

## Problem
The demo scan card uses `min-h-[480px]`, which allows it to grow taller when phase-specific CTA buttons appear (during "reveal" and "hook" phases). This height change pushes the UploadZone and everything below it down the page.

## Root Cause
- Line 314 in `InteractiveDemoScan.tsx`: the card container uses `min-h-[480px]` (minimum, not fixed)
- During "reveal" phase (line 415-426): a "Scan My Quote" button animates in
- During "hook" phase (lines 432-453): a larger CTA block with text + button animates in
- These additions exceed 480px, causing the container to expand

## Fix — `src/components/InteractiveDemoScan.tsx`

**Change 1**: Convert the card from `min-h-[480px]` to a fixed height with `overflow-hidden` so phase transitions never change the outer dimensions:

Line 314: Replace `min-h-[480px]` with `h-[520px] overflow-hidden`

This reserves enough space for the largest phase (hook CTA) while preventing any layout shift. The `overflow-hidden` ensures nothing bleeds out.

**Change 2** (alternative if content gets clipped): Instead of fixed height, keep `min-h-[520px]` but increase it enough to fit the hook phase content so no growth occurs at runtime. 520px should accommodate all phases including the hook CTA.

## Recommended Approach
Fixed height (`h-[520px] overflow-hidden`) is cleanest — it guarantees zero layout shift regardless of phase.

