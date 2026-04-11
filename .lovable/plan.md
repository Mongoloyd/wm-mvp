

## Plan: Create DevTesting Page with ArbitrageEngine

There is no `/devtesting` route or page yet. I need to create it and fix the build errors in `arbitrageengine.tsx`.

### Steps

**1. Fix build errors in `src/components/arbitrageengine.tsx`**
- Change `ease: "easeOut"` to `ease: "easeOut" as const` (and same for `"easeIn"`) in the `slideVariants` object at lines 147-148
- This is the only source of all 8+ TS2322 errors

**2. Create `src/pages/DevTesting.tsx`**
- Simple wrapper page that imports and renders `ArbitrageEngine` from `src/components/arbitrageengine.tsx`
- Minimal layout with dark background to match the component's styling

**3. Add route in `src/App.tsx`**
- Lazy-import `DevTesting`
- Add `<Route path="/devtesting" element={<DevTesting />} />` in the dev/internal routes section (~line 115)

### Files
1. **Edit** `src/components/arbitrageengine.tsx` — fix `ease` typing (lines 147-148)
2. **Create** `src/pages/DevTesting.tsx` — wrapper page
3. **Edit** `src/App.tsx` — add route

