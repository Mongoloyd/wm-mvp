-- Phase 3.3: Contractor Monetization Layer
-- Creates: contractors, contractor_opportunities, contractor_opportunity_routes

-- Table 1: contractors
CREATE TABLE public.contractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  company_name text NOT NULL,
  contact_name text,
  email text,
  phone_e164 text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'inactive')),
  service_counties text[] NOT NULL DEFAULT '{}',
  service_regions text[] NOT NULL DEFAULT '{}',
  project_types text[] NOT NULL DEFAULT '{}',
  min_window_count integer,
  max_window_count integer,
  accepts_low_grade_leads boolean NOT NULL DEFAULT true,
  notes text,
  pricing_model text,
  is_vetted boolean NOT NULL DEFAULT false,
  vetted_at timestamptz
);

CREATE TRIGGER set_contractors_updated_at
  BEFORE UPDATE ON public.contractors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Table 2: contractor_opportunities
CREATE TABLE public.contractor_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  scan_session_id uuid NOT NULL REFERENCES public.scan_sessions(id) ON DELETE CASCADE,
  analysis_id uuid NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'intro_requested' CHECK (status IN (
    'intro_requested', 'brief_generating', 'brief_ready', 'queued',
    'assigned_internal', 'sent_to_contractor', 'viewed_by_contractor',
    'contractor_interested', 'contractor_declined',
    'homeowner_contact_released', 'intro_completed',
    'closed_won', 'closed_lost', 'dead'
  )),
  intro_requested_at timestamptz NOT NULL DEFAULT now(),
  brief_generated_at timestamptz,
  brief_version text,
  brief_json jsonb,
  brief_text text,
  county text,
  project_type text,
  window_count integer,
  quote_range text,
  grade text,
  flag_count integer NOT NULL DEFAULT 0,
  red_flag_count integer NOT NULL DEFAULT 0,
  amber_flag_count integer NOT NULL DEFAULT 0,
  assigned_operator text,
  internal_notes text,
  priority_score integer NOT NULL DEFAULT 0,
  routed_at timestamptz,
  homeowner_contact_released_at timestamptz,
  UNIQUE (scan_session_id)
);

CREATE TRIGGER set_contractor_opportunities_updated_at
  BEFORE UPDATE ON public.contractor_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Table 3: contractor_opportunity_routes
CREATE TABLE public.contractor_opportunity_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  opportunity_id uuid NOT NULL REFERENCES public.contractor_opportunities(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  route_status text NOT NULL DEFAULT 'suggested' CHECK (route_status IN ('suggested', 'assigned', 'sent', 'viewed', 'interested', 'declined', 'expired')),
  sent_at timestamptz,
  viewed_at timestamptz,
  responded_at timestamptz,
  response_notes text,
  contact_released boolean NOT NULL DEFAULT false,
  contact_released_at timestamptz,
  assigned_by text,
  routing_reason text
);

-- Indexes
CREATE INDEX idx_co_scan_session ON public.contractor_opportunities(scan_session_id);
CREATE INDEX idx_co_lead ON public.contractor_opportunities(lead_id);
CREATE INDEX idx_co_status ON public.contractor_opportunities(status);
CREATE INDEX idx_co_priority ON public.contractor_opportunities(priority_score DESC);
CREATE INDEX idx_co_intro_requested ON public.contractor_opportunities(intro_requested_at DESC);
CREATE INDEX idx_cor_opportunity ON public.contractor_opportunity_routes(opportunity_id);
CREATE INDEX idx_cor_contractor ON public.contractor_opportunity_routes(contractor_id);
CREATE INDEX idx_cor_route_status ON public.contractor_opportunity_routes(route_status);