

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
- No code changes needed

## Files
| File | Action |
|---|---|
| `supabase/migrations/…` | New migration |

