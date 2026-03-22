import { useState } from "react";
import type { ReportEnvelope, ReportMode, GateState, CoverageDomain } from "@/types/report-v2";
import { VerdictHeader } from "./VerdictHeader";
import { TopFindings } from "./TopFindings";
import { CoverageMap } from "./CoverageMap";
import { ActionPlan } from "./ActionPlan";
import { EvidenceExplorer } from "./EvidenceExplorer";
import { BenchmarksPanel } from "./BenchmarksPanel";
import { LockedSectionTeaser } from "../findings-gate/LockedSectionTeaser";
import { UnlockCTA } from "./UnlockCTA";

interface ReportShellV2Props {
  report: ReportEnvelope;
  mode: ReportMode;
  gateState?: GateState;
  onUnlock?: () => void;
  onOpenEvidence?: (findingId: string) => void;
  onDownload?: () => void;
  onSave?: () => void;
  onShare?: () => void;
}

export function ReportShellV2({
  report,
  mode,
  gateState = "unlocked",
  onUnlock,
  onOpenEvidence,
}: ReportShellV2Props) {
  const [evidenceFilter, setEvidenceFilter] = useState<string | null>(null);
  const isLocked = mode === "partial_reveal";

  const handleShowEvidence = (findingId: string) => {
    setEvidenceFilter(findingId);
    onOpenEvidence?.(findingId);
    const el = document.getElementById("evidence-explorer");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDomainClick = (domain: CoverageDomain) => {
    const row = report.coverageMap.find((r) => r.domain === domain);
    if (row?.linkedFindingIds[0]) {
      handleShowEvidence(row.linkedFindingIds[0]);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // PARTIAL REVEAL — the conversion-critical layout
  // Order: Verdict → Findings → Action Plan teaser → Coverage → Evidence teaser → Benchmarks teaser
  // Why: After seeing risks, "what do I do?" is the next question.
  // Action plan teaser BEFORE coverage map drives higher unlock intent.
  // ═══════════════════════════════════════════════════════════════════════

  if (isLocked) {
    return (
      <div className="space-y-8">
        {/* 1. Verdict Header — fully readable, builds authority */}
        <VerdictHeader verdict={report.verdict} meta={report.meta} mode={mode} />

        {/* 2. Top Findings — readable titles/severity/whyItMatters, blurred evidence */}
        <TopFindings
          findings={report.topFindings}
          mode={mode}
        />

        {/* 3. Action Plan teaser — BEFORE coverage. Drives "what do I do?" urgency */}
        <LockedSectionTeaser variant="action_plan" onUnlock={onUnlock} />

        {/* 4. Coverage Map — readable, non-accusatory, builds completeness trust */}
        <CoverageMap rows={report.coverageMap} mode={mode} />

        {/* 5. Evidence teaser */}
        <LockedSectionTeaser variant="evidence" onUnlock={onUnlock} />

        {/* 6. Benchmarks teaser — single line, no numbers */}
        <LockedSectionTeaser variant="benchmarks" onUnlock={onUnlock} />

        {/* 7. Unlock CTA — only shown if OTP modal is NOT visible
             (redundant when modal is open, but useful for scrolled-past state) */}
        {gateState === "unlocked" && onUnlock && (
          <UnlockCTA verdict={report.verdict} onUnlock={onUnlock} />
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FULL — the unlocked report
  // Order: Verdict → Findings → Action Plan → Evidence → Coverage → Benchmarks → Appendix
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-8">
      {/* 1. Verdict Header */}
      <VerdictHeader verdict={report.verdict} meta={report.meta} mode={mode} />

      {/* 2. Top Findings — full action lists, clickable evidence */}
      <TopFindings
        findings={report.topFindings}
        mode={mode}
        onShowEvidence={handleShowEvidence}
      />

      {/* 3. Action Plan — full renegotiation asks, contractor questions, checklist */}
      <ActionPlan actionPlan={report.actionPlan} mode={mode} />

      {/* 4. Evidence Explorer — full forensic data */}
      <div id="evidence-explorer">
        <EvidenceExplorer
          evidence={report.evidenceExplorer}
          mode={mode}
          activeFindingFilter={evidenceFilter}
        />
      </div>

      {/* 5. Coverage Map — clickable, linked to evidence */}
      <CoverageMap
        rows={report.coverageMap}
        mode={mode}
        onDomainClick={handleDomainClick}
      />

      {/* 6. Benchmarks & Math */}
      <BenchmarksPanel benchmarks={report.benchmarks} mode={mode} />

      {/* 7. Appendix */}
      {report.appendix && <AppendixPanel appendix={report.appendix} />}
    </div>
  );
}

// ── Appendix (collapsed by default) ──────────────────────────────────────────

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
