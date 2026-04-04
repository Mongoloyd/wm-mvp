-- Enable pg_cron extension (must be in pg_catalog on Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Enable pg_net extension for HTTP requests from SQL
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Idempotency: prevent duplicate pending/failed webhook deliveries for same lead+event
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_deliveries_lead_event_unique
ON public.webhook_deliveries (lead_id, event_type)
WHERE status NOT IN ('delivered', 'mock_delivered', 'dead_letter');