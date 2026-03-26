

# Button 3D Depth Upgrade — Premium Tactile Polish

## What the reference image shows vs current state

The reference image shows buttons with:
- **Embossed/letterpress text** — the white text has visible depth via stronger `text-shadow` with both a dark underside shadow AND a subtle top highlight
- **Richer gradient contrast** — the blue button has a more dramatic light-to-dark gradient with a visible gloss band at the top
- **The orange CTA** has an almost "machined metal" quality — deep gradient, pronounced edge highlights
- **Heavier bottom shadow** — buttons appear to physically sit on the page

Current `.btn-depth-primary` has a single `text-shadow: 0 1px 2px rgba(0,0,0,0.25)` which gives minimal depth. The gradient is good but could be punchier. The buttons look "correct" but not "rich."

## The upgrade — 4 specific CSS changes

### 1. Richer text depth (biggest visual impact)

**File:** `src/index.css` — `.btn-depth-primary`

**Current:** `text-shadow: 0 1px 2px rgba(0,0,0,0.25);`

**New:** Multi-layer text-shadow that creates an embossed/letterpress effect:
```css
text-shadow:
  0 1px 0 rgba(255,255,255,0.12),   /* top highlight — simulates light catching the top edge of letterforms */
  0 -1px 0 rgba(0,0,0,0.08),        /* dark top edge — adds depth perception */
  0 2px 4px rgba(0,0,0,0.35),       /* primary drop shadow — deeper than current */
  0 4px 8px rgba(15,40,100,0.2);    /* ambient glow — makes text feel embedded in the button surface */
```

**Why:** This is the single highest-ROI change. The reference shows text that looks physically pressed into or raised from the button surface. Multi-layer text-shadow creates that "3D letterform" effect without any DOM changes.

### 2. Punchier gradient with visible gloss band

**Current gradient:** `linear-gradient(180deg, #5AADFF 0%, #2563EB 40%, #1D4ED8 80%, #1a44b8 100%)`

**New gradient:** Add a sharper gloss transition at the top 15% to create a "highlight shelf":
```css
background: linear-gradient(180deg,
  #6BB8FF 0%,      /* brighter gloss cap */
  #4A9BF5 12%,     /* sharp transition — creates visible "shelf" */
  #2563EB 40%,
  #1D4ED8 75%,
  #162FA0 100%);   /* darker floor — increases contrast range */
```

**Why:** The reference buttons have a visible gloss zone at the top ~15% of the surface. The current gradient is smooth/linear. Adding a brighter cap that drops sharply into the mid-tone creates the "polished dome" effect.

### 3. Stronger inner top highlight

**Current:** `inset 0 1px 0 rgba(255,255,255,0.22)`

**New:** Wider, softer top highlight that simulates a curved reflective surface:
```css
inset 0 1px 0 rgba(255,255,255,0.28),
inset 0 0 8px rgba(255,255,255,0.06),  /* soft inner glow — adds volume */
```

**Why:** The extra soft inner glow makes the button feel rounded/convex instead of flat, matching the "dome" quality in the reference.

### 4. Apply same treatment to hover and secondary button

- **Hover state** gets the same text-shadow and a slightly brighter gloss cap
- **`.btn-secondary-tactile`** gets a subtler version: `text-shadow: 0 1px 0 rgba(255,255,255,0.6)` (light emboss on the white surface)
- **Active/pressed** state keeps current flat treatment (pressed buttons lose their gloss — this is physically correct)

## Files changed

1. `src/index.css` — `.btn-depth-primary` (default, hover, active), `.btn-secondary-tactile`

No component files change. All buttons inherit the upgrade automatically via the shared class.

## What does NOT change

- Button sizes, padding, border-radius — all preserved
- Glint animation — preserved
- Component files — zero changes
- No new button types introduced
- Secondary button remains visually subordinate

## Risk

Very low. Pure CSS property changes on existing classes. Every button using `btn-depth-primary` gets the upgrade simultaneously. Easily reversible.

