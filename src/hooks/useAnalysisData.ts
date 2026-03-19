import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AnalysisFlag {
  id: number;
  severity: "red" | "amber" | "green";
  label: string;
  detail: string;
  tip: string | null;
  pillar: string | null;
}

export interface PillarScore {
  key: string;
  label: string;
  score: number | null;
  status: "pass" | "warn" | "fail" | "pending";
}

export interface AnalysisData {
  grade: string;
  flags: AnalysisFlag[];
  contractorName: string | null;
  confidenceScore: number | null;
  pillarScores: PillarScore[];
  documentType: string | null;
}

const PILLAR_DEFS: { key: string; label: string }[] = [
  { key: "safety_code", label: "Safety & Code Match" },
  { key: "install_scope", label: "Install & Scope Clarity" },
  { key: "price_fairness", label: "Price Fairness" },
  { key: "fine_print", label: "Fine Print & Transparency" },
  { key: "warranty", label: "Warranty Value" },
];

function mapSeverity(raw: string | undefined | null): "red" | "amber" | "green" {
  const s = (raw || "").toLowerCase();
  if (s === "critical" || s === "high") return "red";
  if (s === "medium") return "amber";
  return "green";
}

function pillarStatus(score: number | null): "pass" | "warn" | "fail" | "pending" {
  if (score == null) return "pending";
  if (score >= 70) return "pass";
  if (score >= 40) return "warn";
  return "fail";
}

function humanize(snake: string): string {
  return snake
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizePillarKey(raw: string | undefined | null): string | null {
  switch (raw) {
    case "safety":
      return "safety_code";
    case "install":
      return "install_scope";
    case "price":
      return "price_fairness";
    case "finePrint":
      return "fine_print";
    case "warranty":
      return "warranty";
    default:
      return raw || null;
  }
}

interface RawFlag {
  flag?: string;
  severity?: string;
  pillar?: string;
  detail?: string;
  tip?: string;
}

interface PreviewPillarEntry {
  score?: number | null;
  status?: "pass" | "warn" | "fail" | "pending" | null;
}

function mapFlags(raw: unknown): AnalysisFlag[] {
  if (!Array.isArray(raw)) return [];
  return (raw as RawFlag[]).map((f, i) => ({
    id: i + 1,
    severity: mapSeverity(f.severity),
    label: humanize(f.flag || "Unknown Issue"),
    detail: f.detail || "",
    tip: f.tip || null,
    pillar: normalizePillarKey(f.pillar),
  }));
}

function extractPillarScores(previewJson: unknown, flags: AnalysisFlag[]): PillarScore[] {
  const raw = (previewJson as Record<string, unknown>)?.pillar_scores as Record<string, unknown> | undefined;

  return PILLAR_DEFS.map((def) => {
    const entry = raw?.[def.key];
    const normalizedEntry =
      typeof entry === "number"
        ? ({ score: entry } satisfies PreviewPillarEntry)
        : (entry as PreviewPillarEntry | undefined);
    const score = normalizedEntry?.score ?? null;
    const explicitStatus = normalizedEntry?.status ?? null;

    // New preview payloads intentionally expose only teaser-safe status bands.
    if (score == null && explicitStatus) {
      return { ...def, score: null, status: explicitStatus };
    }

    // If no explicit score, infer status from flags associated with this pillar
    if (score == null) {
      const pillarFlags = flags.filter(f => f.pillar === def.key);
      const hasRed = pillarFlags.some(f => f.severity === "red");
      const hasAmber = pillarFlags.some(f => f.severity === "amber");
      const hasGreen = pillarFlags.some(f => f.severity === "green");

      if (pillarFlags.length === 0) {
        return { ...def, score: null, status: "pending" as const };
      }

      // Infer a rough score from flag severity
      if (hasRed) return { ...def, score: null, status: "fail" as const };
      if (hasAmber) return { ...def, score: null, status: "warn" as const };
      if (hasGreen) return { ...def, score: null, status: "pass" as const };
    }

    return { ...def, score, status: pillarStatus(score) };
  });
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
        const flags = mapFlags(row.flags);

        setData({
          grade: row.grade,
          flags,
          contractorName: (proofOfRead?.contractor_name as string) || null,
          confidenceScore: row.confidence_score ?? null,
          pillarScores: extractPillarScores(row.preview_json, flags),
          documentType: row.document_type || null,
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
