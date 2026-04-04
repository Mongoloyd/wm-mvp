/**
 * useAnalysisData — Two-phase analysis data hook.
 *
 * Phase 1 (preview): Called on mount. Returns grade, flag counts, pillar bands,
 *   metadata. Flags array is EMPTY — not fetched from backend.
 *
 * Phase 2 (full): Called after OTP verification via fetchFull(phoneE164).
 *   Backend checks phone_verifications.status = 'verified' before returning
 *   the complete flags array and full_json.
 *
 * SECURITY: The backend is the gate. This hook enforces a two-fetch model
 *   so the frontend never has actionable findings data until the backend
 *   has confirmed verification.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getVerifiedAccess, saveVerifiedAccess, clearVerifiedAccess } from "@/lib/verifiedAccess";
import { trackEvent } from "@/lib/trackEvent";

// ── Public types ─────────────────────────────────────────────────────────────

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
  /** Aggregate counts — available from preview even when flags[] is empty */
  flagCount: number;
  flagRedCount: number;
  flagAmberCount: number;
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
  /** Financial metrics from calculate-estimate-metrics (full only) */
  derivedMetrics?: Record<string, unknown> | null;
}

// ── Constants ────────────────────────────────────────────────────────────────

const PILLAR_DEFS: { key: string; label: string }[] = [
  { key: "safety_code", label: "Safety & Code Match" },
  { key: "install_scope", label: "Install & Scope Clarity" },
  { key: "price_fairness", label: "Price Fairness" },
  { key: "fine_print", label: "Fine Print & Transparency" },
  { key: "warranty", label: "Warranty Value" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapSeverity(raw: string | undefined | null): "red" | "amber" | "green" {
  const s = (raw || "").toLowerCase();
  if (s === "critical" || s === "high") return "red";
  if (s === "medium") return "amber";
  // Explicit green only for known-positive severities
  if (s === "low" || s === "info" || s === "pass" || s === "confirmed") return "amber";
  if (s === "green" || s === "ok" || s === "good") return "green";
  // Unknown/unrecognized severities must never silently become "confirmed"
  return "amber";
}

function pillarStatus(score: number | null): "pass" | "warn" | "fail" | "pending" {
  if (score == null) return "pending";
  if (score >= 70) return "pass";
  if (score >= 40) return "warn";
  return "fail";
}

function humanize(snake: string): string {
  return snake.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizePillarKey(raw: string | undefined | null): string | null {
  switch (raw) {
    case "safety": return "safety_code";
    case "install": return "install_scope";
    case "price": return "price_fairness";
    case "finePrint": return "fine_print";
    case "warranty": return "warranty";
    default: return raw || null;
  }
}

interface RawFlag {
  flag?: string;
  severity?: string;
  pillar?: string;
  detail?: string;
  tip?: string;
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

interface PreviewPillarEntry {
  score?: number | null;
  status?: "pass" | "warn" | "fail" | "pending" | null;
}

const ALLOWED_PILLAR_STATUSES = new Set(["pass", "warn", "fail", "pending"]);

function normalizePreviewPillarEntry(entry: unknown): PreviewPillarEntry | undefined {
  if (typeof entry === "number") return Number.isFinite(entry) ? { score: entry } : undefined;
  if (entry === null || typeof entry !== "object" || Array.isArray(entry)) return undefined;
  const candidate = entry as { score?: unknown; status?: unknown };
  const result: PreviewPillarEntry = {};
  if (typeof candidate.score === "number" && Number.isFinite(candidate.score)) result.score = candidate.score;
  if (typeof candidate.status === "string" && ALLOWED_PILLAR_STATUSES.has(candidate.status))
    result.status = candidate.status as "pass" | "warn" | "fail" | "pending";
  if (!("score" in result) && !("status" in result)) return undefined;
  return result;
}

function extractPillarScores(previewJson: unknown): PillarScore[] {
  const pillarScoresRaw = (previewJson as { pillar_scores?: unknown })?.pillar_scores;
  const raw = pillarScoresRaw && typeof pillarScoresRaw === "object" && !Array.isArray(pillarScoresRaw)
    ? (pillarScoresRaw as Record<string, unknown>) : undefined;

  return PILLAR_DEFS.map((def) => {
    const entry = raw?.[def.key];
    const norm = normalizePreviewPillarEntry(entry);
    const score = norm?.score ?? null;
    const explicitStatus = norm?.status ?? null;
    if (score == null && explicitStatus) return { ...def, score: null, status: explicitStatus };
    return { ...def, score, status: pillarStatus(score) };
  });
}

function extractPillarScoresWithFlags(previewJson: unknown, flags: AnalysisFlag[]): PillarScore[] {
  const base = extractPillarScores(previewJson);
  return base.map((def) => {
    if (def.status !== "pending") return def;
    const pillarFlags = flags.filter(f => f.pillar === def.key);
    if (pillarFlags.length === 0) return def;
    if (pillarFlags.some(f => f.severity === "red")) return { ...def, status: "fail" as const };
    if (pillarFlags.some(f => f.severity === "amber")) return { ...def, status: "warn" as const };
    return { ...def, status: "pass" as const };
  });
}

// ── Hook return ──────────────────────────────────────────────────────────────

export interface UseAnalysisDataResult {
  data: AnalysisData | null;
  isLoading: boolean;
  error: string | null;
  /** Call after OTP success. Pass the verified E.164 phone. */
  fetchFull: (phoneE164: string) => Promise<void>;
  isLoadingFull: boolean;
  isFullLoaded: boolean;
  /** Try to resume a previously verified session from localStorage. */
  tryResume: () => Promise<boolean>;
  /** True while tryResume is running */
  isResuming: boolean;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAnalysisData(
  scanSessionId: string | null,
  enabled: boolean
): UseAnalysisDataResult {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingFull, setIsLoadingFull] = useState(false);
  const [isFullLoaded, setIsFullLoaded] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const previewFetchedRef = useRef<string | null>(null);
  const resumeAttemptedRef = useRef<string | null>(null);

  // ── Reset all state when scanSessionId changes (e.g. "Start New Scan") ──
  useEffect(() => {
    setData(null);
    setIsFullLoaded(false);
    setIsLoadingFull(false);
    setIsLoading(false);
    setError(null);
    setIsResuming(false);
    previewFetchedRef.current = null;
    resumeAttemptedRef.current = null;
  }, [scanSessionId]);

  // ── Phase 1: Preview fetch ─────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !scanSessionId || previewFetchedRef.current === scanSessionId) return;

    setIsLoading(true);
    setError(null);
    let retryTimer: number | undefined;
    let cancelled = false;

    const TERMINAL_STATUSES = new Set(["invalid_document", "failed", "error", "unreadable"]);

    const doFetch = async (attempt: number) => {
      try {
        // Pre-check: short-circuit if scan session reached a terminal status
        if (attempt > 0) {
          const { data: statusRows } = await supabase.rpc("get_scan_status", {
            p_scan_session_id: scanSessionId,
          });
          const sessionStatus = Array.isArray(statusRows) ? statusRows[0]?.status : (statusRows as any)?.status;
          if (sessionStatus && TERMINAL_STATUSES.has(sessionStatus)) {
            console.warn("[useAnalysisData] terminal session status:", sessionStatus);
            setData({
              grade: "N/A", flags: [], flagCount: 0, flagRedCount: 0, flagAmberCount: 0,
              contractorName: null, confidenceScore: null, pillarScores: PILLAR_DEFS.map(d => ({ ...d, score: null, status: "pending" as const })),
              documentType: null, pageCount: null, openingCount: null, lineItemCount: null,
              qualityBand: null, hasWarranty: null, hasPermits: null, analysisStatus: sessionStatus,
            });
            setIsLoading(false);
            previewFetchedRef.current = scanSessionId;
            return;
          }
        }

        const { data: rows, error: rpcErr } = await supabase.rpc(
          "get_analysis_preview",
          { p_scan_session_id: scanSessionId }
        );
        if (cancelled) return;
        if (rpcErr) {
          console.error("get_analysis_preview error:", rpcErr);
          if (attempt < 8) { retryTimer = window.setTimeout(() => doFetch(attempt + 1), 2500); return; }
          setError("Failed to load analysis."); setIsLoading(false); return;
        }
        const row = Array.isArray(rows) ? rows[0] : rows;
        if (!row || !row.grade) {
          if (attempt < 8) { retryTimer = window.setTimeout(() => doFetch(attempt + 1), 2500); return; }
          setError("Analysis not found."); setIsLoading(false); return;
        }

        previewFetchedRef.current = scanSessionId;
        trackEvent({ event_name: "preview_rendered", session_id: scanSessionId, metadata: { grade: row.grade, flag_count: row.flag_count } });

        const proofOfRead = row.proof_of_read as Record<string, unknown> | null;
        const previewJson = row.preview_json as Record<string, unknown> | null;
        const qualityBandRaw = previewJson?.quality_band as string | undefined;
        const validBands = new Set(["good", "fair", "poor"]);

        setData({
          grade: row.grade,
          flags: [],                           // ← EMPTY in preview
          flagCount: row.flag_count ?? 0,
          flagRedCount: row.flag_red_count ?? 0,
          flagAmberCount: row.flag_amber_count ?? 0,
          contractorName: (proofOfRead?.contractor_name as string) || null,
          confidenceScore: row.confidence_score ?? null,
          pillarScores: extractPillarScores(row.preview_json),
          documentType: row.document_type || null,
          pageCount: typeof proofOfRead?.page_count === "number" ? proofOfRead.page_count : null,
          openingCount: typeof proofOfRead?.opening_count === "number" ? proofOfRead.opening_count : null,
          lineItemCount: typeof proofOfRead?.line_item_count === "number" ? proofOfRead.line_item_count : null,
          qualityBand: qualityBandRaw && validBands.has(qualityBandRaw) ? (qualityBandRaw as "good" | "fair" | "poor") : null,
          hasWarranty: typeof previewJson?.has_warranty === "boolean" ? previewJson.has_warranty : null,
          hasPermits: typeof previewJson?.has_permits === "boolean" ? previewJson.has_permits : null,
          analysisStatus: "complete",
        });
      } catch (err) {
        if (cancelled) return;
        console.error("useAnalysisData exception:", err);
        if (attempt < 8) { retryTimer = window.setTimeout(() => doFetch(attempt + 1), 2500); return; }
        setError("Unexpected error loading analysis.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    doFetch(0);
    return () => { cancelled = true; if (retryTimer) clearTimeout(retryTimer); };
  }, [scanSessionId, enabled]);

  // ── Dev bypass helper ────────────────────────────────────────────────
  const devBypassEnabled =
    import.meta.env.DEV && !!import.meta.env.VITE_DEV_BYPASS_SECRET;

  const fetchFullViaDevBypass = useCallback(
    async (sessionId: string) => {
      const { data: fnData, error: fnErr } = await supabase.functions.invoke(
        "dev-report-unlock",
        { body: { scan_session_id: sessionId, dev_secret: import.meta.env.VITE_DEV_BYPASS_SECRET } }
      );
      if (fnErr) throw fnErr;
      // Edge function returns the row directly (not wrapped in array)
      return fnData;
    },
    []
  );

  // ── Phase 2: Full gated fetch ──────────────────────────────────────────
  const fetchFull = useCallback(async (phoneE164: string) => {
    
    if (!scanSessionId || isFullLoaded) {
      console.warn("[fetchFull] skipped — missing scanSessionId or already loaded", { scanSessionId, isFullLoaded });
      return;
    }
    setIsLoadingFull(true);
    try {
      let row: any;

      if (devBypassEnabled) {
        console.info("[fetchFull] 🔓 DEV BYPASS — skipping get_analysis_full RPC");
        row = await fetchFullViaDevBypass(scanSessionId);
      } else {
        const { data: rows, error: rpcErr } = await (supabase.rpc as any)(
          "get_analysis_full",
          { p_scan_session_id: scanSessionId, p_phone_e164: phoneE164 }
        );
        if (rpcErr) { console.error("[fetchFull] get_analysis_full error:", rpcErr); return; }
        row = Array.isArray(rows) ? rows[0] : rows;
      }
      if (!row || !row.grade) { console.error("[fetchFull] returned empty", { row }); return; }

      const proofOfRead = row.proof_of_read as Record<string, unknown> | null;
      const previewJson = row.preview_json as Record<string, unknown> | null;
      const fullJsonRaw = row.full_json as Record<string, unknown> | null;
      const flags = mapFlags(row.flags);
      const qualityBandRaw = previewJson?.quality_band as string | undefined;
      const validBands = new Set(["good", "fair", "poor"]);

      // Extract derived_metrics from full_json (computed by scan-quote)
      const derivedMetrics = (fullJsonRaw?.derived_metrics as Record<string, unknown>) || null;

      setData({
        grade: row.grade,
        flags,
        flagCount: flags.length,
        flagRedCount: flags.filter(f => f.severity === "red").length,
        flagAmberCount: flags.filter(f => f.severity === "amber").length,
        contractorName: (proofOfRead?.contractor_name as string) || null,
        confidenceScore: row.confidence_score ?? null,
        pillarScores: extractPillarScoresWithFlags(row.preview_json, flags),
        documentType: row.document_type || null,
        pageCount: typeof proofOfRead?.page_count === "number" ? proofOfRead.page_count : null,
        openingCount: typeof proofOfRead?.opening_count === "number" ? proofOfRead.opening_count : null,
        lineItemCount: typeof proofOfRead?.line_item_count === "number" ? proofOfRead.line_item_count : null,
        qualityBand: qualityBandRaw && validBands.has(qualityBandRaw) ? (qualityBandRaw as "good" | "fair" | "poor") : null,
        hasWarranty: typeof previewJson?.has_warranty === "boolean" ? previewJson.has_warranty : null,
        hasPermits: typeof previewJson?.has_permits === "boolean" ? previewJson.has_permits : null,
        analysisStatus: "complete",
        derivedMetrics,
      });
      setIsFullLoaded(true);
      // Save resume record for returning users
      saveVerifiedAccess(scanSessionId, phoneE164);
      trackEvent({ event_name: "report_unlocked", session_id: scanSessionId, metadata: { grade: row.grade, flag_count: flags.length } });
      
    } catch (err) {
      console.error("[fetchFull] exception:", err);
    } finally {
      setIsLoadingFull(false);
    }
  }, [scanSessionId, isFullLoaded, devBypassEnabled, fetchFullViaDevBypass]);

  // ── Phase 3: Auto-resume for returning verified users ─────────────────
  const tryResume = useCallback(async (): Promise<boolean> => {
    if (!scanSessionId || isFullLoaded) return false;
    if (resumeAttemptedRef.current === scanSessionId) return false;
    resumeAttemptedRef.current = scanSessionId;

    const record = getVerifiedAccess(scanSessionId);
    if (!record && !devBypassEnabled) {
      return false;
    }


    setIsResuming(true);
    try {
      let row: any;

      if (devBypassEnabled) {
        console.info("[tryResume] 🔓 DEV BYPASS — skipping get_analysis_full RPC");
        try {
          row = await fetchFullViaDevBypass(scanSessionId);
        } catch (e) {
          console.warn("[tryResume] dev bypass error", e);
          return false;
        }
      } else {
        const { data: rows, error: rpcErr } = await (supabase.rpc as any)(
          "get_analysis_full",
          { p_scan_session_id: scanSessionId, p_phone_e164: record.phone_e164 }
        );

        if (rpcErr) {
          console.warn("[tryResume] RPC error — clearing stale record", rpcErr);
          clearVerifiedAccess();
          return false;
        }
        row = Array.isArray(rows) ? rows[0] : rows;
      }

      if (!row || !row.grade) {
        console.warn("[tryResume] empty result — clearing stale record");
        clearVerifiedAccess();
        return false;
      }

      const proofOfRead = row.proof_of_read as Record<string, unknown> | null;
      const previewJson = row.preview_json as Record<string, unknown> | null;
      const fullJsonRaw = row.full_json as Record<string, unknown> | null;
      const flags = mapFlags(row.flags);
      const qualityBandRaw = previewJson?.quality_band as string | undefined;
      const validBands = new Set(["good", "fair", "poor"]);

      const derivedMetrics = (fullJsonRaw?.derived_metrics as Record<string, unknown>) || null;

      setData({
        grade: row.grade,
        flags,
        flagCount: flags.length,
        flagRedCount: flags.filter(f => f.severity === "red").length,
        flagAmberCount: flags.filter(f => f.severity === "amber").length,
        contractorName: (proofOfRead?.contractor_name as string) || null,
        confidenceScore: row.confidence_score ?? null,
        pillarScores: extractPillarScoresWithFlags(row.preview_json, flags),
        documentType: row.document_type || null,
        pageCount: typeof proofOfRead?.page_count === "number" ? proofOfRead.page_count : null,
        openingCount: typeof proofOfRead?.opening_count === "number" ? proofOfRead.opening_count : null,
        lineItemCount: typeof proofOfRead?.line_item_count === "number" ? proofOfRead.line_item_count : null,
        qualityBand: qualityBandRaw && validBands.has(qualityBandRaw) ? (qualityBandRaw as "good" | "fair" | "poor") : null,
        hasWarranty: typeof previewJson?.has_warranty === "boolean" ? previewJson.has_warranty : null,
        hasPermits: typeof previewJson?.has_permits === "boolean" ? previewJson.has_permits : null,
        analysisStatus: "complete",
        derivedMetrics,
      });
      previewFetchedRef.current = scanSessionId;
      setIsFullLoaded(true);
      trackEvent({ event_name: "resume_flow_triggered", session_id: scanSessionId, metadata: { grade: row.grade } });
      
      return true;
    } catch (err) {
      console.error("[tryResume] exception — clearing stale record", err);
      clearVerifiedAccess();
      return false;
    } finally {
      setIsResuming(false);
    }
  }, [scanSessionId, isFullLoaded, devBypassEnabled, fetchFullViaDevBypass]);

  return { data, isLoading, error, fetchFull, isLoadingFull, isFullLoaded, tryResume, isResuming };
}
