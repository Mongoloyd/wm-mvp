

# Plan: Bigger Mascot + Floating Bob Animation

## Changes to `src/components/AuditHero.tsx`

### 1. Bigger mascot
- Mobile: `max-w-sm` → `max-w-md` (448px max)
- Desktop: `md:w-64 lg:w-96` → `md:w-80 lg:w-[480px]`

### 2. Floating bob animation
Wrap the mascot `img` in a `motion.div` with a gentle vertical bob:
```
animate={{ y: [-8, 0, -8] }}
transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
```

Keep the surrounding `div` as-is (plain `div`, `z-20`, `pointer-events-none`). Only the inner image gets the motion wrapper.

### 3. No other changes
Background, GradeCard z-index, layout order, and all other reference styling stays exactly as-is.

## File modified
| File | Change |
|------|--------|
| `src/components/AuditHero.tsx` | Increase mascot size classes, wrap img in motion.div with bob animation |

