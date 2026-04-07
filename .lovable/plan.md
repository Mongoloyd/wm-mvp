

# Fix FOUT and CSS Performance Issues

## Problem Summary
Lighthouse mobile performance is 74, with render-blocking font requests and unsized images causing FCP (3.8s), LCP (4.1s), and CLS issues.

## Root Causes
1. **Render-blocking Google Fonts request (751ms)**: A `fonts.googleapis.com` stylesheet for Barlow Condensed is being loaded despite all fonts already being bundled locally via `@fontsource`. The preconnect hints in `index.html` suggest an external dependency that no longer exists.
2. **Unused preconnects**: `fonts.gstatic.com`, `connect.facebook.net`, and `www.facebook.com` preconnects waste connection setup time on origins that aren't used on page load.
3. **Unsized images**: The hero mascot in `AuditHero.tsx` and the WindowMan image in `MarketMakerManifesto.tsx` lack explicit dimensions that browsers can use to reserve layout space, causing CLS.
4. **LCP resource load delay (2.97s)**: The LCP image (mascot from CloudFront CDN) has a 3-second resource load delay because the browser doesn't discover it until after JS executes. A `<link rel="preload">` in `index.html` would let the browser start fetching immediately.

## Plan

### 1. Remove stale Google Fonts artifacts from `index.html`
- Remove the `<link rel="preconnect" href="https://fonts.googleapis.com" />` line
- Remove the `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />` line
- Remove the `<link rel="preconnect" href="https://connect.facebook.net" />` line
- Remove the `<link rel="preconnect" href="https://www.facebook.com" />` line
- These origins are unused on initial page load; fonts are bundled via @fontsource and Facebook pixel isn't loaded synchronously

### 2. Preload the LCP hero image in `index.html`
- Add `<link rel="preload" as="image" href="https://d2xsxph8kpxj0f.cloudfront.net/87108037/YjBTWCdi7jZwa5GFcxbLnp/windowmanwithtruthreportonthephone_be309c26.avif" type="image/avif" />` to `<head>`
- Add `<link rel="preconnect" href="https://d2xsxph8kpxj0f.cloudfront.net" />` to establish connection early
- This eliminates the 2.97s resource load delay identified by Lighthouse

### 3. Add explicit dimensions to unsized images
- **`src/components/MarketMakerManifesto.tsx`** (line 69): Add `width={260} height={260}` to the WindowMan superhero `<img>` tag
- **`src/components/AuditHero.tsx`** (line 106-113): Already has `width={384} height={512}` — add inline `style={{ aspectRatio: '3/4' }}` to ensure the browser reserves space even when CSS classes resize the element

### Files Changed
- `index.html` — remove 4 unused preconnects, add 1 preconnect + 1 preload for LCP image
- `src/components/AuditHero.tsx` — add aspect-ratio style for layout stability
- `src/components/MarketMakerManifesto.tsx` — add width/height to unsized image

### Expected Impact
- FCP improvement: ~750ms (eliminating render-blocking Google Fonts request)
- LCP improvement: ~2.5s (preloading hero image)
- CLS improvement: eliminates layout shift from unsized images
- Estimated mobile performance score: 85-90+ (up from 74)

