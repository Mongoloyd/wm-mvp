

## Plan: Relocate & Restyle Mobile FAB in ForensicShift.jsx

### Problem
The FAB currently sits inside the `overflow-hidden` div (line 252), which clips it. It's also too small (`w-14 h-14`) and lacks an icon.

### Changes — Single file: `src/components/Forensicshift.jsx`

**1. Add import** at top of file:
```jsx
import { Sparkles } from 'lucide-react';
```

**2. Move FAB outside `overflow-hidden`** — Remove lines 253-261 (the button inside the overflow div). Place it as a direct child of the outer wrapper (line 251), before the `overflow-hidden` div:

```jsx
{/* Center: Document */}
<div className="order-first lg:order-none relative ...">
  
  {/* FAB — direct child, NOT inside overflow-hidden */}
  <button
    onClick={() => setShowModal(true)}
    className="lg:hidden absolute top-[-40px] left-1/2 -translate-x-1/2 z-50 w-24 h-24 rounded-full bg-cyan-500 hover:bg-cyan-400 flex flex-col items-center justify-center transition-colors animate-[scan-glow_2s_ease-in-out_infinite] shadow-[0_0_40px_rgba(34,211,238,0.7)]"
  >
    <Sparkles className="w-5 h-5 text-white mb-0.5" />
    <span className="text-[10px] font-black uppercase leading-tight text-white tracking-wide">Start</span>
    <span className="text-[10px] font-black uppercase leading-tight text-white tracking-wide">Scan</span>
  </button>

  <div className="relative w-full h-full rounded-sm overflow-hidden bg-black">
    {/* ... existing content unchanged ... */}
  </div>
</div>
```

**3. Replace CSS animation** (lines 314-317) — swap `pulse-glow` for `scan-glow` with scale:

```css
@keyframes scan-glow {
  0%, 100% {
    box-shadow: 0 0 25px rgba(34,211,238,0.5), 0 0 50px rgba(34,211,238,0.3);
    transform: translateX(-50%) scale(1);
  }
  50% {
    box-shadow: 0 0 40px rgba(34,211,238,0.8), 0 0 70px rgba(34,211,238,0.5);
    transform: translateX(-50%) scale(1.05);
  }
}
```

### Why this fixes it
- Button moves from inside `overflow-hidden` to its parent `relative` container — no clipping
- `top-[-40px]` floats it above the document edge so it's unmissable
- `w-24 h-24` makes it large enough to tap easily on mobile
- `scan-glow` animation preserves `translateX(-50%)` centering while pulsing scale
- `Sparkles` icon adds visual clarity alongside "START SCAN" text

### Result
A large, glowing cyan circle with sparkle icon and "START SCAN" text, floating above the document on mobile/tablet only, opening the analysis modal on tap.

