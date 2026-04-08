

# Plan: WindowMan Mascot Prominence + Mobile Layout Reorder

## What Changes

### Desktop
- **Bigger mascot**: Increase from `md:w-64 lg:w-96` to `md:w-80 lg:w-[480px]` — roughly 25-50% larger
- **Floating animation**: Add a gentle vertical bob to the mascot (6s ease-in-out infinite, ~8px travel) that syncs with the GradeCard's existing bob (4s cycle)
- **Z-index overlap**: Mascot sits at `z-20`, GradeCard at `z-30` — when they overlap vertically, the mascot slides behind the GradeCard naturally (mascot image bottom overlaps card top)
- **Tighter vertical gap**: Reduce/remove the gap between mascot and GradeCard so they visually overlap by ~40px using negative margin on the GradeCard

### Mobile (complete reorder)
Current mobile order: Pill → Mascot → H1 → CTAs
New mobile order:
1. **Trust Pill** — "FREE AI QUOTE AUDIT" (already order-1)
2. **Mascot image** — large and prominent, nearly full-width (order-2, keep but make bigger)
3. **H1 headline** — below the mascot (order-3, stays)
4. **Subheadline + CTAs** — below that

Mobile mascot sizing: increase from `max-w-sm` to `max-w-md` (28rem → 448px) for more screen presence.

## Files Modified

| File | Change |
|------|--------|
| `src/components/AuditHero.tsx` | Resize mascot, add float animation, adjust z-index layering, negative margin overlap on GradeCard |

## Technical Details

**Mascot float animation** — use framer-motion `animate={{ y: [-8, 0, -8] }}` with `duration: 6` on the mascot wrapper. The GradeCard already has `animate={{ y: [-6, 0, -6] }}` at 4s. Different periods create a natural parallax feel.

**Overlap technique** — GradeCard container gets `mt-[-40px] md:mt-[-60px]` to pull it up behind the mascot. Mascot `z-20` stays below GradeCard `z-30`, so the mascot's feet/lower body tuck behind the card.

**Mobile pill text** — The badge text comes from the variant system (`variantBadgeText`). The `pre_sign` variant already sets it to "FREE AI QUOTE AUDIT". No change needed to the pill content itself — it renders whatever the active variant provides.

