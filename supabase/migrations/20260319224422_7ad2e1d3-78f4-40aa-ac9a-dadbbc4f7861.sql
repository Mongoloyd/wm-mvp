
-- Step 1: Drop broad leads SELECT/UPDATE policies
DROP POLICY IF EXISTS "Allow anonymous select own leads by session_id" ON public.leads;
DROP POLICY IF EXISTS "Allow anonymous update own leads" ON public.leads;

-- Step 2: Create SECURITY DEFINER RPC for leads lookup by session_id
CREATE OR REPLACE FUNCTION public.get_lead_by_session(p_session_id text)
RETURNS TABLE(id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.id
  FROM public.leads l
  WHERE l.session_id = p_session_id
  LIMIT 1;
$$;

-- Step 3: Tighten scan_sessions INSERT to prevent anon user_id spoofing
DROP POLICY IF EXISTS "anon_insert_scan_sessions" ON public.scan_sessions;
CREATE POLICY "anon_insert_scan_sessions"
  ON public.scan_sessions FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

-- Step 4: Drop unnecessary quote_files anon SELECT
DROP POLICY IF EXISTS "Allow anonymous select on quote_files" ON public.quote_files;
