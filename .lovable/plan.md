

## Fix Missing WindowMan Image

### Problem
The file has a double extension (`windowman-evaluates.avif.avif`) but the code references `windowman-evaluates.avif`. The image doesn't load.

### Changes

1. **Rename file**: `public/windowman-evaluates.avif.avif` → `public/windowman-evaluates.avif`
2. **No code change needed**: `src/components/TruthReportClassic.tsx` already references `/windowman-evaluates.avif` (line 1291), which will match the corrected filename.
3. **Verify**: Confirm the image renders on the Truth Report page.

