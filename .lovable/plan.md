

# Plan: Add Testimonials Carousel Section

## What Gets Built

A new `src/components/Testimonials.tsx` component adapted from Window Shield's `LiveSavings.tsx`, restyled to the WindowMan.PRO skeuomorphic design system. Placed on the homepage between `ClosingManifesto` and `Footer`.

## Content Adaptation

- Rewrite all 6 testimonials to reference "WindowMan" / "the scan" / "the Truth Report" instead of "Window Guy" as a person
- Keep the Florida locations, savings amounts, and narrative structure
- Replace platform icons with simple text labels (no emojis in cards)
- Savings badge uses emerald (`--color-emerald`) with the `💰` emoji per style guide

## Visual Adaptation (Skeuomorphic System)

| Original (Window Shield) | Adapted (WindowMan.PRO) |
|---|---|
| `Card` with `border-success/20` | `card-raised` class with system shadow |
| `bg-gradient-to-br from-success/5` | `bg-background` (system page bg) |
| `ScrollAnimationWrapper` | `motion.div` with `useInView` (matches existing sections) |
| `text-success` green stars | Cobalt `text-primary` stars |
| Generic `Button` CTA | `btn-depth-primary` system button |
| Stats cards with gradient fills | `card-raised` with system tokens |

### Typography
- Section eyebrow: `.wm-eyebrow` (mono, uppercase)
- Section title: `.wm-title-section` (Barlow Condensed)
- Card body: `.wm-body` or `font-body text-sm`
- Headline quotes: `font-body font-bold`

### Cards
- Use `card-raised p-6` — opaque white surface with `--shadow-resting`
- Emerald left border accent (`border-l-4 border-[hsl(var(--color-emerald))]`)
- No hover glow — use system `hover:translateY(-1px)` lift

### Stats Strip
- 3-column grid using `card-raised` with system borders
- Numbers in `font-display font-extrabold` with semantic colors

### Bottom CTA
- Accepts `onScanClick` prop, renders `btn-depth-primary` "Show Me My Grade →"
- Wraps in `card-dominant` to match NarrativeProof's bottom CTA pattern

## Carousel
- Reuse existing `embla-carousel-react` + `embla-carousel-autoplay` (already in deps)
- Autoplay 4s, stops on interaction
- Dot indicators styled with system `--primary` / `--border` colors
- Desktop: 3 cards visible. Mobile: 1 card, swipeable
- Respects `prefers-reduced-motion`

## File Changes

### 1. Create `src/components/Testimonials.tsx`
- Embla carousel with 6 testimonial cards
- Stats strip (3 cards)
- Bottom CTA card
- Props: `onScanClick?: () => void`
- Entry animation: `motion.div` + `useInView` matching existing sections

### 2. Edit `src/pages/Index.tsx`
- Import `Testimonials`
- Insert after `ClosingManifesto` and a `wm-bridge-strip` divider, before the Footer block:

```text
  <ClosingManifesto ... />
+ <div className="wm-bridge-strip py-3" />
+ <Testimonials onScanClick={() => triggerTruthGate('testimonials')} />
  <ExitIntentPhoneModal ... />
```

No other files touched.

