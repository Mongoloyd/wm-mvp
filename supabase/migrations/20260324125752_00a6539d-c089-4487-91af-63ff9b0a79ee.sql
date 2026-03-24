-- Remove dangerous anon WRITE policies on operator-only tables.
-- The contractor-actions edge function uses service_role (bypasses RLS),
-- so these anon write policies serve no purpose and expose financial data.
-- Lead-creation anon policies (leads, quote_files, scan_sessions, event_logs) are untouched.

-- billable_intros: drop anon INSERT + UPDATE
DROP POLICY IF EXISTS "operator_insert_billable" ON public.billable_intros;
DROP POLICY IF EXISTS "operator_update_billable" ON public.billable_intros;

-- contractor_opportunity_routes: drop anon INSERT + UPDATE
DROP POLICY IF EXISTS "operator_insert_routes" ON public.contractor_opportunity_routes;
DROP POLICY IF EXISTS "operator_update_routes" ON public.contractor_opportunity_routes;

-- contractor_outcomes: drop anon INSERT + UPDATE
DROP POLICY IF EXISTS "operator_insert_outcomes" ON public.contractor_outcomes;
DROP POLICY IF EXISTS "operator_update_outcomes" ON public.contractor_outcomes;

-- contractor_opportunities: drop anon UPDATE (INSERT already blocked)
DROP POLICY IF EXISTS "operator_update_opportunities" ON public.contractor_opportunities;