DROP INDEX IF EXISTS idx_analyses_scan_session_id;
CREATE UNIQUE INDEX analyses_scan_session_id_unique ON public.analyses (scan_session_id);