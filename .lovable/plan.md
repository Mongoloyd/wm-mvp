

## Plan: Cinematic X-Ray Scanner Background

### Problem
The current XRayScannerBackground is invisible because:
1. `--success` CSS variable is undefined -- the green scan bar renders as nothing
2. Text opacity is 3% -- practically invisible
3. `shadow-glow-success` / `shadow-glow-destructive` Tailwind classes don't exist
4. Only 2 rows of scrolling text -- not enough density

### Changes

**1. `src/index.css`** -- Add `--success` CSS variable
- Add `--success: 142 100% 50%;` (neon green) to both light and dark theme blocks
- Add `--success-foreground` for completeness

**2. `src/components/XRayScannerBackground.tsx`** -- Full visual overhaul

- **Text density**: Increase from 2 rows to 10 rows of scrolling contract text at staggered speeds (40s, 50s, 55s, 65s, etc.) with varying animation delays
- **Text opacity**: Bump from `opacity-[0.03]` to `opacity-[0.12]` -- visible but still background-level; light and tasteful
- **Scan bar height**: Increase from `h-24` to `h-48` (not the full `h-64` to keep it elegant)
- **Bloom glow**: Replace the single `boxShadow` with a stacked multi-layer bloom effect using inline styles:
  ```
  boxShadow: '0 0 30px rgba(74,222,128,0.3), 0 0 60px rgba(74,222,128,0.2), 0 0 120px rgba(74,222,128,0.1)'
  ```
- **Scan line**: Replace missing `shadow-glow-success` class with inline `style={{ boxShadow }}` on the center line
- **Pulse**: Add a subtle pulse keyframe to the scan bar wrapper via the inline `<style>` block
- **Red flags**: Use inline `boxShadow` instead of missing `shadow-glow-destructive`; increase brightness when the scan bar passes (full opacity flash with a brighter glow)
- **All green colors**: Use hardcoded `rgba(74,222,128,...)` as the primary value alongside the CSS variable fallback so it always renders

### Visual result
A light, elegant scanner effect: faint scrolling contract text creates texture behind the "How It Works" cards, a soft green glow sweeps down as you scroll, and red flag pills flash when the green bar reaches them. Visible and polished but not overwhelming on the white background.

### Files touched
1. `src/index.css` -- add `--success` variable
2. `src/components/XRayScannerBackground.tsx` -- full visual overhaul

