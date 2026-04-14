

## Plan: Add Flywheel Section

### What
Create a new `FlywheelSection.tsx` component from the provided code and insert it between `EconomicsSection` and `DifferentiationSection` on the Contractors2 page.

### Changes

**1. Create `src/components/sections/FlywheelSection.tsx`**
- Adapt the provided code into a standalone section component
- Remove the outer `App` wrapper and `min-h-screen` container — use a `<section>` root with `py-24` to match page rhythm
- Keep the two-column layout (headline + bullets on left, flywheel diagram on right)
- Preserve the teal accent color, glow effect, circular node placement, and hover interactions
- Keep the external legend labels and all responsive behavior intact

**2. Update `src/pages/Contractors2.tsx`**
- Import `FlywheelSection`
- Insert `<FlywheelSection />` between `<EconomicsSection />` and `<DifferentiationSection />`

### Technical notes
- No new dependencies — pure React + Tailwind + inline math for node positioning
- The teal accent is new to this page but is specified by the user's design, so it will be used as provided
- Background will use the provided gradient/dot-grid pattern within the section card, sitting on a `bg-zinc-950` or `bg-black` section background to alternate with neighbors

