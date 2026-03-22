import {
  CheckCircle2,
  HelpCircle,
  Minus,
  Shield,
  Wrench,
  DollarSign,
  FileText,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import type { CoverageRow, CoverageDomain, CoverageStatus, ReportMode } from "@/types/report-v2";

interface CoverageMapProps {
  rows: CoverageRow[];
  mode: ReportMode;
  onDomainClick?: (domain: CoverageDomain) => void;
}

const DOMAIN_CONFIG: Record<CoverageDomain, { icon: typeof Shield; label: string }> = {
  scope: { icon: Wrench, label: "Installation Scope" },
  compliance: { icon: ShieldCheck, label: "Code Compliance" },
  pricing: { icon: DollarSign, label: "Pricing Clarity" },
  contract: { icon: FileText, label: "Contract Terms" },
  warranty: { icon: Shield, label: "Warranty Coverage" },
  identity: { icon: UserCheck, label: "Contractor Identity" },
};

const STATUS_CONFIG: Record<CoverageStatus, {
  icon: typeof CheckCircle2;
  label: string;
  color: string;
  bg: string;
}> = {
  confirmed: {
    icon: CheckCircle2,
    label: "Confirmed",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  needs_clarification: {
    icon: HelpCircle,
    label: "Needs Clarification",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  not_visible_in_quote: {
    icon: Minus,
    label: "Not in Quote",
    color: "text-slate-500",
    bg: "bg-slate-800/50",
  },
};

export function CoverageMap({ rows, mode, onDomainClick }: CoverageMapProps) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700/50">
          <Shield className="h-4 w-4 text-slate-400" />
        </div>
        <h2
          className="text-lg font-bold tracking-tight text-white"
          style={{ letterSpacing: "-0.02em" }}
        >
          Coverage Analysis
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => {
          const domain = DOMAIN_CONFIG[row.domain];
          const status = STATUS_CONFIG[row.status];
          const DomainIcon = domain.icon;
          const StatusIcon = status.icon;
          const isClickable = mode === "full" && row.linkedFindingIds.length > 0;

          return (
            <button
              key={row.domain}
              onClick={() => isClickable && onDomainClick?.(row.domain)}
              disabled={!isClickable}
              className={`
                flex items-center gap-3 rounded-xl px-4 py-3.5
                bg-slate-900/60 ring-1 ring-white/5
                text-left transition-all duration-200
                ${isClickable
                  ? "cursor-pointer hover:ring-white/10 hover:bg-slate-900/80"
                  : "cursor-default"
                }
              `}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800/80">
                <DomainIcon className="h-4 w-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {domain.label}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <StatusIcon className={`h-3 w-3 ${status.color}`} />
                  <span className={`text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
