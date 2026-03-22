import { Lock, Shield, ArrowRight } from "lucide-react";
import type { VerdictHeader, Grade } from "@/types/report-v2";

interface UnlockCTAProps {
  verdict: VerdictHeader;
  onUnlock: () => void;
  isDemoMode?: boolean;
}

const GRADE_URGENCY: Record<Grade, { headline: string; subline: string }> = {
  F: {
    headline: "Your full report revealed serious risks",
    subline: "Verify your phone number to see the complete analysis and your personalized negotiation script.",
  },
  D: {
    headline: "Your report found issues that need attention",
    subline: "Verify your phone number to unlock the full forensic analysis, action plan, and evidence.",
  },
  C: {
    headline: "Your report is ready — mixed signals detected",
    subline: "Verify your phone number to see the complete findings, market benchmarks, and your action plan.",
  },
  B: {
    headline: "Your report is ready",
    subline: "Verify your phone number to access the full analysis, evidence data, and confirmation details.",
  },
  A: {
    headline: "Good news — your report looks solid",
    subline: "Verify your phone number to see the complete breakdown and confirm the details.",
  },
};

export function UnlockCTA({ verdict, onUnlock, isDemoMode = false }: UnlockCTAProps) {
  const urgency = GRADE_URGENCY[verdict.grade];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 ring-1 ring-white/10">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-orange-500/5" />

      <div className="relative px-6 py-10 sm:px-10 sm:py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 ring-1 ring-cyan-500/20 mb-5">
          <Shield className="h-7 w-7 text-cyan-400" />
        </div>

        <h3
          className="text-xl font-bold text-white sm:text-2xl"
          style={{ letterSpacing: "-0.02em", lineHeight: "1.2" }}
        >
          {isDemoMode ? "Unlock the Full Demo Report" : urgency.headline}
        </h3>

        <p className="mt-3 text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          {isDemoMode
            ? "Verify your phone number to see how our AI exposed hidden risks and created a negotiation script from this sample quote."
            : urgency.subline}
        </p>

        {/* What they'll get */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {[
            "Full Evidence",
            "Action Plan",
            "Negotiation Script",
            "Market Benchmarks",
          ].map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-300"
            >
              <Lock className="h-2.5 w-2.5 text-slate-500" />
              {item}
            </span>
          ))}
        </div>

        <button
          onClick={onUnlock}
          className="
            mt-8 inline-flex items-center gap-2.5
            rounded-xl bg-gradient-to-r from-[#E85A1B] to-[#BB2D00]
            px-8 py-4 text-base font-bold text-white
            shadow-lg shadow-orange-500/20
            transition-all duration-200
            hover:shadow-xl hover:shadow-orange-500/30
            hover:scale-[1.02]
            active:scale-[0.98]
          "
          style={{ letterSpacing: "-0.01em" }}
        >
          Unlock Full Report
          <ArrowRight className="h-5 w-5" />
        </button>

        <p className="mt-4 text-xs text-slate-500">
          We'll send a verification code to your phone. No spam. No sharing.
        </p>
      </div>
    </div>
  );
}
