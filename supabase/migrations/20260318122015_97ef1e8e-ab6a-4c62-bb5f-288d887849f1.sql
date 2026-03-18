CREATE OR REPLACE FUNCTION public.get_analysis_preview(p_scan_session_id uuid)
RETURNS TABLE(
  grade text,
  flags jsonb,
  proof_of_read jsonb,
  preview_json jsonb,
  confidence_score numeric,
  document_type text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT a.grade, a.flags, a.proof_of_read, a.preview_json,
         a.confidence_score, a.document_type
  FROM public.analyses a
  WHERE a.scan_session_id = p_scan_session_id
    AND a.analysis_status = 'complete'
  LIMIT 1;
$$;