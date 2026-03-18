

## LinearHeader — Lead-Gen Pure Rewrite

### Single file: `src/components/LinearHeader.tsx`

Complete rewrite with these specifics:

**Props**: `ctaText?: string` (default `"Get Started Free"`), `onCtaClick?: () => void`

**Scroll behavior**: `useState(false)` + `useEffect` with scroll listener. When `scrollY > 20`: `py-2 shadow-sm border-slate-200/50`. Otherwise: `py-4 border-transparent`. Container: `sticky top-0 z-50 backdrop-blur-md bg-white/95 transition-all duration-300 ease-in-out`.

**Logo**: Wrap in `<a href="/">`. Pure Tailwind — `font-['DM_Sans'] font-[800] text-lg`. Spans: `text-[#0F1F35]` / `text-[#C8952A]`. Sup `.PRO`: `text-[10px] text-gray-500 font-normal tracking-widest`.

**Desktop right side (md+)**: Micro-copy `"No credit card required."` — `hidden md:block text-[10px] text-slate-500 uppercase tracking-wider`. Gold button: `bg-[#C8952A] text-white font-semibold px-5 py-2.5 rounded-md hover:brightness-110 transition-all`.

**Mobile right side (<md)**: Same gold button, scaled down: `md:hidden px-3 py-1.5 text-sm`. No hamburger, no Sheet, no nav links.

**Deleted**: All inline styles, Sheet/drawer code, nav link placeholders, DM Mono import (unused here). Keep DM Sans import.

