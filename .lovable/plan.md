

## Plan: Upgrade ProcessSteps to Skeuomorphic 3D Style

### What changes

**Step timeline cards (5 cards on the left):**
- Add the `.card-raised` class (already in the design system) for the base 3D surface
- Add a white `inset 0 1px 0 0 rgba(255,255,255,0.7)` top-edge highlight
- Increase hover lift from `-0.5` to `-6px` with a dramatic shadow bloom: `0 24px 48px rgba(0,0,0,0.12)`
- Add `transition-all duration-300` for smooth spring-like motion

**Step number circles:**
- Make them convex: add `box-shadow: inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -1px 2px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.1)`
- Use `bg-gradient-to-b from-white to-[#F8FAFC]` for a subtle dome effect

**Sticky "You'll walk away knowing" card:**
- Wrap in the 3-ring graduated depth border pattern (outer ring 0.5 opacity, middle 0.3, inner 0.15)
- Add convex top-edge highlight
- Deeper cast shadow: `0 20px 60px rgba(0,0,0,0.10)`

**Takeaway icon circles:**
- Same convex treatment as step numbers -- inset highlight top, inset shadow bottom

**"A-F" badge and "Includes" chips:**
- Add inset top highlight and subtle bottom shadow for embossed/convex look

**Hover on sticky card takeaway items:**
- Subtle scale(1.02) + shadow increase on hover for each list item

### Files touched
1. `src/components/ProcessSteps.tsx` -- all changes are within this single file

### What stays the same
- Component name `ProcessSteps`
- Props interface
- Content (steps, takeaways, copy)
- Two-column layout structure
- No global token or font changes

