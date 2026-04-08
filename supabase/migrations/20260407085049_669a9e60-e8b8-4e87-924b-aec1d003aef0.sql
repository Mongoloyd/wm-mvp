DROP FUNCTION IF EXISTS public.get_rubric_stats(integer);

CREATE OR REPLACE FUNCTION public.get_rubric_stats(p_days integer DEFAULT NULL::integer)
 RETURNS TABLE(
   rubric_version text,
   total_count bigint,
   grade_a bigint,
   grade_b bigint,
   grade_c bigint,
   grade_d bigint,
   grade_f bigint,
   avg_confidence numeric,
   min_confidence numeric,
   max_confidence numeric,
   avg_grade_score numeric,
   invalid_count bigint,
   avg_safety numeric,
   avg_install numeric,
   avg_price numeric,
   avg_fine_print numeric,
   avg_warranty numeric,
   hard_cap_no_warranty bigint,
   hard_cap_critical_safety bigint,
   hard_cap_no_impact bigint,
   hard_cap_zero_items bigint
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_internal_operator() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    a.rubric_version,
    COUNT(*)                                          AS total_count,
    COUNT(*) FILTER (WHERE a.grade = 'A')             AS grade_a,
    COUNT(*) FILTER (WHERE a.grade = 'B')             AS grade_b,
    COUNT(*) FILTER (WHERE a.grade = 'C')             AS grade_c,
    COUNT(*) FILTER (WHERE a.grade = 'D')             AS grade_d,
    COUNT(*) FILTER (WHERE a.grade = 'F')             AS grade_f,
    ROUND(AVG(a.confidence_score), 1)                 AS avg_confidence,
    ROUND(MIN(a.confidence_score), 1)                 AS min_confidence,
    ROUND(MAX(a.confidence_score), 1)                 AS max_confidence,
    ROUND(
      (
        COUNT(*) FILTER (WHERE a.grade = 'A') * 4 +
        COUNT(*) FILTER (WHERE a.grade = 'B') * 3 +
        COUNT(*) FILTER (WHERE a.grade = 'C') * 2 +
        COUNT(*) FILTER (WHERE a.grade = 'D') * 1
      )::numeric / NULLIF(
        COUNT(*) FILTER (WHERE a.grade IN ('A','B','C','D','F')), 0
      ), 2
    )                                                 AS avg_grade_score,
    COUNT(*) FILTER (WHERE a.analysis_status = 'invalid_document') AS invalid_count,
    ROUND(AVG((a.full_json->'pillar_scores'->>'safety')::numeric), 1)     AS avg_safety,
    ROUND(AVG((a.full_json->'pillar_scores'->>'install')::numeric), 1)    AS avg_install,
    ROUND(AVG((a.full_json->'pillar_scores'->>'price')::numeric), 1)      AS avg_price,
    ROUND(AVG((a.full_json->'pillar_scores'->>'fine_print')::numeric), 1) AS avg_fine_print,
    ROUND(AVG((a.full_json->'pillar_scores'->>'warranty')::numeric), 1)   AS avg_warranty,
    COUNT(*) FILTER (WHERE a.full_json->>'hard_cap_applied' = 'no_warranty_section')  AS hard_cap_no_warranty,
    COUNT(*) FILTER (WHERE a.full_json->>'hard_cap_applied' = 'critical_safety')      AS hard_cap_critical_safety,
    COUNT(*) FILTER (WHERE a.full_json->>'hard_cap_applied' = 'no_impact_products')   AS hard_cap_no_impact,
    COUNT(*) FILTER (WHERE a.full_json->>'hard_cap_applied' = 'zero_line_items')      AS hard_cap_zero_items
  FROM public.analyses a
  WHERE a.analysis_status IN ('complete', 'invalid_document')
    AND (p_days IS NULL OR a.created_at >= now() - (p_days || ' days')::interval)
  GROUP BY a.rubric_version
  ORDER BY a.rubric_version;
END;
$function$;