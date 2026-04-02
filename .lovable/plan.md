

# Apply Graduated Border + Float to Badge Elements Sitewide

## Summary
Add the SocialProofStrip's 3-ring graduated border and subtle float animation to badge/chip elements across the site. Their existing colors stay the same — only their depth and dimensionality change.

## Target Elements

### 1. CriticalFlagCard — Severity Badge (`CRITICAL FLAG` / `HIGH FLAG`)
**File**: `src/components/CriticalFlagCard.tsx` (lines 119-134)

Currently a flat `<span>` with 1px border. Wrap it in a 3-ring nested div structure where each ring uses the badge's own severity color at decreasing opacity:
- Outer ring: `hsl(var(${cssVar}) / 0.5)`
- Middle ring: `hsl(var(${cssVar}) / 0.3)`
- Inner ring: `hsl(var(${cssVar}) / 0.15)`
- Core: existing background (`hsl(var(${cssVar}) / 0.08)`)

Add subtle float via `motion.div` wrapper: `y: [0, -1, 0, 1, 0]` over 5s, only on `isTopRanked` badges. Add uniform soft shadow: `0 1px 4px hsla(0 0% 0% / 0.08)`.

### 2. CriticalFlagCard — Pillar Badge (`Safety & Code`, etc.)
**File**: `src/components/CriticalFlagCard.tsx` (lines 135-147)

Currently a flat `bg-secondary` span. Wrap in 3-ring structure using neutral border tones (same as SocialProofStrip):
- Outer: `hsl(214 25% 75%)`
- Middle: `hsl(214 22% 83%)`
- Inner: `hsl(214 18% 90%)`
- Core: existing `bg-secondary`

No float animation (too small/subtle). Just the graduated border for depth.

### 3. TopViolationSummaryStrip — Impact Chip
**File**: `src/components/TopViolationSummaryStrip.tsx` (lines 94-111)

Currently a flat span with `accentBorder`. Wrap in 3-ring structure using accent color at decreasing opacity:
- Outer: `${accentColor}` at 0.45 opacity
- Middle: at 0.25
- Inner: at 0.12
- Core: existing `accentBg`

Add subtle float: `y: [0, -1, 0, 1, 0]` over 6s infinite.

### 4. VerifyBanner — Lock Badge Label
**File**: `src/components/TruthReportFindings/VerifyBanner.tsx` (lines 27-31)

The `YOUR FULL REPORT IS READY` label line. Wrap the lock icon + text span in a small graduated-border pill using gold tones:
- Outer: `hsl(38 72% 53% / 0.5)`
- Middle: `hsl(38 72% 53% / 0.3)`
- Inner: `hsl(38 72% 53% / 0.15)`
- Core: `hsl(38 72% 53% / 0.06)`

Add subtle float: `y: [0, -1, 0, 1, 0]` over 6s.

## Pattern
Each graduated badge follows the same nesting structure:
```text
<outer ring 1px pad, darkest accent>
  <middle ring 1px pad, medium accent>
    <inner ring 1px pad, lightest accent>
      <core content — existing colors preserved>
    </inner>
  </middle>
</outer>
```

Border radius decreases by 1px per ring (e.g., 7px → 6px → 5px → 4px) to stay concentric. Uniform soft `boxShadow` on the outer ring only. Float animation is optional per element (only on prominent badges).

## Files Changed
- `src/components/CriticalFlagCard.tsx` — severity badge + pillar badge
- `src/components/TopViolationSummaryStrip.tsx` — impact chip
- `src/components/TruthReportFindings/VerifyBanner.tsx` — lock badge

## What Does NOT Change
- Badge text content
- Badge colors (danger red, caution gold, primary cobalt, etc.)
- Parent card layouts or spacing
- SocialProofStrip (already done)

