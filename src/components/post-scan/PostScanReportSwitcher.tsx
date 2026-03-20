import React from "react";
import { useAnalysisViewMode } from "../../state/analysisViewMode";
import { useReportAccess } from "@/hooks/useReportAccess";

import TruthReportClassic from "../TruthReportClassic";
import { TruthReportFindings } from "../TruthReportFindings/TruthReportFindings";

import type { AnalysisFlag, PillarScore } from "@/hooks/useAnalysisData";

type Props = {
  grade: string;
  flags: AnalysisFlag[];
  pillarScores: PillarScore[];
  contractorName: string | null;
  county: string;
  confidenceScore: number | null;
  documentType: string | null;
  qualityBand?: "good" | "fair" | "poor" | null;
  hasWarranty?: boolean | null;
  hasPermits?: boolean | null;
  pageCount?: number | null;
  lineItemCount?: number | null;
  onContractorMatchClick: () => void;
  onSecondScan: () => void;
  scanSessionId?: string | null;
};

export function PostScanReportSwitcher(props: Props) {
  const { mode, isReady } = useAnalysisViewMode();
  const accessLevel = useReportAccess();

  if (!isReady) return null;

  if (mode === "findings") {
    return <TruthReportFindings analysis={{ ...props, accessLevel }} />;
  }

  return <TruthReportClassic {...props} accessLevel={accessLevel} />;
}
