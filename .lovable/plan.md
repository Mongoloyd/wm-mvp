

# Fix: Lock down `otp_failures` table with RLS

## Problem
The `otp_failures` table has no RLS policies. It contains sensitive data (phone numbers, IP addresses) that could be read by anonymous callers.

## Fix
One migration that:

1. Ensures RLS is enabled on `otp_failures`
2. Adds a restrictive SELECT policy for internal operators only
3. Adds INSERT/UPDATE policies for internal operators only (edge functions use service role, so they bypass RLS — these policies just prevent anon/authenticated abuse)

```sql
ALTER TABLE public.otp_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "otp_failures_select_internal"
  ON public.otp_failures FOR SELECT
  TO authenticated
  USING (public.is_internal_operator());

CREATE POLICY "otp_failures_insert_internal"
  ON public.otp_failures FOR INSERT
  TO authenticated
  WITH CHECK (public.is_internal_operator());

CREATE POLICY "otp_failures_update_internal"
  ON public.otp_failures FOR UPDATE
  TO authenticated
  USING (public.is_internal_operator())
  WITH CHECK (public.is_internal_operator());

CREATE POLICY "otp_failures_delete_internal"
  ON public.otp_failures FOR DELETE
  TO authenticated
  USING (public.is_internal_operator());
```

## Impact
- Edge functions (which write to this table via service role) are unaffected — service role bypasses RLS
- Anonymous and regular authenticated users get zero access
- Internal operators retain full access

## Additional changes in this PR
Beyond the RLS migration, this PR also includes:
- **Light theme design system** — Tailwind token-based light styling across many UI components, new card/button primitives, refreshed color palette, shadows, and spacing system
- **Derived financial metrics** — `scan-quote` edge function now computes estimate metrics (cost breakdown, transparency score) and county-based pricing benchmarks
- **`calculate-estimate-metrics` edge function** — standalone edge function for estimate metrics computation
- **Forensic analysis UI** — `CriticalFlagCard`, ranked pillar insights, `ViolationSummaryTeaser`, and updated `ForensicAnalysisDisplay`

## Files
| File | Action |
|---|---|
| `supabase/migrations/…` | New migration (RLS) |
| `src/components/CriticalFlagCard.tsx` | New component |
| `src/components/ViolationSummaryTeaser.tsx` | New component |
| `src/components/ForensicAnalysisDisplay.tsx` | Updated |
| `supabase/functions/scan-quote/index.ts` | Estimate metrics + county benchmarks |
| `supabase/functions/calculate-estimate-metrics/…` | New edge function |
| `src/**` | Light theme design system rollout |

