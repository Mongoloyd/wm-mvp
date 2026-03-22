import { useState } from "react";
import type { ReportEnvelope, ReportMode, CoverageDomain } from "@/types/report-v2";
import { VerdictHeader } from "./VerdictHeader";
import { TopFindings } from "./TopFindings";
import { CoverageMap } from "./CoverageMap";
import { ActionPlan } from "./ActionPlan";
import { EvidenceExplorer } from "./EvidenceExplorer";
import { BenchmarksPanel } from "./BenchmarksPanel";
import { UnlockCTA } from "./UnlockCTA";

interface ReportShellProps {
  report: ReportEnvelope;
  onUnlock?: () => void;
  isDemoMode?: boolean;
}

export function ReportShell({ report, onUnlock, isDemoMode = false }: ReportShellProps) {
  const [evidenceFilter, setEvidenceFilter] = useState<string | null>(null);
  const mode = report.mode;
  const isPreview = mode === "preview";

  const handleShowEvidence = (findingId: string) => {
    setEvidenceFilter(findingId);
    // Scroll to evidence section
    const el = document.getElementById("evidence-explorer");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDomainClick = (domain: CoverageDomain) => {
    // Find findings linked to this domain and scroll/filter
    const row = report.coverageMap.find((r) => r.domain === domain);
    if (row?.linkedFindingIds[0]) {
      setEvidenceFilter(row.linkedFindingIds[0]);
      const el = document.getElementById("evidence-explorer");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Verdict Header — always shown */}
      <VerdictHeader verdict={report.verdict} meta={report.meta} mode={mode} />

      {/* 2. Top Findings — always shown */}
      <TopFindings
        findings={report.topFindings}
        mode={mode}
        onShowEvidence={!isPreview ? handleShowEvidence : undefined}
      />

      {/* 3. Coverage Map — always shown */}
      <CoverageMap
        rows={report.coverageMap}
        mode={mode}
        onDomainClick={!isPreview ? handleDomainClick : undefined}
      />

      {/* === PREVIEW MODE: Unlock CTA gate === */}
      {isPreview && onUnlock && (
        <UnlockCTA
          verdict={report.verdict}
          onUnlock={onUnlock}
          isDemoMode={isDemoMode}
        />
      )}

      {/* === FULL MODE: Unlocked sections === */}
      {!isPreview && (
        <>
          {/* 4. Action Plan */}
          <ActionPlan actionPlan={report.actionPlan} mode={mode} />

          {/* 5. Evidence Explorer */}
          <div id="evidence-explorer">
            <EvidenceExplorer
              evidence={report.evidenceExplorer}
              mode={mode}
              activeFindingFilter={evidenceFilter}
            />
          </div>

          {/* 6. Benchmarks & Math */}
          <BenchmarksPanel benchmarks={report.benchmarks} mode={mode} />

          {/* 7. Appendix (collapsed) */}
          {report.appendix && <AppendixPanel appendix={report.appendix} />}
        </>
      )}
    </div>
  );
}

// ── Appendix (inline, collapsed by default) ──────────────────────────────────

import { ChevronDown, ChevronUp, Database } from "lucide-react";
import type { AppendixSection } from "@/types/report-v2";

function AppendixPanel({ appendix }: { appendix: AppendixSection }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2.5 rounded-xl bg-slate-900/40 px-5 py-4 ring-1 ring-white/5 text-left transition-colors hover:bg-slate-900/60"
      >
        <Database className="h-4 w-4 text-slate-500" />
        <span className="flex-1 text-sm font-semibold text-slate-400">
          Audit Trail & Debug Data
        </span>
        <span className="text-xs text-slate-600">
          {appendix.signalAuditTrail.length} signals · v{appendix.rulesetVersion}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>

      {isOpen && (
        <div className="mt-2 rounded-xl bg-slate-900/40 ring-1 ring-white/5 p-5">
          <p className="text-xs text-slate-500 mb-3">
            Analysis: {appendix.analysisTimestampIso} · Ruleset: {appendix.rulesetVersion}
          </p>
          <div className="space-y-1.5">
            {appendix.signalAuditTrail.map((signal) => (
              <div
                key={signal.key}
                className="flex items-center gap-3 rounded-md bg-slate-800/40 px-3 py-2 text-xs"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    signal.status === "present"
                      ? "bg-emerald-400"
                      : signal.status === "missing"
                      ? "bg-red-400"
                      : "bg-amber-400"
                  }`}
                />
                <span className="font-mono text-slate-400 w-44 shrink-0 truncate">
                  {signal.key}
                </span>
                <span className="text-slate-500 uppercase text-[10px] font-semibold w-16 shrink-0">
                  {signal.status}
                </span>
                <span className="text-slate-500 truncate flex-1">
                  {signal.value ? String(signal.value) : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
