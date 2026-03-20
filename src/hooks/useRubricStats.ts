import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RubricStatRow {
  rubric_version: string | null;
  total_count: number;
  grade_a: number;
  grade_b: number;
  grade_c: number;
  grade_d: number;
  grade_f: number;
  avg_confidence: number | null;
  min_confidence: number | null;
  max_confidence: number | null;
  avg_grade_score: number | null;
  invalid_count: number;
}

export function useRubricStats(days: number | null = null) {
  const [rows, setRows] = useState<RubricStatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const args = days != null ? { p_days: days } : {};
    const { data, error: rpcErr } = await supabase.rpc("get_rubric_stats", args as any);
    if (rpcErr) {
      setError(rpcErr.message);
    } else {
      setRows((data as RubricStatRow[]) || []);
      setError(null);
    }
    setLoading(false);
  }, [days]);

  useEffect(() => { refetch(); }, [refetch]);

  return { rows, loading, error, refetch };
}
