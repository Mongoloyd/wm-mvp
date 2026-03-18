
-- ============================================================
-- Phase 1: Database & Storage Alignment Migration
-- ============================================================

-- 1. HARDEN QUOTES BUCKET
-- Make private + enforce file size and MIME type restrictions
UPDATE storage.buckets
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png','image/webp','image/heic']
WHERE id = 'quotes';

-- Drop anonymous SELECT policy (no public downloads)
DROP POLICY IF EXISTS "Allow anonymous select from quotes bucket" ON storage.objects;

-- Keep anonymous INSERT policy (blind uploads still work):
-- Policy "Allow anonymous uploads to quotes bucket" WITH CHECK (bucket_id = 'quotes')

-- 2. CREATE REUSABLE updated_at TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. CREATE scan_sessions TABLE
CREATE TABLE public.scan_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  quote_file_id uuid UNIQUE REFERENCES public.quote_files(id) ON DELETE CASCADE,
  user_id uuid,
  status text NOT NULL DEFAULT 'idle'
    CHECK (status IN ('idle','uploading','processing','preview_ready','awaiting_verification','revealed','invalid_document','needs_better_upload')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS auto-enabled by rls_auto_enable trigger
-- Temporary MVP: anon INSERT only
CREATE POLICY "anon_insert_scan_sessions"
  ON public.scan_sessions FOR INSERT TO anon
  WITH CHECK (true);
-- No anon SELECT/UPDATE/DELETE

-- Indexes
CREATE INDEX idx_scan_sessions_lead_id ON public.scan_sessions(lead_id);
CREATE INDEX idx_scan_sessions_status ON public.scan_sessions(status);

-- updated_at trigger
CREATE TRIGGER trg_scan_sessions_updated_at
  BEFORE UPDATE ON public.scan_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. CREATE analyses TABLE (canonical; quote_analyses is legacy)
CREATE TABLE public.analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_session_id uuid REFERENCES public.scan_sessions(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid,
  proof_of_read jsonb,
  preview_json jsonb,
  full_json jsonb,
  grade text,
  dollar_delta numeric,
  flags jsonb DEFAULT '[]'::jsonb,
  confidence_score numeric,
  analysis_status text NOT NULL DEFAULT 'pending'
    CHECK (analysis_status IN ('pending','processing','complete','failed','invalid_document')),
  rubric_version text,
  document_type text,
  document_is_window_door_related boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- No anon policies at all — service role only
-- Indexes
CREATE INDEX idx_analyses_scan_session_id ON public.analyses(scan_session_id);
CREATE INDEX idx_analyses_lead_id ON public.analyses(lead_id);

-- updated_at trigger
CREATE TRIGGER trg_analyses_updated_at
  BEFORE UPDATE ON public.analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 5. CREATE phone_verifications TABLE
CREATE TABLE public.phone_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  phone_e164 text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','verified','failed')),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- No anon policies — service role only
-- Indexes
CREATE INDEX idx_phone_verifications_lead_id ON public.phone_verifications(lead_id);
CREATE INDEX idx_phone_verifications_phone ON public.phone_verifications(phone_e164);

-- updated_at trigger
CREATE TRIGGER trg_phone_verifications_updated_at
  BEFORE UPDATE ON public.phone_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 6. CREATE event_logs TABLE (append-only)
CREATE TABLE public.event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  user_id uuid,
  event_name text NOT NULL,
  flow_type text,
  route text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Temporary MVP: anon INSERT only
CREATE POLICY "anon_insert_event_logs"
  ON public.event_logs FOR INSERT TO anon
  WITH CHECK (true);
-- No anon SELECT/UPDATE/DELETE

-- Indexes
CREATE INDEX idx_event_logs_session_id ON public.event_logs(session_id);
CREATE INDEX idx_event_logs_event_name ON public.event_logs(event_name);
CREATE INDEX idx_event_logs_lead_id ON public.event_logs(lead_id);
