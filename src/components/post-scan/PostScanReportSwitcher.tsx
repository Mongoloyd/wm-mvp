import React from "react";
import { useAnalysisViewMode } from "../../state/analysisViewMode";

// ✅ Replace these imports with your actual components
import { TruthReport as TruthReportV1 } from "../TruthReport/TruthReport";
import { TruthReportV2 } from "../TruthReportV2/TruthReportV2";

type Props = {
  analysis: any; // keep as any until your V2 types land; then tighten to your Analysis type
};

export function PostScanReportSwitcher({ analysis }: Props) {
  const { mode, isReady } = useAnalysisViewMode();

  // Avoid flicker while reading localStorage
  if (!isReady) return null;

  if (mode === "v2") {
    return <TruthReportV2 analysis={analysis} />;
  }

  return <TruthReportV1 analysis={analysis} />;
}
