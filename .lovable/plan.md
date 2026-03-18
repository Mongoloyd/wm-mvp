

## Mobile Button Width Fix — Inline Padding Cleanup

### File 1: `src/components/AuditHero.tsx`

**Gold button (lines 115-127):**
- Delete `padding: "16px 32px"` from the `style={{...}}` object
- Update className to: `"w-full sm:w-auto whitespace-nowrap py-4 px-6 sm:px-8 hover:shadow-lg transition-shadow"`

**Button wrapper (line 110):**
- Change `w-full sm:w-auto` → `w-full` (container always fills parent)

**Ghost button wrapper (line 139):**
- Keep `w-full sm:w-auto` on the wrapper div

**Ghost button (line 144):**
- Change `px-6 py-3.5` → `py-3.5 px-4 sm:px-6`
- Ensure `w-full sm:w-auto` remains on the `motion.button`

### File 2: `src/components/PowerToolDemo.tsx`

**PowerToolButton (line 25):**
- Delete `padding: "16px 32px"` from the inline `style={{...}}` object
- Add to className: `"w-full sm:w-auto py-4 px-6 sm:px-8"`

### Summary

| File | Change |
|------|--------|
| `src/components/AuditHero.tsx` | Remove inline padding from Gold button, add `py-4 px-6 sm:px-8`; wrapper to `w-full`; Ghost button to `py-3.5 px-4 sm:px-6` |
| `src/components/PowerToolDemo.tsx` | Remove inline padding from Teal button, add `py-4 px-6 sm:px-8` via className |

