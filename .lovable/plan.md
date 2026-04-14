

## Plan: Triangle Hero Layout with Character Image

### What
Place the uploaded character image (`flywheel_wman.avif`) centered at the top of the HeroSection, then spread the two existing content blocks (headline/CTA on left, Quote Analysis card on right) wider below it, creating a visual triangle composition.

### Changes

**1. Copy image to project**
- Copy `user-uploads://flywheel_wman.avif` to `public/images/flywheel-wman.avif`

**2. Update `src/components/sections/HeroSection.tsx`**
- Add a centered image block above the existing two-column grid:
  - `motion.img` with fade-in animation, centered via `mx-auto`, sized appropriately (~200–280px)
  - Small bottom margin before the grid
- Widen the two-column grid from `max-w-6xl` to `max-w-7xl` (or wider) to spread the left/right blocks further apart, forming the triangle base
- Increase the `gap` between columns (e.g., `gap-20` or `gap-24`) to push them outward
- Keep all existing content and animations intact

### Visual result
```text
         [character image]
        /                  \
   [headline+CTA]    [quote card]
```

The image sits at the apex, the two content blocks form the wide base of the triangle.

