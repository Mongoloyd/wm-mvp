

# Premium Hero Background: Frosted Glass + Grain + Parallax

## Summary
Three layered enhancements to the AuditHero background: frosted glass blur on the overlay, a subtle film grain texture, and scroll-based parallax depth on the background image.

## Changes

### 1. Frosted Glass Overlay
**File**: `src/components/AuditHero.tsx` (line 64)

Add `backdrop-blur-lg` to the existing gradient overlay div. This blurs the drifting background image through the semi-transparent white gradient, creating a premium frosted glass effect.

```
before: "absolute inset-0 bg-gradient-to-b from-white/55 via-white/35 to-white/65 pointer-events-none"
after:  "absolute inset-0 bg-gradient-to-b from-white/55 via-white/35 to-white/65 backdrop-blur-lg pointer-events-none"
```

### 2. Film Grain Texture Overlay
**File**: `src/components/AuditHero.tsx` — new div after the gradient overlay (after line 64)

Add a noise/grain layer using an inline SVG filter via CSS `background-image` with `url("data:image/svg+xml,...")` generating a `feTurbulence` noise pattern at ~3% opacity. This adds physical texture without any external asset.

```text
<div
  className="absolute inset-0 pointer-events-none mix-blend-overlay"
  style={{
    opacity: 0.03,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
    backgroundRepeat: "repeat",
    width: "100%",
    height: "100%",
  }}
/>
```

### 3. Parallax Scroll Depth
**File**: `src/components/AuditHero.tsx` — modify the `<section>` and the `<img>` element

Two approaches (lightweight CSS-only preferred):

- Add `style={{ perspective: "1px", overflowY: "hidden" }}` is not ideal since this section doesn't scroll independently.
- **Better**: Use a small React `useEffect` + `useRef` with a `scroll` listener that applies a `translateY` transform to the background image at ~0.3× scroll speed. This is a ~10-line hook added directly in the component. On `window.scroll`, compute `const offset = window.scrollY * 0.3` and set `imgRef.current.style.transform = \`scale(1.08) translateY(\${offset}px)\``. The existing `animate-hero-drift` class would need to be replaced with a JS-driven approach that combines drift + parallax, OR we keep drift as CSS animation and layer parallax via a wrapper div.

**Cleaner approach**: Wrap the `<img>` in a div, apply parallax translation to the wrapper, and keep the CSS drift animation on the img itself. The wrapper gets `will-change: transform` for GPU compositing.

## Technical Detail

```text
┌─ <section> ──────────────────────────────────┐
│  ┌─ parallax wrapper (translateY at 0.3×) ─┐ │
│  │  <img animate-hero-drift />              │ │
│  └──────────────────────────────────────────┘ │
│  <div gradient + backdrop-blur-lg />          │
│  <div grain noise overlay 3% opacity />       │
│  <div z-10 content />                         │
└───────────────────────────────────────────────┘
```

## Files Changed
- `src/components/AuditHero.tsx` — frosted blur class, grain div, parallax wrapper + scroll hook

## What Does NOT Change
- Background image file
- Drift animation timing/keyframes
- Gradient color stops or opacity values
- Content layout, text, CTAs
- Any other component

