/**
 * /report/:sessionId — Standalone Findings-first Truth Report page.
 *
 * Supports:
 *   /report/demo        → Grade C preview (locked)
 *   /report/test?dev=1  → Grade D full (unlocked)
 *   /report/<uuid>      → Real data path (placeholder, loads from Supabase)
 *
 * Locked vs unlocked is controlled by:
 *   - Fixture: accessLevel baked into the fixture config
 *   - Real data: useReportAccess() reads ScanFunnelContext verification state
 *   - URL override: ?access=preview or ?access=full (dev only)
 */

import React, { useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ScanFunnelProvider } from "@/state/scanFunnel";
import { AnalysisViewModeProvider } from "@/state/analysisViewMode";
import { TruthReportFindings } from "@/components/TruthReportFindings/TruthReportFindings";
import { useAnalysisData } from "@/hooks/useAnalysisData";
import { useReportAccess, type ReportAccessLevel } from "@/hooks/useReportAccess";
import { DEV_PREVIEW_CONFIGS } from "@/dev/fixtures";
import type { AnalysisData } from "@/hooks/useAnalysisData";

/* ── Fixture map ──────────────────────────────────────────── */

interface FixtureEntry {
  data: AnalysisData;
  accessLevel: ReportAccessLevel;
  county: string;
}

const FIXTURE_MAP: Record<string, FixtureEntry> = {
  demo: {
    data: DEV_PREVIEW_CONFIGS.grade_c_preview.analysisData!,
    accessLevel: "preview",
    county: "Broward County",
  },
  test: {
    data: DEV_PREVIEW_CONFIGS.grade_d_full.analysisData!,
    accessLevel: "full",
    county: "Miami-Dade County",
  },
};

/* ── Loading shell ────────────────────────────────────────── */

function ReportLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-mono text-xs text-muted-foreground tracking-wide">
          LOADING REPORT…
        </p>
      </div>
    </div>
  );
}

/* ── Error shell ──────────────────────────────────────────── */

function ReportError({ message }: { message: string }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <p className="font-mono text-xs text-vivid-orange tracking-wide uppercase">
          Report unavailable
        </p>
        <p className="text-sm text-foreground/60">{message}</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-sm font-semibold text-cobalt hover:underline"
        >
          ← Back to home
        </button>
      </div>
    </div>
  );
}

/* ── Fixture renderer ─────────────────────────────────────── */

function FixtureReport({ fixture, accessOverride }: { fixture: FixtureEntry; accessOverride?: ReportAccessLevel }) {
  const navigate = useNavigate();
  const accessLevel = accessOverride ?? fixture.accessLevel;

  return (
    <div className="min-h-screen bg-background">
      {/* Dev badge */}
      <div className="bg-gold/10 border-b border-gold/20 px-4 py-2 text-center">
        <span className="font-mono text-[10px] text-gold tracking-wide">
          FIXTURE MODE · {accessLevel.toUpperCase()}
        </span>
      </div>
      <TruthReportFindings
        analysis={{
          grade: fixture.data.grade,
          flags: fixture.data.flags,
          pillarScores: fixture.data.pillarScores,
          contractorName: fixture.data.contractorName,
          county: fixture.county,
          confidenceScore: fixture.data.confidenceScore,
          documentType: fixture.data.documentType,
          accessLevel,
          qualityBand: fixture.data.qualityBand,
          hasWarranty: fixture.data.hasWarranty,
          hasPermits: fixture.data.hasPermits,
          pageCount: fixture.data.pageCount,
          lineItemCount: fixture.data.lineItemCount,
          onContractorMatchClick: () => console.log("[fixture] contractor match clicked"),
          onSecondScan: () => navigate("/"),
          scanSessionId: null,
        }}
      />
    </div>
  );
}

/* ── Live data renderer ───────────────────────────────────── */

function LiveReport({ sessionId, accessOverride }: { sessionId: string; accessOverride?: ReportAccessLevel }) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useAnalysisData(sessionId, true);
  const derivedAccess = useReportAccess();
  const accessLevel = accessOverride ?? derivedAccess;

  if (isLoading) return <ReportLoading />;
  if (error || !data) return <ReportError message={error || "Analysis not found for this session."} />;

  return (
    <div className="min-h-screen bg-background">
      <TruthReportFindings
        analysis={{
          grade: data.grade,
          flags: data.flags,
          pillarScores: data.pillarScores,
          contractorName: data.contractorName,
          county: "your county",
          confidenceScore: data.confidenceScore,
          documentType: data.documentType,
          accessLevel,
          qualityBand: data.qualityBand,
          hasWarranty: data.hasWarranty,
          hasPermits: data.hasPermits,
          pageCount: data.pageCount,
          lineItemCount: data.lineItemCount,
          onContractorMatchClick: () => console.log("[live] contractor match clicked"),
          onSecondScan: () => navigate("/"),
          scanSessionId: sessionId,
        }}
      />
    </div>
  );
}

/* ── Page component ───────────────────────────────────────── */

export default function ReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();

  // Dev-only access override via ?access=preview or ?access=full
  const accessOverride = useMemo<ReportAccessLevel | undefined>(() => {
    if (!import.meta.env.DEV) return undefined;
    const raw = searchParams.get("access");
    if (raw === "preview" || raw === "full") return raw;
    return undefined;
  }, [searchParams]);

  if (!sessionId) {
    return <ReportError message="No session ID provided." />;
  }

  // Check for fixture
  const fixture = FIXTURE_MAP[sessionId];
  if (fixture) {
    return (
      <ScanFunnelProvider>
        <AnalysisViewModeProvider>
          <FixtureReport fixture={fixture} accessOverride={accessOverride} />
        </AnalysisViewModeProvider>
      </ScanFunnelProvider>
    );
  }

  // Real session ID — live data path
  return (
    <ScanFunnelProvider>
      <AnalysisViewModeProvider>
        <LiveReport sessionId={sessionId} accessOverride={accessOverride} />
      </AnalysisViewModeProvider>
    </ScanFunnelProvider>
  );
}
