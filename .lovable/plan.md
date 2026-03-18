## Plan: Final Polish — Scroll Opacity, Phone Icon, Click-to-Call

### File 1: `src/components/StickyCTAFooter.tsx`

Three changes:

1. **Add imports**: `useState`, `useEffect` from React, `Phone` from lucide-react
2. **Add scroll listener**: `isScrolling` state with 300ms debounce timeout, toggling between `opacity-25` and `opacity-100 and` hover:opacity-100 with `transition-opacity duration-300` on the outermost `div`
3. **Add Phone icon**: Insert `<Phone size={18} />` inside the post-conversion button with `flex items-center justify-center gap-2`

### File 2: `src/pages/Index.tsx`

One change:

- Line 181: Replace `() => { /* placeholder: tel link or contact modal */ }` with `() => { window.location.href = 'tel:+15614685571'; }`

### No other files changed.