

## Plan: Fix Truth Report Formatting for Mobile Left-Alignment

The issue is that the pillar scores, flags, and labels aren't cleanly left-aligned on mobile. The current layout uses `flex items-center` which centers things, and the pillar section uses inline flex rows that can feel cramped on small screens.

### Changes to `src/components/arbitrageengine.tsx`

**1. Pillar bars section (lines 563-574)** — Make labels and scores stack better on mobile:
- Change pillar rows from single-line flex to a two-row layout on mobile: label+score on top, bar below
- On `sm:` and up, keep the current horizontal layout
- Ensure all text is `text-left`

**2. Red Flags list (lines 577-588)** — Already has `text-left` on items. Add `text-left` to the heading too.

**3. Amber/Warnings list (lines 590-602)** — Add `text-left` to list items (currently missing, unlike red flags).

**4. Grade badge section (lines 554-560)** — Keep centered (it's the focal point).

**5. Outer card (line 550)** — Add `text-left` to the card container so all children default to left-alignment.

### Specific edits

- Line 550: Add `text-left` to the card div
- Lines 564-573: Wrap each pillar in a responsive layout — on mobile, show label on one line and bar+score below; on `sm:` keep current inline layout
- Line 597: Add `text-left` to amber flag `li` items (matching red flags fix)

