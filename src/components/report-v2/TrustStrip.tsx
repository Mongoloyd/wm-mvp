import { Shield, FileCheck, Building2, Eye, Zap } from "lucide-react";
import type { ReportMeta } from "@/types/report-v2";

interface TrustStripProps {
  trustSignals: ReportMeta["trustSignals"];
}

const QUALITY_LABELS: Record<string, string> = {
  excellent: "Excellent",
  great: "Great",
  good: "Good",
  fair: "Fair",
  limited: "Limited",
};

export function TrustStrip({ trustSignals }: TrustStripProps) {
  const items = [
    {
      active: trustSignals.documentVerified,
      icon: FileCheck,
      label: "Document Verified",
    },
    {
      active: trustSignals.multiPageAnalyzed,
      icon: Eye,
      label: "Multi-Page Analyzed",
    },
    {
      active: trustSignals.contractorIdentified,
      icon: Building2,
      label: "Contractor Identified",
    },
    {
      active: true,
      icon: Zap,
      label: `OCR Quality: ${QUALITY_LABELS[trustSignals.ocrReadQuality] || trustSignals.ocrReadQuality}`,
    },
    {
      active: trustSignals.confidenceBand !== "low",
      icon: Shield,
      label: `${trustSignals.confidenceBand.charAt(0).toUpperCase() + trustSignals.confidenceBand.slice(1)} Confidence`,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {items.map((item, i) => (
        <div
          key={i}
          className={`
            inline-flex items-center gap-1.5 rounded-full px-3 py-1.5
            text-xs font-medium tracking-wide
            transition-colors duration-200
            ${
              item.active
                ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                : "bg-slate-800/50 text-slate-500 ring-1 ring-slate-700/50"
            }
          `}
        >
          <item.icon className="h-3 w-3 shrink-0" />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
