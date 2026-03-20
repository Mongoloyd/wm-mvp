import { useEffect } from "react";
import LinearHeader from "@/components/LinearHeader";
import { TruthReportFindings } from "@/components/TruthReportFindings/TruthReportFindings";
import type { AnalysisData } from "@/hooks/useAnalysisData";

/**
 * View Scan Demo — a curated, read-only preview of the Truth Report.
 * Uses fixture data so no upload or backend call is required.
 * Always renders in preview mode with all Phase 0.7 guardrails.
 */

const DEMO_DATA: AnalysisData = {
  grade: "C",
  contractorName: "AllStar Impact Solutions",
  confidenceScore: 78,
  documentType: "estimate",
  pageCount: 2,
  openingCount: 6,
  lineItemCount: 6,
  qualityBand: "fair",
  hasWarranty: null,
  hasPermits: null,
  analysisStatus: "preview_ready",
  flags: [
    { id: 1, severity: "red", label: "Missing NOA Codes", detail: "No product approval numbers listed. Cannot verify code compliance.", tip: "Ask the contractor to provide NOA numbers for every product listed.", pillar: "safety_code" },
    { id: 2, severity: "red", label: "Permit Fees Listed as TBD", detail: "Permit costs are not included. Open-ended cost exposure.", tip: "Request a fixed permit fee or a not-to-exceed clause before signing.", pillar: "fine_print" },
    { id: 3, severity: "amber", label: "No Disposal Terms", detail: "No mention of old window removal and disposal costs.", tip: "Ask for disposal to be included in writing.", pillar: "install_scope" },
    { id: 4, severity: "amber", label: "Generic Glass Spec", detail: "Glass type listed as 'impact rated' without specific manufacturer or series.", tip: "Request the exact glass manufacturer and product series.", pillar: "safety_code" },
    { id: 5, severity: "green", label: "Line Items Present", detail: "Individual window pricing is broken out per unit.", tip: null, pillar: "price_fairness" },
    { id: 6, severity: "amber", label: "Warranty Duration Unclear", detail: "Says 'manufacturer warranty applies' but doesn't specify duration.", tip: "Get the exact warranty term in writing — both manufacturer and labor.", pillar: "warranty" },
  ],
  pillarScores: [
    { key: "safety_code", label: "Safety & Code Match", score: null, status: "fail" },
    { key: "install_scope", label: "Install & Scope Clarity", score: null, status: "warn" },
    { key: "price_fairness", label: "Price Fairness", score: null, status: "pass" },
    { key: "fine_print", label: "Fine Print & Transparency", score: null, status: "fail" },
    { key: "warranty", label: "Warranty Value", score: null, status: "warn" },
  ],
};

const Demo = () => {
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = "Demo Report — WindowMan Truth Report™";
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <LinearHeader />

      {/* Demo banner */}
      <div style={{
        background: "linear-gradient(90deg, rgba(37,99,235,0.15), rgba(249,115,22,0.15))",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        padding: "10px 16px",
        textAlign: "center",
      }}>
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 12,
          color: "#E5E7EB",
          letterSpacing: "0.06em",
        }}>
          📋 SAMPLE REPORT — This is a demo using curated data. <a href="/" style={{ color: "#2563EB", textDecoration: "underline" }}>Upload your own quote →</a>
        </p>
      </div>

      <TruthReportFindings
        analysis={{
          grade: DEMO_DATA.grade,
          flags: DEMO_DATA.flags,
          pillarScores: DEMO_DATA.pillarScores,
          contractorName: DEMO_DATA.contractorName,
          county: "Broward",
          confidenceScore: DEMO_DATA.confidenceScore,
          documentType: DEMO_DATA.documentType,
          accessLevel: "preview",
          qualityBand: DEMO_DATA.qualityBand,
          hasWarranty: DEMO_DATA.hasWarranty,
          hasPermits: DEMO_DATA.hasPermits,
          pageCount: DEMO_DATA.pageCount,
          lineItemCount: DEMO_DATA.lineItemCount,
          onContractorMatchClick: () => {
            window.location.href = "/#truth-gate";
          },
          onSecondScan: () => {
            window.location.href = "/";
          },
        }}
      />
    </div>
  );
};

export default Demo;
