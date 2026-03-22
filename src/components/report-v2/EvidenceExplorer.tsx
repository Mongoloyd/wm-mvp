import { useState } from "react";
import { Search, FileText, Calculator, AlertCircle, Lock } from "lucide-react";
import type { EvidenceExplorer as EvidenceExplorerType, EvidenceItem, ReportMode } from "@/types/report-v2";

interface EvidenceExplorerProps {
  evidence?: EvidenceExplorerType;
  mode: ReportMode;
  activeFindingFilter?: string | null;
}

const KIND_LABELS: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  ocr_text: { icon: FileText, label: "OCR Text", color: "text-purple-400" },
  extracted_field: { icon: Search, label: "Extracted Field", color: "text-cyan-400" },
  benchmark: { icon: Calculator, label: "Benchmark", color: "text-blue-400" },
  derived_calc: { icon: Calculator, label: "Calculated", color: "text-indigo-400" },
  missing_from_quote: { icon: AlertCircle, label: "Missing", color: "text-amber-400" },
};

function EvidenceRow({ item }: { item: EvidenceItem }) {
  const kindConfig = KIND_LABELS[item.kind] || KIND_LABELS.extracted_field;
  const KindIcon = kindConfig.icon;

  return (
    <div className="flex items-start gap-3 rounded-lg bg-slate-800/40 px-4 py-3 ring-1 ring-white/5">
      <KindIcon className={`mt-0.5 h-4 w-4 shrink-0 ${kindConfig.color}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300">{item.label}</p>
        {item.sourceText && (
          <pre className="mt-1.5 rounded-md bg-slate-950/50 px-3 py-2 text-xs text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap">
            {item.sourceText}
          </pre>
        )}
        {item.fieldKey && item.fieldValue !== undefined && (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">{item.fieldKey}:</span>
            <span className="text-xs font-mono text-cyan-400">{String(item.fieldValue)}</span>
          </div>
        )}
        {item.benchmark && (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-slate-500">{item.benchmark.label}:</span>
            <span className="text-xs font-semibold text-blue-400">{item.benchmark.value}</span>
            {item.benchmark.region && (
              <span className="text-[10px] text-slate-600">({item.benchmark.region})</span>
            )}
          </div>
        )}
      </div>
      <span
        className={`
          shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider
          bg-slate-800 ${kindConfig.color}
        `}
      >
        {kindConfig.label}
      </span>
    </div>
  );
}

export function EvidenceExplorer({ evidence, mode, activeFindingFilter }: EvidenceExplorerProps) {
  const [filter, setFilter] = useState<string | null>(activeFindingFilter || null);

  // Preview: locked state
  if (mode === "partial_reveal" || !evidence) {
    return (
      <section className="relative">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
            <Search className="h-4 w-4 text-purple-400" />
          </div>
          <h2
            className="text-lg font-bold tracking-tight text-white"
            style={{ letterSpacing: "-0.02em" }}
          >
            Evidence Explorer
          </h2>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-slate-900/40 ring-1 ring-white/5">
          <div className="px-6 py-8 text-center">
            <Lock className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-3 text-sm font-medium text-slate-400">
              Full source data and extraction evidence available in the unlocked report.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const items = filter
    ? evidence.items.filter((i) => i.findingId === filter)
    : evidence.items;

  const findingIds = [...new Set(evidence.items.map((i) => i.findingId).filter(Boolean))];

  return (
    <section>
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
          <Search className="h-4 w-4 text-purple-400" />
        </div>
        <h2
          className="text-lg font-bold tracking-tight text-white"
          style={{ letterSpacing: "-0.02em" }}
        >
          Evidence Explorer
        </h2>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400">
          {evidence.items.length} items
        </span>
      </div>

      {/* Filter chips */}
      {findingIds.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter(null)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              !filter
                ? "bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30"
                : "bg-slate-800 text-slate-400 hover:text-slate-300"
            }`}
          >
            All
          </button>
          {findingIds.map((id) => (
            <button
              key={id}
              onClick={() => setFilter(id === filter ? null : id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === id
                  ? "bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30"
                  : "bg-slate-800 text-slate-400 hover:text-slate-300"
              }`}
            >
              {id.replace(/^(finding_|merged_|confirmed_)/, "").replace(/_/g, " ")}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <EvidenceRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
