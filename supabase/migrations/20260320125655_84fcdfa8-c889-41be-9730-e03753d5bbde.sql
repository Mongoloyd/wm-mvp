-- Session-scoped SELECT: a lead row is only readable if the
-- request's x-session-id header matches the lead's session_id.
CREATE POLICY "session_scoped_select_leads"
  ON public.leads
  FOR SELECT
  TO anon
  USING (
    session_id = (current_setting('request.headers', true)::json ->> 'x-session-id')
  );