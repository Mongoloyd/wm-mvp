
-- Constrain anon INSERT on leads to prevent OTP gate bypass
DROP POLICY IF EXISTS "Allow anonymous insert on leads" ON public.leads;

CREATE POLICY "leads_anon_insert_constrained"
  ON public.leads
  FOR INSERT
  TO anon
  WITH CHECK (
    phone_verified = false
    AND phone_verified_at IS NULL
    AND otp_state IS NULL
    AND otp_failure_count = 0
    AND otp_locked_until IS NULL
    AND report_unlocked_at IS NULL
    AND last_otp_verified_at IS NULL
  );

-- Fix PERMISSIVE deny policies → RESTRICTIVE
DROP POLICY IF EXISTS "deny_anon_insert_conversion_events" ON public.conversion_events;
CREATE POLICY "deny_anon_insert_conversion_events"
  ON public.conversion_events
  AS RESTRICTIVE
  FOR INSERT
  TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS "deny_anon_select_conversion_events" ON public.conversion_events;
CREATE POLICY "deny_anon_select_conversion_events"
  ON public.conversion_events
  AS RESTRICTIVE
  FOR SELECT
  TO anon
  USING (false);

DROP POLICY IF EXISTS "deny_public_insert_audit" ON public.user_role_audit_log;
CREATE POLICY "deny_public_insert_audit"
  ON public.user_role_audit_log
  AS RESTRICTIVE
  FOR INSERT
  TO public
  WITH CHECK (false);
