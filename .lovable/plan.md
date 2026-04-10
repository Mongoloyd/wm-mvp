

## Plan: Change All Scan/Upload CTA Buttons to Orange

### What
Every CTA button across the site that triggers the quote scan/upload flow currently uses `btn-depth-primary` (blue). Change them all to `btn-depth-destructive` (orange) to match the hero CTA style. No behavior changes.

### Buttons to change (`btn-depth-primary` → `btn-depth-destructive`)

| File | Line | Button Text |
|------|------|-------------|
| `src/components/IndustryTruth.tsx` | 138 | "Scan My Quote — It's Free" |
| `src/components/NarrativeProof.tsx` | 72 | "Show Me My Grade →" |
| `src/components/ClosingManifesto.tsx` | 81 | "Scan My Quote — It's Free" |
| `src/components/Testimonials.tsx` | 258 | "Show Me My Grade →" |
| `src/components/InteractiveDemoScan.tsx` | 446 | "Upload My Real Quote — It's Free →" |
| `src/components/InteractiveDemoScan.tsx` | 461 | "Want to See YOUR Quote Graded? →" |
| `src/components/StickyCTAFooter.tsx` | 69 | "Scan My Quote" |
| `src/components/ForensicChecklist.tsx` | 80 | "Upload My Quote for a Full Grade →" |

### What stays the same
- All button text, sizing, padding, behavior, and click handlers remain identical
- Non-scan buttons (e.g. QuoteWatcher reminder, MarketBaselineTool, AboutHero) stay blue — they serve different purposes

### Files touched
8 files, one class name swap each

