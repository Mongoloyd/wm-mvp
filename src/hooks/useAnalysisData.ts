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
  pageCount: number | null;
  openingCount: number | null;
  lineItemCount: number | null;
  qualityBand: "good" | "fair" | "poor" | null;
  hasWarranty: boolean | null;
  hasPermits: boolean | null;
  analysisStatus: string | null;
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

const ALLOWED_PILLAR_STATUSES = new Set<NonNullable<PreviewPillarEntry["status"]>>([
  "pass",
  "warn",
  "fail",
  "pending",
]);

function normalizePreviewPillarEntry(entry: unknown): PreviewPillarEntry | undefined {
  // Allow bare numeric scores, but only if they are finite.
  if (typeof entry === "number") {
    return Number.isFinite(entry) ? { score: entry } : undefined;
  }

  if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
    return undefined;
  }

  const candidate = entry as { score?: unknown; status?: unknown };
  const result: PreviewPillarEntry = {};

  if (typeof candidate.score === "number" && Number.isFinite(candidate.score)) {
    result.score = candidate.score;
  }

  if (typeof candidate.status === "string" && ALLOWED_PILLAR_STATUSES.has(candidate.status as NonNullable<PreviewPillarEntry["status"]>)) {
    result.status = candidate.status as NonNullable<PreviewPillarEntry["status"]>;
  }

  // If neither field is valid, treat as absent so we fall back to inference.
  if (!("score" in result) && !("status" in result)) {
    return undefined;
  }

  return result;
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
  const pillarScoresRaw = (previewJson as { pillar_scores?: unknown })?.pillar_scores;
  const raw =
    pillarScoresRaw && typeof pillarScoresRaw === "object" && !Array.isArray(pillarScoresRaw)
      ? (pillarScoresRaw as Record<string, unknown>)
      : undefined;

  return PILLAR_DEFS.map((def) => {
    const entry = raw?.[def.key];
    const normalizedEntry = normalizePreviewPillarEntry(entry);
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
        const previewJson = row.preview_json as Record<string, unknown> | null;
        const flags = mapFlags(row.flags);

        const qualityBandRaw = previewJson?.quality_band as string | undefined;
        const validBands = new Set(["good", "fair", "poor"]);

        setData({
          grade: row.grade,
          flags,
          contractorName: (proofOfRead?.contractor_name as string) || null,
          confidenceScore: row.confidence_score ?? null,
          pillarScores: extractPillarScores(row.preview_json, flags),
          documentType: row.document_type || null,
          pageCount: typeof proofOfRead?.page_count === "number" ? proofOfRead.page_count : null,
          openingCount: typeof proofOfRead?.opening_count === "number" ? proofOfRead.opening_count : null,
          lineItemCount: typeof proofOfRead?.line_item_count === "number" ? proofOfRead.line_item_count : null,
          qualityBand: qualityBandRaw && validBands.has(qualityBandRaw) ? (qualityBandRaw as "good" | "fair" | "poor") : null,
          hasWarranty: typeof previewJson?.has_warranty === "boolean" ? previewJson.has_warranty : null,
          hasPermits: typeof previewJson?.has_permits === "boolean" ? previewJson.has_permits : null,
          analysisStatus: typeof (row as any).analysis_status === "string" ? (row as any).analysis_status : null,
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
