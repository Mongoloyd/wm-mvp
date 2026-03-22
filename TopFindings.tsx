import { Scan } from "lucide-react";
import type { Finding, ReportMode } from "@/types/report-v2";
import { FindingCard } from "./FindingCard";

interface TopFindingsProps {
  findings: Finding[];
  mode: ReportMode;
  onShowEvidence?: (findingId: string) => void;
}

export function TopFindings({ findings, mode, onShowEvidence }: TopFindingsProps) {
  if (findings.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
          <Scan className="h-4 w-4 text-cyan-400" />
        </div>
        <h2
          className="text-lg font-bold tracking-tight text-white"
          style={{ letterSpacing: "-0.02em" }}
        >
          Forensic Findings
        </h2>
        <span className="ml-1 rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400">
          {findings.length}
        </span>
      </div>

      <div className="space-y-3">
        {findings.map((finding) => (
          <FindingCard
            key={finding.id}
            finding={finding}
            mode={mode}
            onShowEvidence={onShowEvidence}
          />
        ))}
      </div>
    </section>
  );
}
