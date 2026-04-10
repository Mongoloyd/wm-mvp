

## Plan: Add XRayScannerBackground Behind ProcessSteps Section

### What
Wrap the `ProcessSteps` component (the "How It Works" section) with the uploaded `XRayScannerBackground` component. This creates a scroll-triggered green scan bar effect with faintly scrolling contract line text behind the content. The X-ray zone starts right after the `UploadZone` and ends after `ProcessSteps`.

### Changes

**1. Create `src/components/XRayScannerBackground.tsx`**
- Copy the uploaded component file into the project
- No modifications needed — it's self-contained with scroll tracking, reduced-motion support, and inline keyframe styles

**2. Edit `src/pages/Index.tsx`**
- Import `XRayScannerBackground`
- Wrap `ProcessSteps` (lines 252-258) with `<XRayScannerBackground>...</XRayScannerBackground>`
- The second `SocialProofStrip` (lines 259-261) stays outside the wrapper

### Result
- Desktop: faint contract fee text scrolls horizontally behind the ProcessSteps cards; a green scan bar moves up/down as the user scrolls; red flag markers flash as the bar passes them
- Mobile: reduced-motion respected; background layers hidden on mobile (`hidden md:block`)
- All existing content renders unchanged on top (`relative z-10`)

### Files touched
1. `src/components/XRayScannerBackground.tsx` — new file (from upload)
2. `src/pages/Index.tsx` — wrap ProcessSteps with XRayScannerBackground

