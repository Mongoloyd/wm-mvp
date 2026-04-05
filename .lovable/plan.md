

# Performance & Build Fix Plan

## Part A: Build Errors (2 pre-existing issues, not caused by recent changes)

These are pre-existing TypeScript errors in Edge Functions — not related to the contractors page or performance work.

### Fix 1: `adminAuth.ts` line 222 — `string | undefined` vs `string | null`
`Deno.env.get()` returns `string | undefined`, but `normalizeSecretValue` expects `string | null`.

**File**: `supabase/functions/_shared/adminAuth.ts`
**Change**: Cast the argument: `normalizeSecretValue(expectedDevSecretRaw ?? null)`

### Fix 2: `process-webhook/index.ts` — SupabaseClient type mismatch (6 errors)
The `logLeadEvent` and `buildPayload` functions have an overly strict `SupabaseClient` type parameter. The `supabase` variable created with `createClient<any>` doesn't match.

**File**: `supabase/functions/process-webhook/index.ts`
**Change**: Widen the `supabase` parameter type in `buildPayload` and `logLeadEvent` to accept `any` (e.g., use `SupabaseClient<any, any, any>` or just accept `any`).

---

## Part B: Mobile CLS & Performance Fix

### Root Causes Identified

**1. Double font loading (HIGH impact on CLS)**
- `index.html` loads Barlow Condensed via Google Fonts CDN with `display=block`
- `main.tsx` ALSO loads the same fonts via `@fontsource` packages
- Result: Two competing font loads. The `display=block` on the Google Fonts link means the browser renders **invisible text** until the Google font downloads, then potentially re-renders when the @fontsource version loads. This is a major CLS source.

**Fix**: Remove the Google Fonts `<link>` from `index.html`. Keep only the `@fontsource` imports in `main.tsx` (they're bundled with Vite, load faster, and use `swap` by default).

**2. Stale root `index.css` file**
- There's a root `index.css` file (separate from `src/index.css`) with placeholder CSS variables (`--font-body: /* your value here */`). This is a no-op file that may cause confusion but isn't a direct CLS issue.

**Fix**: Delete root `index.css` or clear it.

**3. Hero mascot image has no explicit dimensions (HIGH impact)**
- `AuditHero.tsx` line 106-112: The mascot `<img>` has `className="w-full max-w-sm md:w-64 lg:w-96 h-auto"` but **no `width`/`height` attributes**. Browser can't reserve space until the image downloads.

**Fix**: Add `width={384} height={512}` (approximate aspect ratio) to the mascot `<img>`. The CSS classes will still control actual sizing, but the browser can calculate the aspect ratio for layout reservation.

**4. Hero background image has no dimensions**
- `AuditHero.tsx` line 69-74: The `heroBg` parallax image has no width/height and uses `h-auto` sizing.

**Fix**: Since this is an absolutely positioned cover image, it doesn't cause CLS. No change needed.

**5. StoryImageCrossfade container is fine** — uses explicit `h-[300px] md:h-[450px]`. No CLS issue.

**6. ScamConcernImage is fine** — uses `aspect-[4/3] md:aspect-video`. No CLS issue.

**7. LazySection placeholder height** — defaults to `200px` which is reasonable. The real risk is when `isVisible` flips and children render at a different height, but this is a one-time expand, not a collapse. Minor CLS contributor at worst.

**8. PageLoader / Suspense fallback (MEDIUM impact)**
- `PageLoader` in `App.tsx` renders a spinner with `min-h-screen`. This is correct for lazy routes. However, the home route (`Index`) is statically imported, so Suspense doesn't affect it. No change needed.

**9. AnimatePresence on flow switching (MEDIUM impact)**
- `Index.tsx` line 207: `<AnimatePresence mode="wait">` wraps the hero. When flowMode switches between A and B, the exit animation collapses the DOM briefly before the new content enters. This causes a layout shift.

**Fix**: Add `min-h-[80vh]` to the AnimatePresence wrapper div to prevent collapse during transitions.

---

## Summary of Changes

| File | Change | CLS Impact |
|------|--------|-----------|
| `supabase/functions/_shared/adminAuth.ts` | `?? null` cast on line 222 | Build fix |
| `supabase/functions/process-webhook/index.ts` | Widen `supabase` param types | Build fix |
| `index.html` | Remove Google Fonts `<link>` (lines 22-26) | HIGH — eliminates double font load |
| `index.css` (root) | Delete or empty the file | Cleanup |
| `src/components/AuditHero.tsx` | Add `width={384} height={512}` to mascot img | HIGH — reserves layout space |
| `src/pages/Index.tsx` | Add `min-h-[80vh]` wrapper around AnimatePresence hero | MEDIUM — prevents collapse on flow switch |

**Not changed** (already stable): LazySection, ScamConcernImage, StoryImageCrossfade, PageLoader/Suspense, InteractiveDemoScan.

