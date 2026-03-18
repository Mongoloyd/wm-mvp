-- Allow anon SELECT on scan_sessions so the frontend can poll status.
CREATE POLICY "anon_select_scan_sessions"
  ON public.scan_sessions
  FOR SELECT
  TO anon
  USING (true);