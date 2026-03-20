import React from "react";
import { useAnalysisViewMode } from "../../state/analysisViewMode";

import TruthReport from "../TruthReport";
import { TruthReportV2 } from "../TruthReportV2/TruthReportV2";

import type { AnalysisFlag, PillarScore } from "@/hooks/useAnalysisData";

type Props = {
  grade: string;
  flags: AnalysisFlag[];
  pillarScores: PillarScore[];
  contractorName: string | null;
  county: string;
  confidenceScore: number | null;
  documentType: string | null;
  accessLevel: "preview" | "full";
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

  if (!isReady) return null;

  if (mode === "v2") {
    return <TruthReportV2 analysis={props} />;
  }

  return <TruthReport {...props} />;
}
