## Multi-Breakpoint Trust Bullets & Footer Safe Area

### File 1: `src/components/TrustBullets.tsx`

**Line 18 — Container:**

```
// From
<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 w-fit">
// To
<div className="w-full flex flex-col md:grid md:grid-cols-2 xl:flex xl:flex-row xl:justify-center gap-y-3 gap-x-4 xl:gap-x-8">
```

**Line 22 — Text span:**

```
// From
<span className="text-sm text-slate-950 font-medium">
// To
<span className="whitespace-nowrap font-medium text-slate-950 text-[11px] xs:text-xs md:text-[13px] lg:text-sm">
```

Note: Tailwind doesn't include `xs:` by default. We'll use `min-[400px]:text-xs` as equivalent, or simply start at `text-xs` since 11px→12px difference is minimal. I'll use `text-[11px] min-[400px]:text-xs md:text-[13px] lg:text-sm`.

### File 2: `src/pages/Index.tsx`

**Line 91 — Main wrapper:**

```
// From
<div className="min-h-screen bg-background pb-32">
// To
<div className="min-h-screen bg-background pb-[240px] sm:pb-[180px] lg:pb-32">
```

### Breakpoint behavior


| Viewport    | Bullets layout         | Font size | Bottom padding |
| ----------- | ---------------------- | --------- | -------------- |
| <400px      | `flex-col` stacked     | 11px      | 240px          |
| 400–767px   | `flex-col` stacked     | 12px (xs) | 240px          |
| 640–767px   | `flex-col` stacked     | 12px      | 180px          |
| 768–1279px  | `grid-cols-2` (2×2)    | 13px      | 180px          |
| 1024–1279px | `grid-cols-2` (2×2)    | 14px (sm) | 128px          |
| 1280px+     | `flex-row` single line | 14px      | 128px          |
