

## Plan: Wire "Scan Your Estimate" Button to Upload Zone

### What This Does (Plain English)
When someone clicks the big "Scan Your Estimate" button at the bottom of the Orange Scanner section, instead of seeing a useless browser alert, the page will smoothly glide down to the upload area where they can drop their quote file. It connects the call-to-action to the actual next step.

### Changes

**File 1: `src/pages/Index.tsx`**
- Add `id="upload-zone"` to the `<UploadZone>` component's wrapper (or directly as a prop/wrapping div) so it can be targeted by scroll.

**File 2: `src/components/OrangeScanner.tsx`** (lines 282-286)
- Replace the `console.log` + `alert()` inside the button's `onClick` with:
  ```ts
  document.getElementById('upload-zone')?.scrollIntoView({ behavior: 'smooth' });
  ```

### Files Modified
1. `src/components/OrangeScanner.tsx` — replace alert with smooth scroll
2. `src/pages/Index.tsx` — add `id="upload-zone"` wrapper around UploadZone

