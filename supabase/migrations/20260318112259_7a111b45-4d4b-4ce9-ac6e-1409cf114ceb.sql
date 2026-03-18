-- 1. Drop the broad anon SELECT policy on scan_sessions
DROP POLICY IF EXISTS "anon_select_scan_sessions" ON public.scan_sessions;

-- 2. Create a security-definer RPC that returns ONLY id and status
CREATE OR REPLACE FUNCTION public.get_scan_status(p_scan_session_id uuid)
RETURNS TABLE(id uuid, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.status
  FROM public.scan_sessions s
  WHERE s.id = p_scan_session_id
  LIMIT 1;
$$;