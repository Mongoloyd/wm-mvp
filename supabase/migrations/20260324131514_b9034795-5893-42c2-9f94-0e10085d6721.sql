-- ============================================================
-- RLS HARDENING: Remove anon SELECT on all operator/internal tables
-- Replace with authenticated-only SELECT for admin dashboard
-- ============================================================

-- 1. Drop all unsafe anon SELECT policies
DROP POLICY IF EXISTS "operator_select_contractors"    ON public.contractors;
DROP POLICY IF EXISTS "operator_select_opportunities"  ON public.contractor_opportunities;
DROP POLICY IF EXISTS "operator_select_routes"         ON public.contractor_opportunity_routes;
DROP POLICY IF EXISTS "operator_select_billable"       ON public.billable_intros;
DROP POLICY IF EXISTS "operator_select_outcomes"       ON public.contractor_outcomes;

-- 2. Create authenticated-only SELECT replacements for admin dashboard
CREATE POLICY "authenticated_select_contractors"
  ON public.contractors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_select_opportunities"
  ON public.contractor_opportunities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_select_routes"
  ON public.contractor_opportunity_routes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_select_billable"
  ON public.billable_intros FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_select_outcomes"
  ON public.contractor_outcomes FOR SELECT
  TO authenticated
  USING (true);