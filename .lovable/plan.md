

## System Font Reset and Casing Lockdown

### 1. Update font tokens in `src/index.css` (line 150-153)

Replace the `--wm-font-display` and `--wm-font-body` CSS custom properties with the system UI stack:

```
--wm-font-display: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
--wm-font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
```

### 2. Update font families in `tailwind.config.ts` (lines 16-21)

Replace Barlow Condensed and DM Sans references with the system UI stack:

```
sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
heading: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
display: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
body: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
```

Mono stays as-is (`DM Mono`).

### 3. Remove forced casing from utility classes in `src/index.css`

**`.wm-eyebrow`** (line 412-418): Delete `text-transform: uppercase;` -- keep font-family, size, weight, letter-spacing.

**`.wm-title-section`** (line 420-427): Delete `text-transform: uppercase;` -- keep font-family, weight, letter-spacing, line-height, color.

No `.wm-title-report` exists, so nothing to change there.

### 4. Fix ProcessSteps heading in `src/components/ProcessSteps.tsx`

**Line 83**: Change text from `What happens when you scan` to `What Happens When You Scan`

**Line 86-87**: Change from `Upload your quote. In under 60 seconds, you'll know exactly where you stand — before you sign.` to `Upload Your Quote. In Under 60 Seconds, You'll Know Exactly Where You Stand — Before You Sign.`

### What stays untouched
- All `@font-face` declarations (kept for fallback, won't load if not referenced)
- DM Mono font stack
- All shadow tokens, color tokens, layout classes
- Component structure, props, functionality
- No new files created

