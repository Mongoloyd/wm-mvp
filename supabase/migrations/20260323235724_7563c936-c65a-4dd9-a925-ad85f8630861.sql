-- Backfill: create a lead for each orphaned scan_session and link them
-- Uses a CTE to insert leads, then updates scan_sessions.lead_id

WITH orphan_sessions AS (
  SELECT id, created_at
  FROM public.scan_sessions
  WHERE lead_id IS NULL
),
new_leads AS (
  INSERT INTO public.leads (session_id, source, created_at)
  SELECT 'backfill_' || os.id::text, 'backfill_orphan', os.created_at
  FROM orphan_sessions os
  RETURNING id, session_id
)
UPDATE public.scan_sessions ss
SET lead_id = nl.id
FROM new_leads nl
WHERE nl.session_id = 'backfill_' || ss.id::text
  AND ss.lead_id IS NULL;