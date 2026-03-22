import { Download, Share2 } from "lucide-react";
import type { VerdictHeader as VerdictHeaderType, ReportMeta, ReportMode, Grade } from "@/types/report-v2";
import { TrustStrip } from "./TrustStrip";

interface VerdictHeaderProps {
  verdict: VerdictHeaderType;
  meta: ReportMeta;
  mode: ReportMode;
}

const GRADE_STYLES: Record<Grade, { ring: string; text: string; bg: string; glow: string }> = {
  A: {
    ring: "ring-emerald-500",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    glow: "shadow-[0_0_40px_rgba(16,185,129,0.15)]",
  },
  B: {
    ring: "ring-cyan-500",
    text: "text-cyan-400",
    bg: "bg-cyan-500/10",
    glow: "shadow-[0_0_40px_rgba(6,182,212,0.15)]",
  },
  C: {
    ring: "ring-amber-500",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    glow: "shadow-[0_0_40px_rgba(245,158,11,0.15)]",
  },
  D: {
    ring: "ring-orange-500",
    text: "text-orange-400",
    bg: "bg-orange-500/10",
    glow: "shadow-[0_0_40px_rgba(249,115,22,0.15)]",
  },
  F: {
    ring: "ring-red-500",
    text: "text-red-400",
    bg: "bg-red-500/10",
    glow: "shadow-[0_0_40px_rgba(239,68,68,0.15)]",
  },
};

const CHIP_STYLES: Record<string, { bg: string; text: string }> = {
  overpriced: { bg: "bg-red-500/10", text: "text-red-400" },
  scope_gaps: { bg: "bg-orange-500/10", text: "text-orange-400" },
  risky_clauses: { bg: "bg-amber-500/10", text: "text-amber-400" },
  warranty_imbalance: { bg: "bg-yellow-500/10", text: "text-yellow-400" },
  compliance_unclear: { bg: "bg-red-500/10", text: "text-red-400" },
  identity_concern: { bg: "bg-purple-500/10", text: "text-purple-400" },
  well_specified: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  fair_pricing_visible: { bg: "bg-cyan-500/10", text: "text-cyan-400" },
};

const CHIP_LABELS: Record<string, string> = {
  overpriced: "Overpriced",
  scope_gaps: "Scope Gaps",
  risky_clauses: "Risky Clauses",
  warranty_imbalance: "Warranty Imbalance",
  compliance_unclear: "Compliance Unclear",
  identity_concern: "Identity Concern",
  well_specified: "Well Specified",
  fair_pricing_visible: "Fair Pricing",
};

export function VerdictHeader({ verdict, meta, mode }: VerdictHeaderProps) {
  const gradeStyle = GRADE_STYLES[verdict.grade];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900/80 ring-1 ring-white/5">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800/50" />

      <div className="relative px-6 py-8 sm:px-8 sm:py-10">
        {/* Top row: Grade + Verdict + Actions */}
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          {/* Grade circle */}
          <div
            className={`
              flex h-24 w-24 shrink-0 items-center justify-center
              rounded-full ring-2 ${gradeStyle.ring} ${gradeStyle.bg} ${gradeStyle.glow}
              sm:h-28 sm:w-28
            `}
          >
            <span
              className={`text-5xl font-bold tracking-tight ${gradeStyle.text} sm:text-6xl`}
              style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em" }}
            >
              {verdict.grade}
            </span>
          </div>

          {/* Stance + chips */}
          <div className="flex-1 space-y-3">
            <p
              className="text-xl font-bold leading-tight tracking-tight text-white sm:text-2xl"
              style={{ letterSpacing: "-0.02em", lineHeight: "1.15" }}
            >
              {verdict.stanceLine}
            </p>

            {/* Posture chips */}
            <div className="flex flex-wrap gap-2">
              {verdict.postureChips.map((chip) => {
                const style = CHIP_STYLES[chip] || { bg: "bg-slate-700/50", text: "text-slate-300" };
                return (
                  <span
                    key={chip}
                    className={`
                      inline-flex items-center rounded-md px-2.5 py-1
                      text-xs font-semibold uppercase tracking-wider
                      ${style.bg} ${style.text}
                    `}
                  >
                    {CHIP_LABELS[chip] || chip.replace(/_/g, " ")}
                  </span>
                );
              })}
            </div>

            {/* Summary counts */}
            <div className="flex items-center gap-4 pt-1">
              {verdict.summaryCounts.critical > 0 && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  {verdict.summaryCounts.critical} Critical
                </span>
              )}
              {verdict.summaryCounts.caution > 0 && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  {verdict.summaryCounts.caution} Caution
                </span>
              )}
              {verdict.summaryCounts.confirmed > 0 && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {verdict.summaryCounts.confirmed} Confirmed
                </span>
              )}
            </div>
          </div>

          {/* Action buttons (full mode only) */}
          {mode === "full" && (
            <div className="flex shrink-0 gap-2 sm:flex-col">
              <button
                onClick={() => console.log("TODO: PDF export")}
                className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download PDF</span>
              </button>
              <button
                onClick={() => console.log("TODO: Share")}
                className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          )}
        </div>

        {/* Trust strip */}
        <div className="mt-6 border-t border-white/5 pt-5">
          <TrustStrip trustSignals={meta.trustSignals} />
        </div>
      </div>
    </div>
  );
}
