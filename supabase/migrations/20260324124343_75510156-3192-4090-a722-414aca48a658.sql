-- B-4: Tighten RLS on conversion_events
-- Enable RLS (should already be enabled by auto-enable trigger, but belt-and-suspenders)
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

-- Block all anon access to conversion_events (contains PII in user_data)
-- Only service_role (edge functions) should read/write this table
CREATE POLICY "deny_anon_select_conversion_events"
  ON public.conversion_events
  FOR SELECT
  TO anon
  USING (false);

CREATE POLICY "deny_anon_insert_conversion_events"
  ON public.conversion_events
  FOR INSERT
  TO anon
  WITH CHECK (false);