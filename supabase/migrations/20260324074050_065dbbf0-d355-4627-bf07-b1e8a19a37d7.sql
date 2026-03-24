-- Phase 3.4A: Suggested Match + Call Momentum fields on contractor_opportunities
ALTER TABLE public.contractor_opportunities
  ADD COLUMN IF NOT EXISTS suggested_contractor_id uuid REFERENCES public.contractors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suggested_match_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS suggested_match_confidence text,
  ADD COLUMN IF NOT EXISTS suggested_match_reasons jsonb,
  ADD COLUMN IF NOT EXISTS suggested_match_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS suggested_match_top_candidates jsonb,
  ADD COLUMN IF NOT EXISTS suggested_match_overridden boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS suggested_match_overridden_at timestamptz,
  ADD COLUMN IF NOT EXISTS suggested_match_override_reason text,
  ADD COLUMN IF NOT EXISTS last_call_intent text,
  ADD COLUMN IF NOT EXISTS last_call_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_call_webhook_status text,
  ADD COLUMN IF NOT EXISTS last_call_webhook_error text,
  ADD COLUMN IF NOT EXISTS cta_source text;