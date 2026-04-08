

# Plan: ScanTheatrics Visual Contrast & Font Size Pass

Style-only edits to `src/components/ScanTheatrics.tsx`. No structural, data, or component changes.

## 1. Color Replacements (global find/replace within file)

| Old | New | Context |
|---|---|---|
| `#2563EB` | `#60A5FA` | Blues — markers, pillar accents, scan line, progress bar, OcrQualityBadge |
| `#F97316` | `#FB923C` | Oranges — markers, pillar accents, cliffhanger text, terminal active line, progress bar |
| `#DC2626` | `#F87171` | Reds — grade palette D, pillar fail, pulsar rings/dots, FindingsCounter |

Affected areas:
- `GRADE_COLORS` (lines 15-16): C and D entries
- `FORENSIC_MARKERS` (lines 55-61): 7 marker color values
- `CANONICAL_PILLAR_DEFS` (lines 80-111): 5 accentColor values
- `pillarStatusColor` (lines 123-126): warn and fail returns
- Cliffhanger text (line 521): orange color
- Terminal active step (lines 946-955): orange color references
- Progress bar gradient (line 973)
- Scan line gradient (line 757)
- `FlagPulsar` (lines 1006, 1048, 1059): red border/bg/text
- `FindingsCounter` (line 1256): red text
- `OcrQualityBadge` (line 1284): blue reference

## 2. Font Size Bumps

| Old | New | Locations |
|---|---|---|
| `fontSize: 10` | `fontSize: 12` | ~12 instances: eyebrow labels, proof-of-read chips, FindingsCounter, OcrQualityBadge |
| `fontSize: 11` | `fontSize: 13` | ~5 instances: cliffhanger message, terminal log lines, "ANALYSIS COMPLETE" text |

## 3. Terminal Text Color Lightening

| Old | New | Location |
|---|---|---|
| `color: "#2D3748"` | `color: "#D1D5DB"` | Completed terminal log lines (line 931) |
| `color: "#374151"` | `color: "#D1D5DB"` | Terminal titlebar text (line 912), pillar header text (lines 548, 1138) — where on dark bg |

Note: `#374151` used in `pillarStatusColor` default case and DocumentSilhouette "DOCUMENT X-RAY" label — these also get lightened to `#D1D5DB` since they sit on dark backgrounds.

## No Other Changes
- No mock data added
- No new components
- No structural/logic changes
- Only inline style values modified

