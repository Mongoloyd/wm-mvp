

## Final Plan: Clean Up CTA Subtext & Add Reusable TrustBullets

### Step 1 — Create `src/components/TrustBullets.tsx`

```tsx
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const trustBullets = [
  "No account or credit card required",
  "256-bit encrypted & strictly confidential",
  "Results generated in under 60 seconds",
  "Your contractor is never notified",
];

export const TrustBullets = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.4 }}
    className="mt-6"
  >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 w-fit">
      {trustBullets.map((item) => (
        <div key={item} className="flex items-start gap-2">
          <Check size={16} className="shrink-0 mt-0.5 text-emerald-600" strokeWidth={2.5} />
          <span className="text-sm text-slate-500 font-medium">{item}</span>
        </div>
      ))}
    </div>
  </motion.div>
);
```

**Key correction**: No `flex justify-center` wrapper. The `mt-6` div contains the grid directly, so the bullets left-align naturally with the CTA buttons above them. On desktop the 2×2 grid anchors to the left edge of the column. On mobile it stacks single-column with `items-start` + `shrink-0 mt-0.5` preventing text from wrapping under the checkmark icon.

### Step 2 — Clean up `src/components/AuditHero.tsx`

| What | Lines | Action |
|------|-------|--------|
| `trustItems` array | 31 | Delete |
| `"No upload needed • Watch a live scan in 30 seconds"` | 162–164 | Delete |
| `"Generate Your Fair-Market Baseline..."` paragraph | 213–223 | Delete |
| `trustItems.map(...)` block | 225–236 | Delete |

Then:
- Add `import { TrustBullets } from "./TrustBullets";`
- Insert `<TrustBullets />` **after** the Flow B wrapper `</div>` (after line 224), as a direct child of the left-column `<motion.div>`. This places it below the entire button stack as a shared trust footer for all CTAs.

Resulting structure:
```text
<motion.div>                     ← Left column
  ...headline, subhead...
  <div> Primary CTA + PowerTool </div>
  <div> Flow B button           </div>
  <TrustBullets />               ← Shared trust footer, left-aligned
</motion.div>
```

### Step 3 — Clean up `src/components/PowerToolDemo.tsx`

- **Line 9**: Delete the `TrustFooter` component definition
- **Line 82**: Remove `<TrustFooter />` from the JSX (keep the rest of that return statement intact)

### Rendering Verification

- **Desktop (md+)**: 2×2 grid, left-aligned flush with the CTA buttons' left edge, 24px below the last button. No centering drift.
- **Mobile (<md)**: Single column stack, each bullet uses `flex items-start gap-2` with a Lucide `Check` icon pinned via `shrink-0 mt-0.5` — second lines of text align with first line, never under the icon. `gap-y-3` (12px) provides breathing room between rows.
- **Animation**: Soft fade-in (opacity 0→1, y 10→0) with 0.4s delay so bullets appear after the CTA buttons.

### Files Changed

| File | Action |
|------|--------|
| `src/components/TrustBullets.tsx` | Create — reusable component |
| `src/components/AuditHero.tsx` | Remove 4 subtext blocks, add TrustBullets import + usage |
| `src/components/PowerToolDemo.tsx` | Remove TrustFooter definition + usage |

