-- Temporary operator-level RLS policies for Admin Dashboard
-- These allow anon access for MVP operator use. Will be replaced with auth-gated policies in Phase 2.

-- contractor_opportunities: full CRUD for operator
CREATE POLICY "operator_select_opportunities" ON public.contractor_opportunities FOR SELECT TO anon USING (true);
CREATE POLICY "operator_update_opportunities" ON public.contractor_opportunities FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- contractor_opportunity_routes: full CRUD for operator
CREATE POLICY "operator_select_routes" ON public.contractor_opportunity_routes FOR SELECT TO anon USING (true);
CREATE POLICY "operator_insert_routes" ON public.contractor_opportunity_routes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "operator_update_routes" ON public.contractor_opportunity_routes FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- contractors: read for operator
CREATE POLICY "operator_select_contractors" ON public.contractors FOR SELECT TO anon USING (true);

-- billable_intros: full CRUD for operator
CREATE POLICY "operator_select_billable" ON public.billable_intros FOR SELECT TO anon USING (true);
CREATE POLICY "operator_insert_billable" ON public.billable_intros FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "operator_update_billable" ON public.billable_intros FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- contractor_outcomes: full CRUD for operator
CREATE POLICY "operator_select_outcomes" ON public.contractor_outcomes FOR SELECT TO anon USING (true);
CREATE POLICY "operator_insert_outcomes" ON public.contractor_outcomes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "operator_update_outcomes" ON public.contractor_outcomes FOR UPDATE TO anon USING (true) WITH CHECK (true);