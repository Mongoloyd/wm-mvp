

## Plan: Replace the NarrativeProof CTA block with the 3D "How WindowMan Actually Works" section

### What's Changing
Replace the bottom CTA card in `NarrativeProof.tsx` (lines 119-134: "YOUR QUOTE IS EITHER PRICED FAIRLY...") with the full 3D layered card design from the user's provided code. This new section includes: header with badge, flow diagram (You → WindowMan → Contractor), "What Do You Get" benefits grid, and the "How/Why" bottom cards.

Additionally, replace the current `MarketMakerManifesto.tsx` with this same new design, since the new code covers all the same content (flow diagram, benefits list, how/why cards) but with the upgraded 3D aesthetic.

### Implementation

**1. Rewrite `MarketMakerManifesto.tsx`**
- Replace the entire component with the user's provided code, adapted to fit the project:
  - Use `motion` from framer-motion (already a dependency) for animations
  - Keep the existing `onDemoClick` prop interface
  - Add `LayeredCard` and `BenefitItem` as local sub-components
  - Use lucide-react icons (already imported throughout the project)
  - Keep the existing background blobs, 3D offset cards, flow diagram, benefits grid, and How/Why cards exactly as provided
  - Preserve the `useInView` pattern for scroll-triggered animations (consistent with existing code)

**2. Remove the CTA block from `NarrativeProof.tsx`**
- Delete lines 119-134 (the "YOUR QUOTE IS EITHER PRICED FAIRLY" card with buttons)
- The testimonial carousel above it remains untouched

### Files
1. **Rewrite** `src/components/MarketMakerManifesto.tsx` — full replacement with 3D layered design
2. **Edit** `src/components/NarrativeProof.tsx` — remove lines 119-134 (the bottom CTA block)

### No Risk
- No backend, OTP, or data model changes
- No new dependencies (framer-motion + lucide-react already in use)
- Index.tsx already renders `MarketMakerManifesto` — no routing changes needed

