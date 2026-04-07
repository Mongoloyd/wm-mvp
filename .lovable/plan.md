

# Fix Font Swap Flash (FOUT)

## What's Happening

All fonts (Barlow Condensed, DM Sans, DM Mono) are loaded via `@fontsource` packages imported in `main.tsx`. These imports generate `@font-face` rules with **`font-display: swap`**, which is the default for @fontsource.

`swap` tells the browser: "Render text immediately with a fallback system font, then swap to the custom font once it loads." This causes the visible flash you're seeing — text appears in a system sans-serif, then jumps to Barlow Condensed / DM Sans once the woff2 files finish downloading.

The font files are bundled by Vite into the CSS output, but they're still separate HTTP requests that load after the initial HTML/CSS parse. On slower connections or cold cache, this swap is very noticeable.

There's also dead code in `index.html` — `.font-loading` / `.fonts-loaded` CSS classes that are never actually toggled by any JavaScript.

## Plan

### 1. Switch critical fonts to `font-display: optional`

Instead of importing the default `@fontsource` CSS (which hardcodes `swap`), write custom `@font-face` declarations in `index.css` that use `font-display: optional`. This tells the browser: "If the font isn't ready within ~100ms, skip it for this page load and use it on the next navigation." This completely eliminates the visible swap at the cost of occasionally showing the fallback on very first visits.

The font file URLs will reference the same `@fontsource` woff2 files bundled by Vite.

**Files:** `src/index.css` — add custom `@font-face` blocks for the 3 critical weights (Barlow Condensed 700/800/900, DM Sans 400/500/600/700, DM Mono 500).

### 2. Remove `@fontsource` imports from `main.tsx`

Since we'll define our own `@font-face` rules, remove all the `import "@fontsource/..."` lines from `main.tsx` to prevent duplicate declarations.

**Files:** `src/main.tsx` — remove 9 font import lines.

### 3. Preload the two most critical font files

Add `<link rel="preload">` tags in `index.html` for:
- `barlow-condensed-latin-700-normal.woff2` (headings)
- `dm-sans-latin-400-normal.woff2` (body text)

These are the fonts that render above the fold. Preloading ensures the browser starts fetching them as soon as it parses `<head>`, before it even encounters the `@font-face` rule. Combined with `optional`, this makes the font available within the 100ms window on most connections.

**Files:** `index.html` — add 2 `<link rel="preload" as="font">` tags.

### 4. Add a tuned fallback font stack with `size-adjust`

In `index.css`, define local fallback `@font-face` entries using `size-adjust`, `ascent-override`, and `descent-override` to match the metrics of Barlow Condensed and DM Sans. This minimizes layout shift even if the fallback renders briefly.

**Files:** `src/index.css` — add 2 adjusted fallback `@font-face` blocks.

### 5. Clean up dead font-loading CSS

Remove the unused `.font-loading` / `.fonts-loaded` styles from `index.html` since no JS ever toggles them.

**Files:** `index.html` — remove 3 CSS lines.

## Files Changed
- `index.html` — add 2 font preloads, remove dead CSS
- `src/main.tsx` — remove 9 `@fontsource` imports  
- `src/index.css` — add custom `@font-face` with `optional` + metric-adjusted fallbacks

## Expected Impact
- Zero visible font swap on warm cache (most visits)
- Near-zero swap on cold cache (preload completes within 100ms window)
- Eliminates the "text jumps" CLS contribution from font loading

