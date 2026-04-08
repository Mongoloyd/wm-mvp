

# Fix: WindowMan Mascot Size & Position — Converge on Grade Card

## What's Wrong Now

**Desktop (1464px):**
- WindowMan and the GradeCard are stacked vertically in a single column (`flex-col`), but they are **separate, disconnected blocks** — the mascot sits above, then the card sits below with no overlap
- WindowMan's bottom is cut off at the waist area; the card starts well below him
- His head is roughly level with "READ THE FINE PRINT" — below the headline top. It should be **above** the "QUOTE INTELLIGENCE ENGINE" pill
- Size is capped at `max-w-sm` (384px) on mobile, `w-64` (256px) on md, `w-96` (384px) on lg — the md breakpoint makes him too small on typical desktops

**Mobile (390px):**
- WindowMan fills most of the screen (`max-w-sm` = nearly full width) — this is okay for presence but pushes content way down
- The GradeCard is `hidden md:block` — **completely invisible on mobile**
- He's floating alone with no visual anchor (no card behind/below him)

## Root Causes (Lines 102-129 of AuditHero.tsx)

1. **No overlap/convergence**: Mascot container (z-20) and GradeCard container (z-10) are siblings in a `flex-col`, so they stack with natural flow spacing — no negative margin or absolute positioning to create overlap
2. **GradeCard hidden on mobile**: `hidden md:block` (line 120) removes it entirely on small screens
3. **md size too small**: `md:w-64` = 256px makes WindowMan shrink dramatically at the md breakpoint (768-1023px)
4. **No top padding control**: `pt-0 md:pt-16` means on mobile he starts right at the top with no room; on desktop the 64px padding pushes him down relative to the headline
5. **Head position**: The right column starts at the same vertical position as the left column. With `md:pt-16` (64px padding), his head starts ~64px below the headline top. He needs to start higher (less or zero top padding) so his head clears the headline's horizontal plane

## The Fix

### Approach: Absolute-position the mascot over the GradeCard to create "hovering above and behind" convergence

**File: `src/components/AuditHero.tsx` (lines 102-129)**

1. **Make the right column a positioned container** — `relative` so we can layer the mascot
2. **GradeCard becomes the anchor** — stays in normal flow, visible on both mobile and desktop
3. **Mascot becomes absolutely positioned** — placed above and behind the GradeCard using `absolute bottom-[60%] left-1/2 -translate-x-1/2` (or similar), with `z-10` behind the card's `z-20`
4. **Increase mascot size**: Remove the restrictive `md:w-64`, use `w-[280px] md:w-[340px] lg:w-[420px]` — bigger at every breakpoint
5. **Show GradeCard on mobile**: Remove `hidden md:block`, add a smaller mobile variant or scale it down
6. **Adjust right column top padding**: Reduce `md:pt-16` to `md:pt-8` or `pt-0` so his head rises above the headline plane

### Resulting visual hierarchy:
```text
Desktop:                          Mobile:
                                  
  [headline]    [mascot head]     [pill]
  [headline]    [mascot torso]    [mascot head+torso]
  [subtext ]    [===CARD====]     [====CARD====]
  [  CTAs  ]    [===CARD====]     [headline...]
                [===CARD====]     [CTAs]
```

WindowMan's body overlaps the top of the GradeCard, creating the "hovering above and behind" convergence. His head sits above the horizontal plane of the headline.

### Specific CSS changes:
- Right column wrapper: `relative` + enough height to contain both
- Mascot `<div>`: `absolute` positioning, `bottom-[55%]` or negative margin overlap, `z-10`
- GradeCard `<div>`: `relative z-20`, remove `hidden` (show on mobile too, possibly scaled `scale-[0.85]` on mobile)
- Mascot image classes: `w-[280px] md:w-[340px] lg:w-[420px]` (bigger across all breakpoints)
- Right column: `pt-0 md:pt-8` (raise everything up so head clears headline)

