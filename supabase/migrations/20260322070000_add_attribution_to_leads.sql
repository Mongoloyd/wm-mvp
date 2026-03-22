-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: Add Facebook attribution columns to leads table
-- Purpose: Store UTM params, fbclid, lead_id UUID for conversion tracking
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add UTM attribution columns
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_term TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_content TEXT;

-- Facebook click tracking
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fbclid TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gclid TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fbc TEXT;

-- Persistent visitor UUID (matches wm_lead_id cookie)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS external_lead_id UUID;

-- Landing page that generated the lead
ALTER TABLE leads ADD COLUMN IF NOT EXISTS landing_page TEXT;

-- Create index on external_lead_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_leads_external_lead_id ON leads(external_lead_id);

-- Create index on fbclid for Facebook attribution matching
CREATE INDEX IF NOT EXISTS idx_leads_fbclid ON leads(fbclid);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Add conversion event tracking table
-- Stores all conversion events for CAPI deduplication and analytics
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS conversion_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_id TEXT NOT NULL UNIQUE,  -- dedup key (matches browser + CAPI)
  lead_id UUID REFERENCES leads(id),
  external_lead_id UUID,          -- wm_lead_id cookie value
  phone_e164 TEXT,
  email TEXT,
  county TEXT,
  flow TEXT,
  grade TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  fbclid TEXT,
  fbc TEXT,
  custom_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for deduplication lookups
CREATE INDEX IF NOT EXISTS idx_conversion_events_event_id ON conversion_events(event_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_external_lead_id ON conversion_events(external_lead_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_created_at ON conversion_events(created_at);

-- RLS: Only service role can insert (edge functions)
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage conversion_events"
  ON conversion_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow anon to insert (for edge function with anon key)
CREATE POLICY "Anon can insert conversion_events"
  ON conversion_events
  FOR INSERT
  WITH CHECK (true);
