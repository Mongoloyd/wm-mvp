
-- Drop the overly permissive anonymous SELECT policy
DROP POLICY IF EXISTS "Allow anonymous select on quote_analyses" ON public.quote_analyses;

-- quote_analyses is a legacy table (not actively written to).
-- No new SELECT policy needed — the table should not be queryable by anon.
-- All scoring data lives in `analyses` (accessed via service-role RPCs).
