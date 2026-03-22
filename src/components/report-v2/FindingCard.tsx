import { useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Search,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  DollarSign,
  Wrench,
  FileWarning,
  Shield,
  UserX,
} from "lucide-react";
import type { Finding, FindingType, FindingSeverity, ReportMode, EvidencePreviewItem } from "@/types/report-v2";

interface FindingCardProps {
  finding: Finding;
  mode: ReportMode;
  onShowEvidence?: (findingId: string) => void;
}

const SEVERITY_CONFIG: Record<FindingSeverity, {
  icon: typeof AlertTriangle;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  iconColor: string;
  label: string;
}> = {
  critical: {
    icon: AlertTriangle,
    borderColor: "border-l-red-500",
    badgeBg: "bg-red-500/15",
    badgeText: "text-red-400",
    iconColor: "text-red-400",
    label: "CRITICAL",
  },
  caution: {
    icon: AlertCircle,
    borderColor: "border-l-amber-500",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-400",
    iconColor: "text-amber-400",
    label: "CAUTION",
  },
  confirmed: {
    icon: CheckCircle2,
    borderColor: "border-l-emerald-500",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-400",
    iconColor: "text-emerald-400",
    label: "CONFIRMED",
  },
};

const TYPE_ICONS: Record<FindingType, typeof ShieldAlert> = {
  compliance_safety_risk: ShieldAlert,
  cost_risk: DollarSign,
  scope_risk: Wrench,
  contract_fine_print_risk: FileWarning,
  warranty_risk: Shield,
  identity_legitimacy_risk: UserX,
};

function EvidenceTag({ item, mode }: { item: EvidencePreviewItem; mode: ReportMode }) {
  const isBlurred = mode === "partial_reveal" && item.blurredInPreview;

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5
        text-xs ring-1
        ${isBlurred
          ? "bg-slate-800/40 text-slate-500 ring-slate-700/50 blur-[2px] select-none"
          : "bg-slate-800/60 text-slate-400 ring-slate-700/40"
        }
      `}
    >
      {item.kind === "missing_from_quote" && (
        <span className="h-1 w-1 rounded-full bg-amber-500 shrink-0" />
      )}
      {item.kind === "extracted_field" && (
        <span className="h-1 w-1 rounded-full bg-cyan-500 shrink-0" />
      )}
      {item.kind === "benchmark" && (
        <span className="h-1 w-1 rounded-full bg-purple-500 shrink-0" />
      )}
      <span className="font-mono text-[11px]">{item.label}</span>
    </div>
  );
}

export function FindingCard({ finding, mode, onShowEvidence }: FindingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const severityConfig = SEVERITY_CONFIG[finding.severity];
  const SeverityIcon = severityConfig.icon;
  const TypeIcon = TYPE_ICONS[finding.type] || FileWarning;

  const visibleActions = isExpanded
    ? finding.whatToDo
    : finding.whatToDo.filter((a) => a.previewVisible);

  const hasHiddenActions = finding.whatToDo.length > visibleActions.length;

  return (
    <div
      className={`
        group relative overflow-hidden rounded-xl
        border-l-4 ${severityConfig.borderColor}
        bg-slate-900/60 ring-1 ring-white/5
        transition-all duration-200
        hover:ring-white/10 hover:bg-slate-900/80
      `}
    >
      <div className="px-5 py-5 sm:px-6">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Type icon */}
          <div className={`mt-0.5 shrink-0 ${severityConfig.iconColor}`}>
            <TypeIcon className="h-5 w-5" />
          </div>

          {/* Title + badge */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className="text-base font-bold leading-snug text-white sm:text-lg"
                style={{ letterSpacing: "-0.01em" }}
              >
                {finding.title}
              </h3>
              <span
                className={`
                  inline-flex items-center gap-1 rounded-md px-2 py-0.5
                  text-[10px] font-bold uppercase tracking-widest
                  ${severityConfig.badgeBg} ${severityConfig.badgeText}
                `}
              >
                <SeverityIcon className="h-3 w-3" />
                {severityConfig.label}
              </span>
            </div>
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Why it matters */}
        <p className="mt-3 text-sm leading-relaxed text-slate-400 pl-8">
          {finding.whyItMatters}
        </p>

        {/* Action items */}
        {visibleActions.length > 0 && (
          <div className="mt-4 space-y-2 pl-8">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              What to do
            </p>
            {visibleActions.map((action) => (
              <div
                key={action.id}
                className="flex items-start gap-2 text-sm"
              >
                <ArrowRight
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                    action.priority === "high"
                      ? "text-orange-400"
                      : action.priority === "medium"
                      ? "text-amber-400/70"
                      : "text-slate-500"
                  }`}
                />
                <span className="text-slate-300 leading-snug">{action.label}</span>
              </div>
            ))}
            {!isExpanded && hasHiddenActions && (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                + {finding.whatToDo.length - visibleActions.length} more action{finding.whatToDo.length - visibleActions.length > 1 ? "s" : ""}
              </button>
            )}
          </div>
        )}

        {/* Evidence preview tags */}
        {finding.evidencePreview.length > 0 && (isExpanded || finding.evidencePreview.some(e => e.previewVisible)) && (
          <div className="mt-4 flex flex-wrap gap-1.5 pl-8">
            {finding.evidencePreview
              .filter((e) => isExpanded || e.previewVisible)
              .map((item) => (
                <EvidenceTag key={item.id} item={item} mode={mode} />
              ))}
          </div>
        )}

        {/* Show evidence button */}
        {mode === "full" && onShowEvidence && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => onShowEvidence(finding.id)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 ring-1 ring-slate-700/50 transition-all hover:bg-slate-800 hover:text-white hover:ring-slate-600"
            >
              <Search className="h-3 w-3" />
              Show Evidence
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
