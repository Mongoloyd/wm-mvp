

## Ghost Button Tablet Stacking Fix

### Changes — `src/components/AuditHero.tsx` (lines 138–171)

Replace all `sm:` breakpoints with `lg:` on the Ghost button wrapper and element:

**Line 138 — Wrapper div:**
```
// From
<div className="mt-2 w-full sm:w-auto">
// To
<div className="mt-2 w-full lg:w-auto">
```

**Line 143 — Button className:**
```
// From
className="w-full sm:w-auto ... py-3.5 px-4 sm:px-6 ... flex flex-col sm:flex-row sm:items-center sm:gap-2"
// To
className="w-full lg:w-auto ... py-3.5 px-4 lg:px-6 ... flex flex-col lg:flex-row lg:items-center lg:gap-2"
```

**Line 170 — Stagger span:**
```
// From
<span className="ml-[4.5ch] sm:ml-0">
// To
<span className="ml-[4.5ch] lg:ml-0">
```

### Final Ghost Button Code Block (post-edit)

```tsx
<div className="mt-2 w-full lg:w-auto">
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onFlowBClick?.()}
    className="w-full lg:w-auto bg-emerald-950/40 hover:bg-emerald-900/60 border-2 border-emerald-800/60 hover:border-emerald-700/80 text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-colors rounded-[10px] py-3.5 px-4 lg:px-6 cursor-pointer relative flex flex-col lg:flex-row lg:items-center lg:gap-2"
    style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 15,
      fontWeight: 500,
    }}
  >
    <span className="flex items-center gap-2">
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#10b981",
          color: "#000000",
          fontFamily: "'DM Mono', monospace",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.05em",
          padding: "2px 6px",
          borderRadius: 4,
        }}
      >
        NEW
      </span>
      <span>Getting Quotes Soon?</span>
    </span>
    <span className="ml-[4.5ch] lg:ml-0">We Can Arm You 1st →</span>
  </motion.button>
</div>
```

### Breakpoint behavior summary

| Viewport | Layout | Width | Stagger |
|----------|--------|-------|---------|
| Mobile (<640px) | `flex-col` stacked two-line | `w-full` | `ml-[4.5ch]` |
| Tablet (640–1023px) | `flex-col` stacked two-line | `w-full` | `ml-[4.5ch]` |
| Desktop (1024px+) | `flex-row` single line | `w-auto` | `ml-0` |

