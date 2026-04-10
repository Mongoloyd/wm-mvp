

## Plan: Tablet Layout Fix + Desktop Alignment

### Problem
- At tablet widths (768px-1023px), the `md:` breakpoint forces a cramped two-column layout
- Grade card is hidden on mobile but should be visible on tablet
- Desktop left column starts too high relative to the mascot

### Approach
Switch the two-column breakpoint from `md` (768px) to `lg` (1024px). This means tablet gets the single-column stacked layout.

### Changes to `src/components/AuditHero.tsx`

**1. Shift two-column breakpoint from `md` to `lg`**
- Container: `flex-col md:flex-row` → `flex-col lg:flex-row`
- All `md:order-*`, `md:flex-1`, `md:pt-*`, `md:items-start`, `md:text-left` → `lg:` equivalents
- CTA row: `md:flex-row` → `lg:flex-row`
- Stats strip: `hidden md:flex` → `hidden lg:flex`
- Trust pill: `md:hidden` / `hidden md:inline-flex` → `lg:hidden` / `hidden lg:inline-flex`
- Grade card: `hidden md:block` → show on tablet too (visible from `sm` up, or always visible and just centered in single-column mode)

**2. Tablet stack order (< lg)**
1. Trust pill
2. Mascot
3. Headline + subtext
4. Two CTAs (centered, stacked on small mobile, side-by-side on tablet `sm+`)
5. Trust bullets
6. Grade card (newly visible at tablet, centered)
7. Stats strip (visible at tablet too, centered)

**3. Desktop (lg+) left-column push-down**
- Change `lg:pt-20` to `lg:pt-28` or `lg:pt-32` so the trust pill aligns with the mascot's shoulder area

### Files touched
1. `src/components/AuditHero.tsx` — breakpoint migration + grade card visibility + desktop padding

### What stays the same
- All functionality, props, PowerToolDemo behavior
- Desktop two-column layout (just kicks in at `lg` instead of `md`)
- Mobile stacked layout unchanged

