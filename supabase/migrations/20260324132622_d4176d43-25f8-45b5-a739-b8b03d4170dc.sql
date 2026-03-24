-- ============================================================
-- PHASE 2: Lock down all operator/internal tables to service-role-only
-- Admin dashboard and edge functions use SERVICE_ROLE_KEY (bypasses RLS)
-- ============================================================

-- Drop authenticated SELECT on operator tables (service-role-only)
DROP POLICY IF EXISTS "authenticated_select_contractors"    ON public.contractors;
DROP POLICY IF EXISTS "authenticated_select_opportunities"  ON public.contractor_opportunities;
DROP POLICY IF EXISTS "authenticated_select_routes"         ON public.contractor_opportunity_routes;
DROP POLICY IF EXISTS "authenticated_select_billable"       ON public.billable_intros;
DROP POLICY IF EXISTS "authenticated_select_outcomes"       ON public.contractor_outcomes;

-- Drop authenticated SELECT on voice_followups and lead_events
DROP POLICY IF EXISTS "Authenticated read voice_followups"  ON public.voice_followups;
DROP POLICY IF EXISTS "Authenticated read lead_events"      ON public.lead_events;