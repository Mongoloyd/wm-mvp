CREATE OR REPLACE FUNCTION public.is_internal_operator()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT
    auth.role() = 'authenticated'
    AND coalesce(
      auth.jwt() -> 'app_metadata' ->> 'role',
      ''
    ) IN ('operator', 'admin', 'super_admin');
$$;