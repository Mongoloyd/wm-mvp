

## Plan: Reposition X-Ray Scanner Text Rows Behind the Interactive Demo Card

### Understanding
The 6 scrolling text rows currently start too high (at `top: 120px`), causing them to appear behind the section titles ("Live Demo", "See the AI at Work", "This runs automatically"). You want the rows to only scroll behind the interactive scan card area — the auto-running demo that shows grades, flags, and the "Upload My Real Quote" CTA.

### Changes

**`src/components/XRayScannerBackground.tsx`**

1. Increase the top offset from `120px` to approximately `280px` (or use a percentage like `35%`) so the text rows begin at the top edge of the interactive demo card, not behind the header text
2. Keep 6 `rowConfigs` entries — no change to row count
3. Tighten row spacing slightly so all 6 rows fit within the vertical bounds of the demo card area

### Files touched
1. `src/components/XRayScannerBackground.tsx` — adjust the text layer's `top` offset

