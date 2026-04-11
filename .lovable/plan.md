

## Plan: ArbitrageEngine — Tailwind Migration, Supabase Lead Capture, and Scan Reveal

### Overview
Three changes to `src/components/arbitrageengine.tsx`: replace hardcoded colors with Tailwind classes, wire lead capture to Supabase, and add mock 5-pillar analysis reveal after funnel completion.

---

### Step 1: Replace Hardcoded Colors with Tailwind Classes

All inline hex values and `bg-[#hex]` patterns get mapped to semantic Tailwind equivalents. The component is already dark-themed, so most changes are swapping custom hex for standard slate/gray tokens.

| Current | Replacement |
|---------|------------|
| `bg-[#070b14]` | `bg-slate-950` |
| `bg-[#12192b]/60` | `bg-slate-900/60` |
| `bg-[#1e273a]` | `bg-slate-800` |
| `bg-[#1e273a]/60` | `bg-slate-800/60` |
| `text-[#8ba3c7]` | `text-slate-400` |
| `text-[#a0abc0]` | `text-slate-400` |
| `bg-[#070b14]/70` (inputs) | `bg-slate-950/70` |
| `border-white/10` | stays (already Tailwind) |
| `fill="#1e273a"` on SVG icon | `fill="currentColor"` with parent text color |

No visual hierarchy changes — just token swaps. All gradient classes (`from-cyan-500 to-blue-600`, etc.) already use Tailwind and stay as-is.

---

### Step 2: Wire Supabase Lead Capture

**Import**: `supabase` from `@/integrations/supabase/client` and `getUtmData` from `@/lib/useUtmCapture`.

**New state**: `isSubmitting` (boolean), `submitError` (string | null).

**New async function** `handleLeadSubmit()`:
- Called when the user submits the `identity` step (name + email form)
- Sets `isSubmitting = true`
- Generates a `session_id` via `crypto.randomUUID()`
- Upserts into `leads` table with: `session_id`, `first_name`, `email`, `phone_e164` (formatted from `formData.phone`), `zip` (from `formData.zip`), `source: 'arbitrage-engine'`, `window_count` (parsed from `formData.scope`), `has_estimate` (from `formData.hasEstimate`), plus UTM fields from `getUtmData()`
- On success: clears error, advances to next funnel step
- On failure: sets `submitError` message, stays on current step, does NOT advance
- Loading state disables submit button and shows spinner text

**RLS**: The `leads` table already has `Allow anonymous insert on leads` for the `anon` role — no migration needed.

**Security**: No sensitive data exposed. Phone formatted with existing `toE164` util from `@/utils/formatPhone`.

---

### Step 3: Mock 5-Pillar Analysis Reveal

After funnel completion (`hasCompletedFunnel = true` and `flowState = 'revealed'`), render a new section below the "Market Maker Model" text that shows:

**Mock data object** (hardcoded, structured to match `full_json` pillar format):
- Overall Grade: **C+**
- Safety & Code: 62/100 (fail)
- Install Scope: 78/100 (pass)
- Price Fairness: 45/100 (fail)
- Fine Print: 71/100 (pass)
- Warranty: 55/100 (warn)
- 3 red flags, 2 amber flags (hardcoded strings)

**UI**: A glassmorphic card matching existing styling with:
- Grade badge (letter + color)
- 5 horizontal pillar bars with score labels
- Red/amber flag list with severity icons
- "Upload Your Real Quote" CTA button at bottom

This section only renders when `hasCompletedFunnel` is true, creating the full end-to-end experience.

---

### Files
1. **Edit** `src/components/arbitrageengine.tsx` — all three changes in one pass

### No DB Migration Needed
The `leads` table already accepts anonymous inserts with the required columns.

