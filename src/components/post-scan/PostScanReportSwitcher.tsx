import React from "react";
import { useAnalysisViewMode } from "../../state/analysisViewMode";

import TruthReport from "../TruthReport";
import { TruthReportV2 } from "../TruthReportV2/TruthReportV2";

type Props = {
  analysis: any;
};

export function PostScanReportSwitcher({ analysis }: Props) {
  const { mode, isReady } = useAnalysisViewMode();

  if (!isReady) return null;

  if (mode === "v2") {
    return <TruthReportV2 analysis={analysis} />;
  }

  return <TruthReport analysis={analysis} />;
}
