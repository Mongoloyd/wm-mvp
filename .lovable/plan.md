

# Import Windowman AI Hero as /contractors Route

## Summary
Copy all components from the "Windowman AI Hero" project into a namespaced folder in wm-mvp, create a `/contractors` page route, and add a single "Contractors" link in the SiteFooter.

## What changes

### 1. Copy 15 component files into `src/components/contractors/`
All components from the source project, placed under a dedicated namespace to avoid conflicts with existing components:

- `CinematicBackdrop.tsx`
- `HeroSection.tsx`
- `ProblemSection.tsx`
- `MarketRealitySection.tsx`
- `InsightSection.tsx`
- `SolutionSection.tsx`
- `HowItWorksSection.tsx`
- `ROISection.tsx`
- `BusinessModelSection.tsx`
- `DefensibilitySection.tsx`
- `FinalCTASection.tsx`
- `CTAFloatPill.tsx`
- `QualificationFlow.tsx`
- `CTAButton.tsx`
- `GlassPanel.tsx`
- `SlideShell.tsx`
- `SectionHeader.tsx`
- `TactileGlassCard.tsx`
- `EquationLockup.tsx`
- `MetricRow.tsx`
- `Flywheel.tsx`

All internal `@/components/` imports will be rewritten to `@/components/contractors/`. The `@/lib/utils` import stays as-is (already exists in wm-mvp).

### 2. Copy hook: `src/hooks/useWarmIntent.tsx`
Already no conflict with existing hooks.

### 3. Add CSS variables and `.glass-panel` class
The source project uses custom CSS variables (`--glass-bg`, `--glass-border`, `--glow-orange`, `--audit-pass`, `--audit-warn`, `--audit-fail`) and a `.glass-panel` utility class. These will be scoped inside a `.contractors-page` wrapper class in `src/index.css` to avoid polluting the main site's design tokens.

### 4. Create page: `src/pages/Contractors.tsx`
Wraps the full Index page content with the scoped CSS class and dark background override.

### 5. Add route in `src/App.tsx`
Add `/contractors` as a lazy-loaded route inside the existing `PublicLayout` wrapper (so it gets the shared navbar/footer).

### 6. Add footer link in `src/components/layout/SiteFooter.tsx`
Add `{ label: "Contractors", to: "/contractors" }` to the `company` links array. Single line, minimal footprint.

## Files created/modified

| File | Action |
|------|--------|
| `src/components/contractors/*.tsx` (21 files) | Create (copied + import paths rewritten) |
| `src/hooks/useWarmIntent.tsx` | Create |
| `src/pages/Contractors.tsx` | Create |
| `src/index.css` | Add scoped CSS variables + `.glass-panel` for contractors page |
| `src/App.tsx` | Add lazy route for `/contractors` inside PublicLayout |
| `src/components/layout/SiteFooter.tsx` | Add "Contractors" to company links |

## Design isolation strategy
The source project uses a dark theme with different CSS variables. To prevent bleeding into the main light-themed site, all custom variables and the `.glass-panel` class will be scoped under a `.contractors-page` parent selector in the CSS. The `Contractors.tsx` page wrapper applies this class.

## No new dependencies needed
`framer-motion` and `zod` are already in `package.json`.

