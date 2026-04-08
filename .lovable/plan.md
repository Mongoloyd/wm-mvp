

# Plan: Revert AuditHero to Match Remix Reference Styling

## Key Differences Found

Comparing current `AuditHero.tsx` against the Remix reference, the current version has several deviations:

| Area | Current (wrong) | Remix reference (correct) |
|------|-----------------|---------------------------|
| Background | Parallax image + frosted glass overlay + film grain | Simple CSS gradient: `linear-gradient(168deg, ...)` |
| Section | `overflow-hidden` | No overflow-hidden |
| Mascot | `motion.div` with bob animation, `width={480}`, `height={640}`, `aspectRatio: '3/4'`, `max-w-md md:w-80 lg:w-[480px]` | Plain `div`, no animation, `max-w-sm md:w-64 lg:w-96` |
| GradeCard | `z-30`, negative margin overlap (`mt-[-40px] md:mt-[-60px]`) | `z-10` (behind mascot), no negative margin |
| Subheadline `<p>` | Has `text-xl` class | No `text-xl` class |
| Flow B button | Missing "We Can Arm You 1st →" line | Has the second line |
| TrustBullets | Inside the `mt-2` wrapper div | Outside, as sibling |
| Imports | `useEffect`, `useRef`, `heroBg` asset | No useEffect/useRef, no heroBg |

## Changes to `src/components/AuditHero.tsx`

1. **Remove** parallax imports (`useEffect`, `useRef`, `heroBg`)
2. **Remove** parallax ref, scroll listener effect, background image div, frosted glass overlay, and film grain overlay
3. **Replace** section className with `relative bg-background` + inline gradient style
4. **Revert mascot** to plain `div` (no `motion.div`, no bob animation), sizing `max-w-sm md:w-64 lg:w-96`, remove explicit width/height/aspectRatio attributes
5. **Revert GradeCard** z-index to `z-10`, remove negative margin
6. **Remove** `text-xl` from subheadline `<p>`
7. **Restore** "We Can Arm You 1st →" span on Flow B button
8. **Move** `<TrustBullets />` outside the `mt-2` div wrapper

Essentially: replace the entire component with the Remix version verbatim, since the structure, props, and interface are identical.

## Files Modified

| File | Change |
|------|--------|
| `src/components/AuditHero.tsx` | Replace with Remix reference version |

