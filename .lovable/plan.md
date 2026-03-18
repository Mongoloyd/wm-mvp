

## Hero CTA Bulletproofing — Corrected Plan

### File 1: `src/components/AuditHero.tsx`

**Line 110 — Button wrapper:**
```
flex flex-col md:flex-row gap-3 md:gap-4
```
→
```
flex flex-col sm:flex-row sm:flex-wrap items-center gap-3 md:gap-4 w-full sm:w-auto
```

**Lines 127-129 — Gold button:**
- Add `w-full sm:w-auto whitespace-nowrap` to className
- Change text to: `Scan My Quote <span className="inline md:hidden lg:inline">— It's Free</span>`

**Lines 139-186 — Ghost button block:**
- Remove the wrapper `div` with `flex flex-col mt-2` (replace with just `mt-2 w-full sm:w-auto`)
- Strip all inline `style` for background/border/color and remove `onMouseEnter`/`onMouseLeave` handlers
- Apply Tailwind: `w-full sm:w-auto whitespace-nowrap bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 transition-colors rounded-[10px] px-6 py-3.5 cursor-pointer relative`
- Keep `fontFamily` inline style, keep the NEW badge, keep `motion.button` with hover/tap

### File 2: `src/components/PowerToolDemo.tsx`

**Line 25 — `PowerToolButton`:**
- Add `whiteSpace: "nowrap"` to the button's inline style object
- Add `width` responsive behavior: remove `width: "100%"` and instead set the button's className or inline style so it's full-width on mobile but auto on sm+ (since this component uses inline styles exclusively, we add a className prop: `className="w-full sm:w-auto"`)

### Summary

| File | Change |
|------|--------|
| `src/components/AuditHero.tsx` | Fix wrapper to `flex-col sm:flex-row sm:flex-wrap`, responsive text on Gold button, `whitespace-nowrap` + `w-full sm:w-auto` on Gold & Ghost, emerald Ghost styling |
| `src/components/PowerToolDemo.tsx` | Add `whitespace-nowrap` + `w-full sm:w-auto` to the Teal trigger button |

