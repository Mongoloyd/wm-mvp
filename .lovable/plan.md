

# Ticker Tape SocialProofStrip — Implementation Plan

## Single file change: `src/components/SocialProofStrip.tsx`

### Structure

```text
┌─────────────────────────────────────────────────────────┐
│ [● LIVE]  ← PINNED    │  scrolling content underneath  │
│  absolute left-0       │  ● 4,127 scans ● $4,800 ...   │
│  z-10 with shadow      │  (duplicated for seamless loop)│
└─────────────────────────────────────────────────────────┘
```

**Outer wrapper**: `relative overflow-hidden frosted-card-dark frosted-section-spacing` full-width bar, `h-14`.

**Pinned LIVE badge**: `absolute left-0 top-0 z-10 h-full flex items-center px-4` with `bg-[#020617]/90` and right shadow `shadow-[10px_0_20px_-5px_rgba(2,6,23,1)]`. Contains blinking green dot (CSS `animate-pulse`) + "LIVE" in `font-mono text-[10px] text-emerald-400 uppercase tracking-widest`.

**Scrolling container**: `pl-20` (to clear the LIVE badge), `overflow-hidden`. Inner div has `whitespace-nowrap flex items-center w-max`. Content is rendered **twice** (two identical spans back-to-back) for seamless infinite loop.

**Each stat**: Inline — number in `font-mono text-lg font-bold` with brand color, label in `text-[11px] text-slate-500` after it. Stats separated by cyan glowing dot `●` (`text-cyan-400/60`).

### Animation

- CSS `@keyframes ticker-scroll { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }`
- Applied as inline style animation: `ticker-scroll 25s linear infinite`
- On `lg` (1024px+): animation removed via a class check or media query — content is static and centered
- Below `lg`: marquee scrolls continuously

### Responsive behavior

- **Mobile/Tablet (<1024px)**: Marquee scrolls, LIVE badge pinned left
- **Desktop (≥1024px)**: Static centered row, LIVE badge inline at left, no animation, content centered with `lg:justify-center`

### Kept from current
- `useCountUp` hook unchanged
- `stats` array unchanged  
- `motion.div` entrance animation (opacity/y fade-in)
- `frosted-card-dark` and `frosted-section-spacing` classes

