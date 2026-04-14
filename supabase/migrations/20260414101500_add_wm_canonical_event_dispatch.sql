-- Canonical event ledger + quote trust + platform dispatch infrastructure
-- Additive migration. Preserves existing Verify-to-Reveal and event_logs behavior.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wm_event_name') THEN
    CREATE TYPE public.wm_event_name AS ENUM (
      'lead_identified',
      'quote_upload_completed',
      'quote_validation_passed',
      'otp_verified',
      'report_revealed',
      'appointment_booked',
      'sale_confirmed'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wm_anomaly_status') THEN
    CREATE TYPE public.wm_anomaly_status AS ENUM ('safe', 'review', 'quarantine', 'reject');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wm_dispatch_status') THEN
    CREATE TYPE public.wm_dispatch_status AS ENUM ('pending', 'processing', 'sent', 'suppressed', 'failed', 'dead_letter');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wm_platform_name') THEN
    CREATE TYPE public.wm_platform_name AS ENUM ('meta', 'google');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.wm_event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_name public.wm_event_name NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),

  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  scan_session_id uuid REFERENCES public.scan_sessions(id) ON DELETE SET NULL,
  analysis_id uuid REFERENCES public.analyses(id) ON DELETE SET NULL,
  quote_file_id uuid REFERENCES public.quote_files(id) ON DELETE SET NULL,

  schema_version text NOT NULL DEFAULT '1.0.0',
  model_version text,

  trust_score numeric(5,4),
  anomaly_score numeric(5,4),
  anomaly_status public.wm_anomaly_status,
  manual_review_required boolean NOT NULL DEFAULT false,
  approved_for_index boolean NOT NULL DEFAULT false,
  approved_for_ads boolean NOT NULL DEFAULT false,

  optimization_value numeric(12,2),
  should_send_meta boolean NOT NULL DEFAULT false,
  should_send_google boolean NOT NULL DEFAULT false,
  meta_dispatch_status public.wm_dispatch_status,
  google_dispatch_status public.wm_dispatch_status,

  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_payload jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wm_quote_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid UNIQUE NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  scan_session_id uuid REFERENCES public.scan_sessions(id) ON DELETE SET NULL,

  event_id text UNIQUE,
  normalized_facts jsonb NOT NULL DEFAULT '{}'::jsonb,
  trust_inputs jsonb NOT NULL DEFAULT '{}'::jsonb,

  trust_score numeric(5,4),
  anomaly_score numeric(5,4),
  anomaly_status public.wm_anomaly_status,
  manual_review_required boolean NOT NULL DEFAULT false,
  approved_for_index boolean NOT NULL DEFAULT false,
  approved_for_ads boolean NOT NULL DEFAULT false,
  reasons jsonb NOT NULL DEFAULT '[]'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wm_quote_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL REFERENCES public.wm_event_log(event_id) ON DELETE CASCADE,
  analysis_id uuid REFERENCES public.analyses(id) ON DELETE SET NULL,
  review_status text NOT NULL DEFAULT 'queued' CHECK (review_status IN ('queued', 'in_progress', 'approved', 'rejected', 'resolved')),
  reason_codes text[] NOT NULL DEFAULT '{}',
  notes text,
  assigned_to uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wm_quote_reviews_event_id_unique
  ON public.wm_quote_reviews(event_id);

CREATE TABLE IF NOT EXISTS public.wm_pricing_index_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_key text NOT NULL,
  snapshot_version integer NOT NULL,
  cohort_key text NOT NULL,
  cohort_dimensions jsonb NOT NULL DEFAULT '{}'::jsonb,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  sample_size integer NOT NULL DEFAULT 0,
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (snapshot_key, snapshot_version, cohort_key)
);

CREATE TABLE IF NOT EXISTS public.wm_platform_dispatch_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL REFERENCES public.wm_event_log(event_id) ON DELETE CASCADE,
  platform public.wm_platform_name NOT NULL,
  status public.wm_dispatch_status NOT NULL DEFAULT 'pending',
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  next_retry_at timestamptz,
  last_attempt_at timestamptz,
  request_payload jsonb,
  response_payload jsonb,
  last_http_status integer,
  last_error text,
  suppression_reason text,
  locked_at timestamptz,
  lock_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, platform)
);

ALTER TABLE public.wm_event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wm_quote_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wm_quote_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wm_pricing_index_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wm_platform_dispatch_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wm_event_log_service_role_all ON public.wm_event_log;
CREATE POLICY wm_event_log_service_role_all ON public.wm_event_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS wm_quote_facts_service_role_all ON public.wm_quote_facts;
CREATE POLICY wm_quote_facts_service_role_all ON public.wm_quote_facts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS wm_quote_reviews_service_role_all ON public.wm_quote_reviews;
CREATE POLICY wm_quote_reviews_service_role_all ON public.wm_quote_reviews
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS wm_pricing_index_snapshots_service_role_all ON public.wm_pricing_index_snapshots;
CREATE POLICY wm_pricing_index_snapshots_service_role_all ON public.wm_pricing_index_snapshots
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS wm_platform_dispatch_log_service_role_all ON public.wm_platform_dispatch_log;
CREATE POLICY wm_platform_dispatch_log_service_role_all ON public.wm_platform_dispatch_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_wm_event_log_event_name_occurred_at
  ON public.wm_event_log(event_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_wm_event_log_lead_id ON public.wm_event_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_wm_event_log_analysis_id ON public.wm_event_log(analysis_id);
CREATE INDEX IF NOT EXISTS idx_wm_event_log_anomaly_status ON public.wm_event_log(anomaly_status);

CREATE INDEX IF NOT EXISTS idx_wm_quote_facts_status
  ON public.wm_quote_facts(anomaly_status, approved_for_index, approved_for_ads);
CREATE INDEX IF NOT EXISTS idx_wm_quote_reviews_status_created
  ON public.wm_quote_reviews(review_status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_wm_platform_dispatch_due
  ON public.wm_platform_dispatch_log(status, next_retry_at, created_at);
CREATE INDEX IF NOT EXISTS idx_wm_platform_dispatch_platform_status
  ON public.wm_platform_dispatch_log(platform, status);

DROP TRIGGER IF EXISTS trg_wm_event_log_updated_at ON public.wm_event_log;
CREATE TRIGGER trg_wm_event_log_updated_at
  BEFORE UPDATE ON public.wm_event_log
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_wm_quote_facts_updated_at ON public.wm_quote_facts;
CREATE TRIGGER trg_wm_quote_facts_updated_at
  BEFORE UPDATE ON public.wm_quote_facts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_wm_quote_reviews_updated_at ON public.wm_quote_reviews;
CREATE TRIGGER trg_wm_quote_reviews_updated_at
  BEFORE UPDATE ON public.wm_quote_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_wm_platform_dispatch_log_updated_at ON public.wm_platform_dispatch_log;
CREATE TRIGGER trg_wm_platform_dispatch_log_updated_at
  BEFORE UPDATE ON public.wm_platform_dispatch_log
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
