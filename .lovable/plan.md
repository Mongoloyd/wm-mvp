

# Add Cinematic Drifting Background to AuditHero

## What it looks like
The uploaded `background.avif` fills the entire hero section edge-to-edge behind all content. It has a slow, continuous "Ken Burns" drift — scaled slightly larger than the container (~108%) and animated with a CSS keyframe that gently translates it ~15px over ~25 seconds in a smooth infinite loop. The content (headline, mascot, CTAs) stays perfectly still. A gradient overlay ensures text readability.

## Changes

### 1. Copy the image asset
Copy `user-uploads://background.avif` → `src/assets/hero-background.avif`

### 2. Add a keyframe to `tailwind.config.ts`
Add a `hero-drift` keyframe that slowly moves the background in a looping figure-eight-ish path:
```
"hero-drift": {
  "0%, 100%": { transform: "scale(1.08) translate(0, 0)" },
  "25%":      { transform: "scale(1.08) translate(-10px, 5px)" },
  "50%":      { transform: "scale(1.08) translate(5px, -8px)" },
  "75%":      { transform: "scale(1.08) translate(8px, 3px)" },
}
```
Animation definition: `"hero-drift": "hero-drift 25s ease-in-out infinite"`

### 3. Update `src/components/AuditHero.tsx`
- Import the background image from `@/assets/hero-background.avif`
- Replace the inline gradient `background` on the `<section>` with just `position: relative; overflow: hidden`
- Add an `<img>` element as the first child inside the section, absolutely positioned, covering the full area, with `animate-hero-drift` class and `object-cover`
- Add a gradient overlay `<div>` on top of the image (before the content) for text contrast — something like `bg-gradient-to-b from-white/70 via-white/50 to-white/80`
- The existing `relative z-10` content wrapper stays untouched

### Visual hierarchy (bottom to top)
```text
┌─────────────────────────────────┐
│  background.avif (drifting)     │  z-0, absolute, overflow hidden
│  ┌───────────────────────────┐  │
│  │  gradient overlay         │  │  z-5, pointer-events-none
│  │  ┌─────────────────────┐  │  │
│  │  │  all existing content│  │  │  z-10, unchanged
│  │  └─────────────────────┘  │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

No other files change. The mascot, headline, CTAs, and trust bullets remain exactly as they are.

