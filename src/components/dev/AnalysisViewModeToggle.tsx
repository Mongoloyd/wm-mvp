import React from "react";
import { useAnalysisViewMode } from "../../state/analysisViewMode";

type Props = {
  className?: string;
  compact?: boolean;
};

export function AnalysisViewModeToggle({ className = "", compact = false }: Props) {
  const { mode, setMode, isReady } = useAnalysisViewMode();

  // Never show in production builds
  if (!import.meta.env.DEV) return null;

  // Avoid hydration flicker / wrong initial state
  if (!isReady) return null;

  const base =
    "select-none rounded-xl border border-white/15 bg-[#0F1F35]/90 text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur";
  const pad = compact ? "px-2 py-2" : "px-3 py-3";
  const label = compact ? "text-[11px]" : "text-xs";

  const pillBase =
    "flex-1 rounded-lg px-3 py-2 font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8952A]/70";
  const active = "bg-[#C8952A] text-[#071427] shadow-[0_6px_18px_rgba(200,149,42,0.35)]";
  const inactive = "bg-white/5 text-white/85 hover:bg-white/10";

  return (
    <div className={`${base} ${pad} ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className={`${label} font-bold tracking-wide text-white/90`}>POST‑SCAN VIEW</div>
          {!compact && (
            <div className="mt-0.5 text-[11px] text-white/60">
              Switch between Classic scorecard and Findings UI
            </div>
          )}
        </div>

        <div className="flex w-[240px] items-center gap-1 rounded-xl bg-black/25 p-1">
          <button
            type="button"
            onClick={() => setMode("classic")}
            className={`${pillBase} ${mode === "classic" ? active : inactive}`}
            aria-pressed={mode === "classic"}
            aria-label="Switch to Classic scorecard view"
          >
            Classic
          </button>

          <button
            type="button"
            onClick={() => setMode("findings")}
            className={`${pillBase} ${mode === "findings" ? active : inactive}`}
            aria-pressed={mode === "findings"}
            aria-label="Switch to Findings-first view"
          >
            Findings
          </button>
        </div>
      </div>
    </div>
  );
}
