
-- ═══════════════════════════════════════════════════════════════════════
-- PHASE 3.4 — Lead Unlock & Billable Release Layer
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Extend contractor_opportunity_routes with interest/release fields ──
ALTER TABLE public.contractor_opportunity_routes
  ADD COLUMN IF NOT EXISTS interested_at timestamptz,
  ADD COLUMN IF NOT EXISTS interest_notes text,
  ADD COLUMN IF NOT EXISTS release_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS release_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS release_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS release_reviewed_by text,
  ADD COLUMN IF NOT EXISTS release_denial_reason text;

-- ── 2. Extend contractor_opportunities with release tracking ──
ALTER TABLE public.contractor_opportunities
  ADD COLUMN IF NOT EXISTS release_ready boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_interest_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_release_at timestamptz;

-- ── 3. Create billable_intros table ──
CREATE TABLE public.billable_intros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  opportunity_id uuid NOT NULL REFERENCES public.contractor_opportunities(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES public.contractor_opportunity_routes(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  analysis_id uuid REFERENCES public.analyses(id) ON DELETE SET NULL,
  release_approved_at timestamptz,
  contact_released_at timestamptz,
  billing_status text NOT NULL DEFAULT 'pending',
  billing_model text,
  fee_amount numeric(10,2),
  currency text NOT NULL DEFAULT 'USD',
  invoice_reference text,
  paid_at timestamptz,
  waived_at timestamptz,
  refunded_at timestamptz,
  disputed_at timestamptz,
  released_by text,
  notes text,
  CONSTRAINT billable_intros_route_id_unique UNIQUE (route_id)
);

CREATE TRIGGER set_billable_intros_updated_at
  BEFORE UPDATE ON public.billable_intros
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── 4. Create contractor_outcomes table ──
CREATE TABLE public.contractor_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  billable_intro_id uuid NOT NULL REFERENCES public.billable_intros(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES public.contractor_opportunities(id) ON DELETE CASCADE,
  route_id uuid REFERENCES public.contractor_opportunity_routes(id) ON DELETE SET NULL,
  contractor_id uuid REFERENCES public.contractors(id) ON DELETE SET NULL,
  appointment_status text DEFAULT 'pending',
  appointment_booked_at timestamptz,
  quote_status text DEFAULT 'pending',
  replacement_quote_range text,
  did_beat_price boolean,
  did_improve_warranty boolean,
  did_fix_scope_gaps boolean,
  deal_status text DEFAULT 'open',
  deal_value numeric(10,2),
  closed_at timestamptz,
  outcome_notes text,
  CONSTRAINT contractor_outcomes_billable_intro_unique UNIQUE (billable_intro_id)
);

CREATE TRIGGER set_contractor_outcomes_updated_at
  BEFORE UPDATE ON public.contractor_outcomes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── 5. Indexes ──
CREATE INDEX idx_billable_intros_opportunity ON public.billable_intros(opportunity_id);
CREATE INDEX idx_billable_intros_route ON public.billable_intros(route_id);
CREATE INDEX idx_billable_intros_contractor ON public.billable_intros(contractor_id);
CREATE INDEX idx_billable_intros_billing_status ON public.billable_intros(billing_status);
CREATE INDEX idx_billable_intros_released_at_desc ON public.billable_intros(contact_released_at DESC);
CREATE INDEX idx_billable_intros_status_created ON public.billable_intros(billing_status, created_at DESC);
CREATE INDEX idx_contractor_outcomes_billable ON public.contractor_outcomes(billable_intro_id);
CREATE INDEX idx_contractor_outcomes_opportunity ON public.contractor_outcomes(opportunity_id);
CREATE INDEX idx_contractor_outcomes_deal ON public.contractor_outcomes(deal_status);
CREATE INDEX idx_routes_release_status ON public.contractor_opportunity_routes(release_status);
CREATE INDEX idx_routes_interested_at ON public.contractor_opportunity_routes(interested_at DESC);

-- ── 6. RLS — service role only (no anon access) ──
ALTER TABLE public.billable_intros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_outcomes ENABLE ROW LEVEL SECURITY;
