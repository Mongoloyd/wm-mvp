

## Plan: Fix Mobile VerdictHologram Overflow

### Problem
The `VerdictHologram` component in `OrangeScanner.tsx` renders as a large overlay card (`w-[85%] max-w-md`) with heavy content (64px icon, 3 risk cards, 2 CTA buttons, audit ID footer). On mobile (390px viewport), this overflows vertically and causes flickering/layout issues.

### Approach
Rather than hiding and building a separate fallback, we'll make the existing hologram mobile-responsive by scaling down its internal elements. This keeps a single code path.

### Changes — `src/components/OrangeScanner.tsx` (VerdictHologram)

1. **Constrain the outer container for mobile**
   - Add `max-h-[85vh] overflow-y-auto` so it scrolls if content exceeds the viewport
   - Change padding from `p-8` to `p-4 md:p-8`

2. **Shrink icon on mobile**
   - Reduce `VerdictIcon` from `size={64}` to a responsive approach: `size={36}` on mobile via a class-based wrapper (`w-9 h-9 md:w-16 md:h-16`)

3. **Reduce headline size on mobile**
   - Change `text-3xl md:text-4xl` to `text-xl md:text-3xl`

4. **Compact risk cards on mobile**
   - Reduce `mb-8` gaps to `mb-4 md:mb-8`
   - Reduce `space-y-3` to `space-y-2`

5. **Compact CTA section**
   - Reduce `mt-8` to `mt-4 md:mt-8`
   - Reduce button height from `h-14` to `h-11 md:h-14`

6. **Remove `animate-bounce` on mobile icon** — replace with a one-time `animate-in` to reduce visual noise and GPU load

### Result
The hologram will fit cleanly within the mobile viewport without overflow, flickering, or needing a separate fallback component. Same content, tighter spacing.

