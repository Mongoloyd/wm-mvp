

# Plan: Lead Capture Gate on MarketBaselineTool (Flow B)

## Problem
When a user clicks "Getting Quotes Soon?" → Flow B → "Build My Baseline", they land on `MarketBaselineTool` which shows all pricing data immediately with zero lead capture. The `flowBLeadCaptured` state (Index.tsx line 55) is never set to `true`, so `ForensicChecklist` and `QuoteWatcher` never render.

## Solution
Add a blur-gated lead capture form over the right-side pricing result panel in `MarketBaselineTool.tsx`. The left panel (county, brand, windows, install method) stays fully interactive. The right panel showing prices is blurred at exactly **7px** until the user submits name + email + phone + TCPA consent.

## Files Changed

### 1. `src/components/MarketBaselineTool.tsx` (~90 lines added)

**New prop:**
```typescript
interface MarketBaselineToolProps {
  onLeadCaptured?: () => void;
}
```

**New imports:**
- `usePhoneInput` from `@/hooks/usePhoneInput`
- `isValidEmail`, `isValidName` from `@/utils/formatPhone`
- `supabase` from `@/integrations/supabase/client`
- `getLeadId` from `@/lib/useLeadId`
- `getUtmPayload` from `@/lib/useUtmCapture`
- `Lock` from `lucide-react`

**New state (~10 lines):**
- `unlocked` — boolean, initialized from `localStorage.getItem('wm_baseline_unlocked') === 'true'`
- `gateForm` — `{ firstName: string, email: string }`
- `phone` — via `usePhoneInput()` hook
- `tcpaConsent` — boolean
- `submitting` — boolean

**New `handleGateSubmit` function (~25 lines):**
- Validates all fields (isValidName, isValidEmail, phone.isValid, tcpaConsent)
- Upserts to Supabase `leads` table with: `session_id` (getLeadId()), `first_name`, `email`, `phone_e164`, `county`, `window_count`, **`source: 'flow-b-baseline'`**, plus full UTM payload
- On success: sets `localStorage('wm_baseline_unlocked', 'true')`, sets `unlocked = true`, calls `onLeadCaptured?.()`

**New `useEffect` for returning users (~5 lines):**
- If `unlocked` is `true` on mount, immediately call `onLeadCaptured?.()` so `flowBLeadCaptured` gets set and downstream components render

**Gate overlay on the right-side result panel (lines ~306-352, ~40 lines):**
- When `unlocked === false`: the existing pricing card renders with `style={{ filter: 'blur(7px)', pointerEvents: 'none' }}`. An absolute-positioned overlay renders on top containing:
  - Lock icon + "Your Baseline is Ready" heading
  - Form fields: First Name, Email, Phone (formatted via usePhoneInput)
  - TCPA consent checkbox
  - Submit button (`btn-depth-primary`)
  - All inputs use existing `input-well` class, labels use `wm-eyebrow` styling
- When `unlocked === true`: existing result panel renders unchanged

### 2. `src/pages/Index.tsx` (1 line changed)

**Line 225** — pass the callback:
```tsx
<MarketBaselineTool onLeadCaptured={() => setFlowBLeadCaptured(true)} />
```

## What Does NOT Change
- `FlowBEntry.tsx` — untouched
- `ForensicChecklist.tsx` — untouched
- `QuoteWatcher.tsx` — untouched
- No new files created
- No backend/edge function changes
- No database schema changes (uses existing `leads` table)
- Left-side configuration panel remains fully interactive (no gate on inputs)

## Data Flow
```text
User configures project (left panel, ungated)
  → Right panel shows blurred prices (7px blur)
  → User fills name/email/phone + TCPA checkbox
  → "Unlock My Baseline" button submits
    → Client validation
    → Supabase INSERT into leads (source: 'flow-b-baseline', UTM attached)
    → localStorage persists unlock
    → onLeadCaptured() fires → Index sets flowBLeadCaptured = true
    → ForensicChecklist + QuoteWatcher render below
```

## Returning Users
If `localStorage` has `wm_baseline_unlocked === 'true'`, the gate is skipped on load and `onLeadCaptured()` fires immediately on mount.

