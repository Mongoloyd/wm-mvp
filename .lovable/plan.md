

## What You Want (Plain English)

You want the sticky "Scan My Quote / View Live Demo" bar that appears at the bottom of your homepage to also appear on four subpages: **About**, **Contact**, **Terms**, and **Privacy**. The buttons should navigate users back to the homepage (since the scan/demo functionality lives there), and the page content needs enough bottom padding so the sticky bar doesn't cover anything.

---

## Implementation Plan

### 1. Add StickyCTAFooter to each page

Import and render `<StickyCTAFooter>` at the bottom of these four page components:
- `src/pages/About.tsx`
- `src/pages/Contact.tsx`
- `src/pages/Terms.tsx`
- `src/pages/Privacy.tsx`

Each will use `useNavigate()` from react-router-dom for the click handlers:
- **onScanClick**: `navigate("/?action=scan")` — navigates home with a query param the homepage can detect
- **onDemoClick**: `navigate("/?action=demo")` — same pattern for the demo trigger
- **onPostConversionClick**: `window.location.href = 'tel:+15614685571'` (same as homepage)
- **isVisible**: `true` (always visible on subpages since there's no recovery bar)
- **conversionType**: `null` (default pre-conversion state)

### 2. Add bottom padding to prevent content overlap

Add `pb-32` (or similar ~128px) to the outermost `<main>` wrapper of each page so the sticky footer doesn't cover the last section of content.

### 3. Files changed

| File | Change |
|------|--------|
| `src/pages/About.tsx` | Import StickyCTAFooter + useNavigate, add component + bottom padding |
| `src/pages/Contact.tsx` | Same |
| `src/pages/Terms.tsx` | Same |
| `src/pages/Privacy.tsx` | Same |

No changes to `StickyCTAFooter.tsx` itself — the existing component works as-is.

