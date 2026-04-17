

## Placement (confirmed by user)

In `src/pages/diagnosis/components/MarketingSections.tsx`, **section 1** ("Why WindowMan Gets You a Better Quote"), the current order is:

1. Two-column cards: "When You Shop Alone" | "With WindowMan"
2. "Bottom line" callout

New order:

1. Two-column cards (unchanged)
2. **NEW:** Arbitrage flow diagram (Gradecard → Strong/Weak Pillars → 3 Vetted Contractors)
3. "Bottom line" callout (unchanged, moves below the diagram)

## Reference image directives (critical)

The uploaded reference shows the diagram **without** an outer container — no glassmorphic card, no border, no boxed background. It blends directly into the section's light blue atmosphere with only a subtle off-white glow behind the nodes. This is different from the original `App.tsx` snippet which wrapped everything in a heavy `bg-white/40 backdrop-blur-3xl border ... rounded-[2.5rem]` glass canvas.

## Implementation

### File 1 (NEW): `src/components/diagnosis/ArbitrageFlowDiagram.tsx`

Extracts the uploaded `App` component into a reusable, embeddable diagram with these adaptations:

- **Remove** the outer `min-h-screen ... bg-gradient-to-br` wrapper (parent section provides atmosphere)
- **Remove** the glassmorphic canvas wrapper (`bg-white/40 backdrop-blur-3xl border border-white/60 ... rounded-[2.5rem]`) per reference image — diagram blends with section background
- **Replace** with a transparent `relative` container that retains only the `containerRef`, padding, and flex layout for SVG path math
- **Keep** all node refs, SVG path calculation, ResizeObserver, and animated paths exactly as provided
- **Keep** the SkeuoNode component verbatim (orange + blue 3D nodes with `boxShadow` glow — this provides the "off-white glow" the user requested)
- **Hide** the right-rail xl captions ("The Asset", "The Counter-Bid") — they'd clash with the centered narrative section. Keep only the bottom-centered "The Correction" caption since it reads cleanly on all viewports
- **Convert** to TypeScript (`.tsx`) with proper typing for refs and props
- Default export removed; named export `ArbitrageFlowDiagram`

### File 2 (EDIT): `src/pages/diagnosis/components/MarketingSections.tsx`

Single insertion in section 1, between the closing `</div>` of the two-column grid and the "Bottom line" callout:

```tsx
<div className="mt-12">
  <ArbitrageFlowDiagram />
</div>
```

Add import at top:
```tsx
import { ArbitrageFlowDiagram } from '@/components/diagnosis/ArbitrageFlowDiagram';
```

No other content, copy, or styling changes in `MarketingSections.tsx`.

## Dependencies

- `framer-motion` — already in project (used by About + many components)
- `lucide-react` — already in project (`Shield` icon)

No new packages.

## Constraints honored

- Logic-free additive change; no hooks, state model, validation, or flow touched
- Only files: 1 new component + 1 marketing section edit
- Aligns with `/diagnosis` light cobalt atmosphere — no dark slabs, no boxed container, blends with section background per reference
- "Bottom line" callout preserved verbatim, simply repositioned below the diagram

## Files touched

| File | Action |
|---|---|
| `src/components/diagnosis/ArbitrageFlowDiagram.tsx` | CREATE |
| `src/pages/diagnosis/components/MarketingSections.tsx` | EDIT (1 import + 1 insertion) |

