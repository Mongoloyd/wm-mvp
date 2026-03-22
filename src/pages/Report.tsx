import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { FindingsPageShell } from "@/components/findings-gate/FindingsPageShell";
import { getFixture, type FixtureKey } from "@/lib/report-fixtures";
import { usePhonePipeline } from "@/hooks/usePhonePipeline";
import { useScanFunnelSafe } from "@/state/scanFunnel";
import { maskPhone } from "@/utils/formatPhone";
import type { ReportEnvelope, ReportMode, GateState, OtpVerifyOutcome } from "@/types/report-v2";
import { ReportVersionToggle } from "@/components/ReportVersionToggle";

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT PAGE — Smart Container
// Route: /report/:sessionId
//
// This is the ONLY layer that touches Twilio / usePhonePipeline.
// FindingsPageShell and everything below it are pure UI orchestrators.
//
// Three data sources:
// 1. Real scan data — fetches from Supabase analyses table (TODO: wire up)
// 2. Fixture mode  — uses hardcoded fixtures for dev/design iteration
// 3. Demo mode     — sessionId === "demo", uses demo fixture
//
// Query params:
//   ?fixture=grade_d|grade_b|demo    — force a specific fixture
//   ?mode=partial_reveal|full        — force a specific render mode
//   ?gate=otp_required|otp_submitting|otp_invalid|otp_expired|unlocked
//   ?dev=1                           — show dev controls
// ═══════════════════════════════════════════════════════════════════════════════

// ── PipelineVerifyResult → OtpVerifyOutcome mapping ──────────────────────────
// usePhonePipeline returns { status: "verified" | "invalid_code" | "expired" | "error" }
// FindingsPageShell expects OtpVerifyOutcome: "verified" | "invalid" | "expired" | "error"
const PIPELINE_TO_OUTCOME: Record<string, OtpVerifyOutcome> = {
  verified: "verified",
  invalid_code: "invalid",
  expired: "expired",
  error: "error",
};

export default function Report() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Dev controls from URL
  const fixtureParam = searchParams.get("fixture") as FixtureKey | null;
  const modeParam = searchParams.get("mode") as ReportMode | null;
  const gateParam = searchParams.get("gate") as GateState | null;
  const showDev = searchParams.get("dev") === "1";

  // State
  const [report, setReport] = useState<ReportEnvelope | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialGateState, setInitialGateState] = useState<GateState>(
    gateParam || "otp_required"
  );
  const isDemoMode = sessionId === "demo";

  // ── Funnel context (safe — returns null if outside provider) ───────────
  const funnel = useScanFunnelSafe();

  // ── Phone pipeline — the ONLY Twilio touchpoint ────────────────────────
  // Bootstraps from funnel's persisted phoneE164 when available, so the
  // user doesn't re-enter their number if they came through the scan flow.
  const pipeline = usePhonePipeline("validate_and_send_otp", {
    scanSessionId: sessionId ?? null,
    externalPhoneE164: funnel?.phoneE164 ?? null,
    onVerified: () => {
      funnel?.setPhoneStatus("verified");
    },
  });

  // ── Derive phoneMasked from the best available phone ───────────────────
  // Priority: funnel E.164 > pipeline E.164 > default placeholder
  const phoneMasked = (() => {
    const phone = funnel?.phoneE164 || pipeline.e164;
    return phone ? maskPhone(phone) : "(•••) •••-••••";
  })();

  // ── Callbacks for FindingsPageShell (page layer owns all Twilio logic) ─

  const handleSubmitOtp = useCallback(
    async (code: string): Promise<OtpVerifyOutcome> => {
      const result = await pipeline.submitOtp(code);
      return PIPELINE_TO_OUTCOME[result.status] || "error";
    },
    [pipeline]
  );

  const handleResendOtp = useCallback(async () => {
    await pipeline.resend();
  }, [pipeline]);

  const handleEditPhone = useCallback(() => {
    pipeline.reset();
    // In the future, this could navigate back to the phone entry step
    // or open an inline phone editor. For now, reset clears the pipeline.
  }, [pipeline]);

  // ── Data loading ───────────────────────────────────────────────────────

  useEffect(() => {
    async function loadReport() {
      setIsLoading(true);
      setError(null);

      try {
        const resolvedMode = modeParam || "partial_reveal";

        // Priority 1: Fixture override (dev mode)
        if (fixtureParam && fixtureParam in { grade_d: 1, grade_b: 1, demo: 1 }) {
          const fixture = getFixture(fixtureParam, resolvedMode);
          setReport(fixture);
          setIsLoading(false);
          return;
        }

        // Priority 2: Demo mode
        if (isDemoMode) {
          const fixture = getFixture("demo", resolvedMode);
          setReport(fixture);
          setIsLoading(false);
          return;
        }

        // Priority 3: Real scan data from Supabase
        // TODO: Uncomment when wiring to real data
        // const { data, error: dbError } = await supabase
        //   .from("analyses")
        //   .select("*")
        //   .eq("scan_session_id", sessionId)
        //   .single();
        //
        // if (dbError || !data) {
        //   setError("Report not found");
        //   setIsLoading(false);
        //   return;
        // }
        //
        // const envelope = transformToV2({
        //   scanSessionId: sessionId!,
        //   leadId: data.lead_id,
        //   fullJson: data.full_json,
        //   previewJson: data.preview_json,
        //   proofOfRead: data.proof_of_read,
        //   confidenceScore: data.confidence_score,
        // }, resolvedMode);
        //
        // setReport(envelope);

        // Fallback: show Grade D fixture until real data is wired
        const fixture = getFixture("grade_d", resolvedMode);
        setReport(fixture);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load report:", err);
        setError("Something went wrong loading your report.");
        setIsLoading(false);
      }
    }

    loadReport();
  }, [sessionId, fixtureParam, modeParam, isDemoMode]);

  // Sync gate state from URL param
  useEffect(() => {
    if (gateParam) {
      setInitialGateState(gateParam);
    }
  }, [gateParam]);

  // ── Loading state ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F1A] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 mx-auto rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
          <p className="text-sm text-slate-500">Loading your report...</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#0A0F1A] flex items-center justify-center">
        <div className="text-center space-y-3 max-w-sm">
          <p className="text-lg font-semibold text-white">Report Not Found</p>
          <p className="text-sm text-slate-400">
            {error || "We couldn't find a report for this session."}
          </p>
          <a
            href="/"
            className="inline-block mt-4 rounded-lg bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 ring-1 ring-white/10 hover:bg-white/10 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0A0F1A]">
      {/* Page header — sticky, above everything except modal */}
      <header className="border-b border-white/5 bg-[#0A0F1A]/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-lg font-bold text-white" style={{ letterSpacing: "-0.03em" }}>
              <span className="text-[#1A6FD4]">Window</span>Man
            </a>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 hidden sm:inline">
              AI Quote Analysis
            </span>
          </div>

          {isDemoMode && (
            <span className="rounded-md bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Demo Report
            </span>
          )}
        </div>
      </header>

      {/* Report content with FindingsPageShell orchestrator */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Report ID bar */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-[11px] font-mono text-slate-600 uppercase tracking-wider">
            Report ID: WM-{(sessionId || "demo").slice(0, 8).toUpperCase()}
          </p>
          <p className="text-[11px] text-slate-600">
            {new Date(report.meta.generatedAtIso).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <FindingsPageShell
          report={report}
          phoneMasked={phoneMasked}
          isDemoMode={isDemoMode}
          initialGateState={initialGateState}
          onSubmitOtp={handleSubmitOtp}
          onResendOtp={handleResendOtp}
          onEditPhone={handleEditPhone}
        />
      </main>

      {/* Version toggle */}
      <ReportVersionToggle sessionId={sessionId} />

      {/* Dev controls */}
      {showDev && (
        <DevControls
          sessionId={sessionId}
          searchParams={searchParams}
          setSearchParams={setSearchParams}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEV CONTROLS — floating panel with fixture, mode, and gate state selectors
// ═══════════════════════════════════════════════════════════════════════════════

function DevControls({
  sessionId,
  searchParams,
  setSearchParams,
}: {
  sessionId?: string;
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams) => void;
}) {
  const currentFixture = searchParams.get("fixture") || "grade_d";
  const currentMode = searchParams.get("mode") || "partial_reveal";
  const currentGate = searchParams.get("gate") || "otp_required";

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    next.set("dev", "1");
    setSearchParams(next);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] rounded-xl bg-slate-950 ring-1 ring-white/10 p-4 shadow-2xl w-72">
      <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-3">
        Dev Controls
      </p>

      {/* Fixture selector */}
      <div className="mb-3">
        <p className="text-[10px] text-slate-500 mb-1">Fixture</p>
        <div className="flex rounded-lg bg-slate-900 p-0.5 gap-0.5">
          {(["grade_d", "grade_b", "demo"] as const).map((key) => (
            <button
              key={key}
              onClick={() => updateParam("fixture", key)}
              className={`flex-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors ${
                currentFixture === key
                  ? "bg-cyan-500/15 text-cyan-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {key.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Mode selector */}
      <div className="mb-3">
        <p className="text-[10px] text-slate-500 mb-1">Mode</p>
        <div className="flex rounded-lg bg-slate-900 p-0.5 gap-0.5">
          {(["partial_reveal", "full"] as ReportMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => updateParam("mode", mode)}
              className={`flex-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors ${
                currentMode === mode
                  ? "bg-cyan-500/15 text-cyan-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {mode.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Gate state selector */}
      <div className="mb-3">
        <p className="text-[10px] text-slate-500 mb-1">Gate State</p>
        <div className="flex flex-wrap rounded-lg bg-slate-900 p-0.5 gap-0.5">
          {(["otp_required", "otp_submitting", "otp_invalid", "otp_expired", "unlocked"] as GateState[]).map(
            (gate) => (
              <button
                key={gate}
                onClick={() => updateParam("gate", gate)}
                className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                  currentGate === gate
                    ? "bg-orange-500/15 text-orange-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {gate.replace("otp_", "").replace("_", " ")}
              </button>
            )
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="border-t border-white/5 pt-2 mt-2">
        <p className="text-[10px] text-slate-600">
          Session: {sessionId || "none"}
        </p>
      </div>
    </div>
  );
}
