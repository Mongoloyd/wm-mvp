

## Plan: Add Arbitrage Model Section

### What
Create `src/components/sections/ArbitrageModelSection.tsx` from the provided code and insert it between `<HowItWorksSection />` and `<EconomicsSection />` on the Contractors2 page.

### Changes

**1. Create `src/components/sections/ArbitrageModelSection.tsx`**
- Strip the outer `App` wrapper and `min-h-screen` container
- Wrap in a `<section className="py-24 bg-zinc-950">` root to match page rhythm and alternate backgrounds (HowItWorksSection is `bg-zinc-950`, so this one will use `bg-black` to alternate)
- Keep all internal components inline (Card, Badge, Connector) as local helpers — no shadcn imports to avoid conflicts
- Preserve all styling: glow borders, grid background, branching lines, responsive stacking
- Import Lucide icons directly from `lucide-react`

**2. Update `src/pages/Contractors2.tsx`**
- Import `ArbitrageModelSection`
- Insert `<ArbitrageModelSection />` between `<HowItWorksSection />` and `<EconomicsSection />`

### Section order after change
1. HeroSection
2. MarketTruthSection
3. CompetitorQuoteSection
4. BuyerReadinessSection
5. HowItWorksSection
6. **ArbitrageModelSection** ← new
7. EconomicsSection
8. FlywheelSection
9. DifferentiationSection
10. ExclusivitySection
11. ...rest

