

# Upload Zone "Window Frame" Redesign — 4 Options

## Reference Analysis
The uploaded image shows an impact window pane: pure white thick frame with generous rounded corners, frosted/reflective glass interior, soft ambient shadow separating it from background. The goal is to make the dropzone inside UploadZone feel like a literal window — premium, physical, tactile.

## Current State
The dropzone uses `.input-well` (sunken gradient background, 1px border, `--shadow-sunken`). It reads as a form field, not a window. The outer card uses `.card-raised`.

## Design System Constraints
- Shadows: vertical-only (no x-offset), use existing shadow vars or define new ones inline
- Radius: `--radius-card` (12px), `--radius-btn` (8px), `--radius-input` (7px)
- Colors: semantic tokens only, no raw hex in components
- The dropzone sits inside a `.card-raised` container

---

## Option A — "Thick White Frame" (Closest to Reference)

The most literal interpretation. A thick pure-white border creates a physical window frame around the drop area.

**Implementation:**
- Remove `input-well` class from dropzone
- Replace with a wrapper structure: outer `div` with 6px solid white border, `border-radius: 14px`, and a multi-layer shadow (inset top highlight + outer ambient drop shadow)
- Inner area: subtle cool-gray gradient background (`#F4F6F9` → `#EAEFF5`) to simulate frosted glass
- Two faint diagonal pseudo-element gradients (white at 5-8% opacity) crossing top-left to bottom-right for glass reflections
- Shadow: `0 8px 22px rgba(10,25,55,0.12), 0 2px 4px rgba(10,25,55,0.06)` plus `inset 0 1px 0 rgba(255,255,255,0.9)` on the frame
- Hover: shadow lifts to `y:4px blur:28px`, `translateY(-2px)`, inner gloss brightens
- Drag-over: border transitions to cobalt primary color

**Pros:** Most "window-like." High-end feel. Strong visual metaphor for the product.
**Cons:** Thick border is unusual for web — bold choice.

---

## Option B — "Double-Ring Bevel" (3D Depth Frame)

A concentric double-border creates the illusion of a thick beveled window frame using the existing graduated-depth pattern from the design system.

**Implementation:**
- Outer ring: 3px solid white border, `border-radius: 14px`, with `box-shadow: 0 6px 18px rgba(10,25,55,0.1)`
- Inner ring (1px inset): created with `box-shadow: inset 0 0 0 2px rgba(214,225,240,0.5)` — suggests frame thickness
- Background: frosted gradient same as Option A
- Top-left lighting: `inset 0 1px 0 rgba(255,255,255,0.95)` on outer, `inset 0 1px 2px rgba(10,25,55,0.06)` on inner for bevel
- Glass reflection: single `::after` pseudo with `linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%)`
- Hover: outer ring glows slightly, inner shadow deepens

**Pros:** More subtle than A. Fits the graduated-depth pattern already in use. Feels premium without being loud.
**Cons:** Less immediately "window-like" than A.

---

## Option C — "Frosted Glass Pane" (Glass-Forward)

Maximizes the glass metaphor. The frame is thin but the interior is the star — heavy frosted glass effect with visible reflections.

**Implementation:**
- Border: 2px solid white, `border-radius: 12px`
- Background: `linear-gradient(180deg, rgba(240,244,250,0.95) 0%, rgba(228,234,244,0.9) 100%)`
- Two glass reflection pseudo-elements: 
  - `::before` — large diagonal highlight top-left (white 8% opacity, 40% coverage)
  - `::after` — smaller secondary reflection bottom-right (white 4% opacity)
- Shadow: `0 4px 16px rgba(10,25,55,0.1), 0 1px 3px rgba(10,25,55,0.08), inset 0 1px 0 rgba(255,255,255,0.9)`
- Subtle inner bevel: `inset 0 -1px 2px rgba(10,25,55,0.04)` for bottom edge thickness
- Hover: reflections shift slightly (2px translate), shadow deepens
- Drag-over: glass brightens (background opacity increases)

**Pros:** Beautiful, photorealistic. The reflections sell the "glass" concept perfectly for a window company.
**Cons:** Multiple pseudo-elements add complexity. Reflections may look odd on very small screens.

---

## Option D — "Shadow-Cast Window" (Minimal Frame, Maximum Depth)

Relies almost entirely on shadow layering to create the illusion of a thick, physically present object floating above the surface. The frame itself is minimal.

**Implementation:**
- Border: 1px solid white (barely visible — the shadow does the work)
- Border-radius: 12px
- Background: clean white-to-slate gradient
- Shadow stack (5 layers):
  1. `inset 0 2px 0 rgba(255,255,255,1)` — top edge catch light
  2. `inset 0 -1px 2px rgba(10,25,55,0.04)` — bottom edge thickness
  3. `0 1px 2px rgba(10,25,55,0.08)` — hard contact shadow
  4. `0 8px 24px rgba(10,25,55,0.12)` — structural shadow
  5. `0 20px 48px rgba(10,25,55,0.06)` — ambient halo
- Single glass reflection: `::after` diagonal gradient
- Hover: entire shadow stack intensifies, `translateY(-3px)` lift
- Focus: `0 0 0 3px rgba(255,255,255,0.8), 0 0 12px rgba(37,99,235,0.15)` white glow ring

**Pros:** Most sophisticated. Achieves depth without heavy borders. Cleanest on mobile. Best CRO — doesn't distract from the action.
**Cons:** Least literal "window" interpretation. Subtlety may be lost on some users.

---

## My Recommendation

**Option A** for maximum "wow" and brand metaphor alignment (you're literally selling windows — the upload zone IS a window). It's the boldest and most memorable. Option C is the runner-up if you want something more refined.

## Files to Change
- `src/index.css` — add new `.upload-window-frame` utility class (shadow + border + pseudo-elements)
- `src/components/UploadZone.tsx` — replace `input-well` on the dropzone div with the new class, add wrapper structure for the frame

## What Stays Untouched
- Outer `.card-raised` container
- All upload logic, file handling, scan invocation
- Button styling (`.btn-depth-primary`)
- Typography and copy

