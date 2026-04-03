

# Swap First and Third Evidence Blocks in IndustryTruth

## What I Understand
You want the **"Hidden Fee Structure"** block (excludes-labor image) and the **"Unspecified Brands"** block (hidden-contract image) to trade places. This makes "Hidden Fee Structure" the first thing users see on mobile in the carousel, and "Unspecified Brands" moves to the third/right position on desktop.

## Change — `src/components/IndustryTruth.tsx`

Swap the first and third objects in the `blocks` array (lines 12-38):

**Position 1 (currently "Unspecified Brands")** → becomes "Hidden Fee Structure"
**Position 3 (currently "Hidden Fee Structure")** → becomes "Unspecified Brands"

The middle block ("Vague Warranty Language") stays unchanged.

One array reorder, no logic changes.

