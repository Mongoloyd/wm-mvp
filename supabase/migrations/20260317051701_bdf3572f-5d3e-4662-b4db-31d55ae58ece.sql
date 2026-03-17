
-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id TEXT NOT NULL,
  first_name TEXT,
  email TEXT,
  phone_e164 TEXT,
  county TEXT,
  project_type TEXT,
  window_count INTEGER,
  quote_range TEXT,
  source TEXT,
  status TEXT DEFAULT 'new'
);

-- Create quote_files table
CREATE TABLE public.quote_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  status TEXT DEFAULT 'pending'
);

-- Create quote_analyses table
CREATE TABLE public.quote_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  grade TEXT,
  dollar_delta NUMERIC,
  flags JSONB DEFAULT '[]'::jsonb
);

-- RLS policies for leads
CREATE POLICY "Allow anonymous insert on leads"
  ON public.leads FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select own leads by session_id"
  ON public.leads FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous update own leads"
  ON public.leads FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- RLS policies for quote_files
CREATE POLICY "Allow anonymous insert on quote_files"
  ON public.quote_files FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select on quote_files"
  ON public.quote_files FOR SELECT
  TO anon
  USING (true);

-- RLS policies for quote_analyses
CREATE POLICY "Allow anonymous select on quote_analyses"
  ON public.quote_analyses FOR SELECT
  TO anon
  USING (true);

-- Create quotes storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('quotes', 'quotes', true);

-- Storage RLS: allow anonymous uploads to quotes bucket
CREATE POLICY "Allow anonymous uploads to quotes bucket"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'quotes');

-- Storage RLS: allow anonymous downloads from quotes bucket
CREATE POLICY "Allow anonymous select from quotes bucket"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'quotes');
