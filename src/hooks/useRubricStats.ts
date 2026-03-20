import { useEffect, useState } from "react";
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
  invalid_count: number;
}

export function useRubricStats() {
  const [rows, setRows] = useState<RubricStatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    setLoading(true);
    const { data, error: rpcErr } = await supabase.rpc("get_rubric_stats");
    if (rpcErr) {
      setError(rpcErr.message);
    } else {
      setRows((data as RubricStatRow[]) || []);
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => { refetch(); }, []);

  return { rows, loading, error, refetch };
}
