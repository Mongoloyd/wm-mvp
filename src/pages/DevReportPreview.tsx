/**
 * DevReportPreview — Dev-only route for deep UI testing.
 * Route: /dev/report-preview
 *
 * Renders TruthReportClassic + ContractorMatch with hardcoded mock data.
 * No OTP, no upload, no Supabase calls needed.
 */

import { useState } from "react";
import TruthReportClassic from "@/components/TruthReportClassic";
import ContractorMatch from "@/components/ContractorMatch";
import type { AnalysisFlag, PillarScore } from "@/hooks/useAnalysisData";

const MOCK_FLAGS: AnalysisFlag[] = [
  { id: "f1", label: "Missing NOA documentation", severity: "red", pillar: "safety_code", detail: "No Florida product approval or NOA numbers listed for any windows." },
  { id: "f2", label: "No cancellation clause", severity: "red", pillar: "fine_print", detail: "Contract has no cancellation or rescission language." },
  { id: "f3", label: "Vague disposal terms", severity: "red", pillar: "install_scope", detail: "No mention of debris removal or old window disposal." },
  { id: "f4", label: "Warranty duration unclear", severity: "amber", pillar: "warranty", detail: "Warranty mentioned but no specific duration or coverage details." },
  { id: "f5", label: "Per-unit pricing not itemized", severity: "amber", pillar: "price_fairness", detail: "Total price given but no per-opening breakdown." },
];

const MOCK_PILLARS: PillarScore[] = [
  { pillar: "safety_code", score: 25, status: "fail", flags: 1 },
  { pillar: "install_scope", score: 40, status: "warn", flags: 1 },
  { pillar: "price_fairness", score: 55, status: "warn", flags: 1 },
  { pillar: "fine_print", score: 30, status: "fail", flags: 1 },
  { pillar: "warranty", score: 45, status: "warn", flags: 1 },
];

export default function DevReportPreview() {
  const [matchVisible, setMatchVisible] = useState(true);

  if (!import.meta.env.DEV) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Dev route — not available in production.</p>
      </div>
    );
  }

  return (
    <>
      <TruthReportClassic
        grade="D"
        flags={MOCK_FLAGS}
        pillarScores={MOCK_PILLARS}
        contractorName="Sample Contractor LLC"
        county="Broward"
        confidenceScore={82}
        documentType="contractor_quote"
        accessLevel="full"
        qualityBand="poor"
        hasWarranty={true}
        hasPermits={false}
        pageCount={3}
        lineItemCount={8}
        flagCount={5}
        flagRedCount={3}
        flagAmberCount={2}
        onContractorMatchClick={() => setMatchVisible(true)}
        onSecondScan={() => window.location.assign("/")}
      />
      <ContractorMatch
        isVisible={matchVisible}
        grade="D"
        county="Broward"
        scanSessionId={null}
        isFullLoaded={true}
        phoneE164={null}
      />
    </>
  );
}
