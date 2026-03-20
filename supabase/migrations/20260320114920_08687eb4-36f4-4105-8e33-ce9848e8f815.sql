CREATE FUNCTION public.get_rubric_stats()
RETURNS TABLE(
  rubric_version text,
  total_count bigint,
  grade_a bigint,
  grade_b bigint,
  grade_c bigint,
  grade_d bigint,
  grade_f bigint,
  avg_confidence numeric,
  invalid_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    a.rubric_version,
    COUNT(*)                                          AS total_count,
    COUNT(*) FILTER (WHERE a.grade = 'A')             AS grade_a,
    COUNT(*) FILTER (WHERE a.grade = 'B')             AS grade_b,
    COUNT(*) FILTER (WHERE a.grade = 'C')             AS grade_c,
    COUNT(*) FILTER (WHERE a.grade = 'D')             AS grade_d,
    COUNT(*) FILTER (WHERE a.grade = 'F')             AS grade_f,
    ROUND(AVG(a.confidence_score), 1)                 AS avg_confidence,
    COUNT(*) FILTER (WHERE a.analysis_status = 'invalid_document') AS invalid_count
  FROM public.analyses a
  WHERE a.analysis_status IN ('complete', 'invalid_document')
  GROUP BY a.rubric_version
  ORDER BY a.rubric_version;
$$;