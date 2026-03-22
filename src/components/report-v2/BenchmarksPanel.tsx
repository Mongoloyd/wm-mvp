import { BarChart3, Lock } from "lucide-react";
import type { BenchmarksSection, ReportMode } from "@/types/report-v2";

interface BenchmarksPanelProps {
  benchmarks?: BenchmarksSection;
  mode: ReportMode;
}

function PriceRangeBar({
  low,
  high,
  actual,
  regionLabel,
}: {
  low: number;
  high: number;
  actual: number | null;
  regionLabel: string;
}) {
  // Calculate position of actual price on the bar
  const rangeSpan = high - low;
  const padding = rangeSpan * 0.3; // 30% padding on each side
  const barMin = low - padding;
  const barMax = high + padding;
  const barSpan = barMax - barMin;

  const lowPct = ((low - barMin) / barSpan) * 100;
  const highPct = ((high - barMin) / barSpan) * 100;
  const actualPct = actual ? Math.min(100, Math.max(0, ((actual - barMin) / barSpan) * 100)) : null;

  const isOverpriced = actual ? actual > high : false;
  const isUnderpriced = actual ? actual < low : false;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-slate-500">
          ${low.toLocaleString()}
        </span>
        <span className="text-slate-600">{regionLabel} Market Range</span>
        <span className="font-mono text-slate-500">
          ${high.toLocaleString()}
        </span>
      </div>

      <div className="relative h-8 rounded-full bg-slate-800/60 overflow-hidden">
        {/* Market range band */}
        <div
          className="absolute top-0 h-full rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/20"
          style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }}
        />

        {/* Actual price marker */}
        {actualPct !== null && (
          <div
            className="absolute top-0 h-full w-1"
            style={{ left: `${actualPct}%` }}
          >
            <div
              className={`
                h-full w-1 rounded-full
                ${isOverpriced ? "bg-red-400" : isUnderpriced ? "bg-amber-400" : "bg-cyan-400"}
              `}
            />
            <div
              className={`
                absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap
                rounded-md px-2 py-0.5 text-[10px] font-bold
                ${isOverpriced
                  ? "bg-red-500/15 text-red-400"
                  : isUnderpriced
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-cyan-500/15 text-cyan-400"
                }
              `}
            >
              Your quote: ${actual!.toLocaleString()}/opening
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function BenchmarksPanel({ benchmarks, mode }: BenchmarksPanelProps) {
  // Preview: locked state
  if (mode === "partial_reveal" || !benchmarks) {
    return (
      <section className="relative">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <BarChart3 className="h-4 w-4 text-blue-400" />
          </div>
          <h2
            className="text-lg font-bold tracking-tight text-white"
            style={{ letterSpacing: "-0.02em" }}
          >
            Market Benchmarks
          </h2>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-slate-900/40 ring-1 ring-white/5">
          <div className="px-6 py-8 text-center">
            <Lock className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-3 text-sm font-medium text-slate-400">
              Regional pricing benchmarks and market comparison are available in
              the full report.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
          <BarChart3 className="h-4 w-4 text-blue-400" />
        </div>
        <h2
          className="text-lg font-bold tracking-tight text-white"
          style={{ letterSpacing: "-0.02em" }}
        >
          Market Benchmarks
        </h2>
        <span
          className={`
            rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider
            ${benchmarks.benchmarkConfidence === "high"
              ? "bg-emerald-500/10 text-emerald-400"
              : benchmarks.benchmarkConfidence === "medium"
              ? "bg-amber-500/10 text-amber-400"
              : "bg-slate-800 text-slate-500"
            }
          `}
        >
          {benchmarks.benchmarkConfidence} confidence
        </span>
      </div>

      <div className="rounded-xl bg-slate-900/60 ring-1 ring-white/5 p-6">
        {/* Price per opening */}
        {benchmarks.pricePerOpening && (
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Your Price Per Opening
            </p>
            <p className="text-3xl font-bold text-white" style={{ letterSpacing: "-0.02em" }}>
              ${benchmarks.pricePerOpening.toLocaleString()}
            </p>
          </div>
        )}

        {/* Market range visual */}
        {benchmarks.localRange && (
          <div className="mb-10">
            <PriceRangeBar
              low={benchmarks.localRange.low}
              high={benchmarks.localRange.high}
              actual={benchmarks.pricePerOpening || null}
              regionLabel={benchmarks.localRange.regionLabel}
            />
          </div>
        )}

        {/* Market deviation */}
        {benchmarks.marketDeviationPct !== null && benchmarks.marketDeviationPct !== undefined && (
          <div className="mb-4 rounded-lg bg-slate-800/40 px-4 py-3">
            <p className="text-xs text-slate-500 mb-1">Market Deviation</p>
            <p
              className={`text-xl font-bold ${
                benchmarks.marketDeviationPct > 15
                  ? "text-red-400"
                  : benchmarks.marketDeviationPct > 5
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {benchmarks.marketDeviationPct > 0 ? "+" : ""}
              {benchmarks.marketDeviationPct}% vs. market
            </p>
          </div>
        )}

        {/* Notes */}
        {benchmarks.notes.length > 0 && (
          <div className="mt-4 space-y-1">
            {benchmarks.notes.map((note, i) => (
              <p key={i} className="text-xs text-slate-500 italic">
                {note}
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
