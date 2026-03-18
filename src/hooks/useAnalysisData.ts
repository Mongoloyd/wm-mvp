import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AnalysisFlag {
  id: number;
  severity: "red" | "amber" | "green";
  label: string;
  detail: string;
  tip: string | null;
}

export interface AnalysisData {
  grade: string;
  flags: AnalysisFlag[];
  contractorName: string | null;
  confidenceScore: number | null;
}

function mapSeverity(raw: string | undefined | null): "red" | "amber" | "green" {
  const s = (raw || "").toLowerCase();
  if (s === "critical" || s === "high") return "red";
  if (s === "medium") return "amber";
  return "green";
}

function humanize(snake: string): string {
  return snake
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface RawFlag {
  flag?: string;
  severity?: string;
  pillar?: string;
  detail?: string;
}

function mapFlags(raw: unknown): AnalysisFlag[] {
  if (!Array.isArray(raw)) return [];
  return (raw as RawFlag[]).map((f, i) => ({
    id: i + 1,
    severity: mapSeverity(f.severity),
    label: humanize(f.flag || "Unknown Issue"),
    detail: f.detail || "",
    tip: null,
  }));
}

interface UseAnalysisDataResult {
  data: AnalysisData | null;
  isLoading: boolean;
  error: string | null;
}

export function useAnalysisData(
  scanSessionId: string | null,
  enabled: boolean
): UseAnalysisDataResult {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !scanSessionId || fetchedRef.current === scanSessionId) return;

    fetchedRef.current = scanSessionId;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const { data: rows, error: rpcErr } = await supabase.rpc(
          "get_analysis_preview",
          { p_scan_session_id: scanSessionId }
        );

        if (rpcErr) {
          setError("Failed to load analysis.");
          console.error("get_analysis_preview error:", rpcErr);
          setIsLoading(false);
          return;
        }

        const row = Array.isArray(rows) ? rows[0] : rows;
        if (!row || !row.grade) {
          setError("Analysis not found.");
          setIsLoading(false);
          return;
        }

        const proofOfRead = row.proof_of_read as Record<string, unknown> | null;

        setData({
          grade: row.grade,
          flags: mapFlags(row.flags),
          contractorName: (proofOfRead?.contractor_name as string) || null,
          confidenceScore: row.confidence_score ?? null,
        });
      } catch (err) {
        console.error("useAnalysisData exception:", err);
        setError("Unexpected error loading analysis.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [scanSessionId, enabled]);

  return { data, isLoading, error };
}
