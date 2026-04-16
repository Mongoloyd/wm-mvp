
-- Migration: CAPI multi-pixel infrastructure

-- 1. Clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_service_role_all" ON public.clients FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "clients_select_internal" ON public.clients FOR SELECT TO authenticated USING (is_internal_operator());

-- 2. Meta configurations table
CREATE TABLE IF NOT EXISTS public.meta_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  pixel_id text,
  access_token text,
  test_event_code text,
  is_default boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meta_configurations ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS one_default_pixel ON public.meta_configurations (is_default) WHERE is_default = true;

CREATE POLICY "meta_config_service_role_all" ON public.meta_configurations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "meta_config_select_internal" ON public.meta_configurations FOR SELECT TO authenticated USING (is_internal_operator());

-- 3. CAPI signal logs table
CREATE TABLE IF NOT EXISTS public.capi_signal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug text,
  pixel_id text,
  event_name text,
  status_code integer,
  payload jsonb,
  response jsonb,
  fired_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.capi_signal_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_capi_logs_client_slug ON public.capi_signal_logs (client_slug, fired_at DESC);

CREATE POLICY "capi_logs_service_role_all" ON public.capi_signal_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "capi_logs_select_internal" ON public.capi_signal_logs FOR SELECT TO authenticated USING (is_internal_operator());
