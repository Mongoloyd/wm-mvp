/**
 * Dev-only fixture data for designing report UI states.
 * Mirrors real backend response shapes from get_analysis_preview RPC.
 * 
 * SECURITY: This file is only used in dev mode (import.meta.env.DEV).
 * It does NOT contain real full_json — only preview-safe shapes.
 * Production gating remains 100% server-side.
 */

import type { AnalysisData, AnalysisFlag, PillarScore } from "@/hooks/useAnalysisData";

// ─── Shared helpers ───

const flag = (
  id: number,
  severity: "red" | "amber" | "green",
  label: string,
  detail: string,
  tip: string | null = null,
  pillar: string | null = null
): AnalysisFlag => ({ id, severity, label, detail, tip, pillar });

const pillar = (
  key: string,
  label: string,
  score: number | null,
  status: "pass" | "warn" | "fail" | "pending"
): PillarScore => ({ key, label, score, status });

// ─── 1. Valid Preview Report (grade C, mixed flags) ───

export const FIXTURE_PREVIEW_REPORT: AnalysisData = {
  grade: "C",
  confidenceScore: 82,
  contractorName: "SunCoast Windows & Doors",
  documentType: "quote",
  flags: [
    flag(1, "red", "DP Rating Below Code", "Two windows specified at DP 35, but Broward County HVHZ requires DP 50 minimum.", "Ask contractor to confirm DP ratings meet local wind code.", "safety_code"),
    flag(2, "red", "No NOA Numbers Listed", "No Miami-Dade NOA approval numbers found on any line items.", "Request NOA numbers for every product before signing.", "safety_code"),
    flag(3, "amber", "Permit Responsibility Unclear", "Quote mentions 'permits as needed' but does not specify who pulls or pays.", "Clarify in writing who is responsible for permit costs.", "fine_print"),
    flag(4, "amber", "Installation Scope Vague", "No mention of stucco repair, trim work, or debris removal after install.", "Ask for a written scope addendum covering post-install work.", "install_scope"),
    flag(5, "green", "Warranty Included", "10-year labor warranty and lifetime manufacturer warranty confirmed.", null, "warranty"),
    flag(6, "green", "Price Within Market Range", "Total quoted price falls within expected range for 8 impact windows in Broward County.", null, "price_fairness"),
  ],
  pillarScores: [
    pillar("safety_code", "Safety & Code Match", 35, "fail"),
    pillar("install_scope", "Install & Scope Clarity", 55, "warn"),
    pillar("price_fairness", "Price Fairness", 78, "pass"),
    pillar("fine_print", "Fine Print & Transparency", 48, "warn"),
    pillar("warranty", "Warranty Value", 88, "pass"),
  ],
};

// ─── 2. Full Unlocked Report (grade D, more severe) ───

export const FIXTURE_FULL_REPORT: AnalysisData = {
  grade: "D",
  confidenceScore: 91,
  contractorName: "FastTrack Impact LLC",
  documentType: "proposal",
  flags: [
    flag(1, "red", "Price 42% Above Market", "Total quoted $18,400 for 6 windows. Market average for same specs in Palm Beach County is $12,950.", "Get at least two competing quotes before proceeding.", "price_fairness"),
    flag(2, "red", "Cancellation Penalty Hidden", "Fine print includes a 25% restocking fee if cancelled after 3 business days.", "Negotiate cancellation terms before signing.", "fine_print"),
    flag(3, "red", "No Permit Inclusion", "Quote explicitly states homeowner is responsible for all permits and inspections.", "Most reputable contractors include permits. This is a red flag.", "fine_print"),
    flag(4, "red", "Generic Glass Spec", "Quote lists 'impact glass' without specifying laminated vs. insulated or thickness.", "Demand exact glass specifications in writing.", "safety_code"),
    flag(5, "amber", "Labor Warranty Only 2 Years", "Industry standard is 5-10 years for labor warranty on impact window installations.", "Negotiate for at least 5-year labor coverage.", "warranty"),
    flag(6, "amber", "No Disposal Mentioned", "No mention of old window/door disposal or job site cleanup.", null, "install_scope"),
    flag(7, "green", "Manufacturer Warranty Included", "Lifetime manufacturer warranty on all PGT products confirmed.", null, "warranty"),
  ],
  pillarScores: [
    pillar("safety_code", "Safety & Code Match", 30, "fail"),
    pillar("install_scope", "Install & Scope Clarity", 42, "warn"),
    pillar("price_fairness", "Price Fairness", 22, "fail"),
    pillar("fine_print", "Fine Print & Transparency", 28, "fail"),
    pillar("warranty", "Warranty Value", 60, "warn"),
  ],
};

// ─── 3. Grade A Strong Report ───

export const FIXTURE_STRONG_REPORT: AnalysisData = {
  grade: "A",
  confidenceScore: 96,
  contractorName: "Hurricane Shield Pro",
  documentType: "quote",
  flags: [
    flag(1, "green", "All DP Ratings Exceed Code", "Every window meets or exceeds Miami-Dade HVHZ DP 50 requirement.", null, "safety_code"),
    flag(2, "green", "NOA Numbers Verified", "All 8 line items include valid Miami-Dade NOA approval numbers.", null, "safety_code"),
    flag(3, "green", "Price Below Market Average", "Total $11,200 for 8 openings — 8% below Broward County average.", null, "price_fairness"),
    flag(4, "green", "Full Permit Coverage", "Contractor handles all permits, inspections, and NOA documentation.", null, "fine_print"),
    flag(5, "green", "Comprehensive Warranty", "10-year labor + lifetime manufacturer + transferable to new owner.", null, "warranty"),
    flag(6, "amber", "Disposal Not Explicitly Listed", "Cleanup implied but not in writing. Minor item.", "Ask for written confirmation of old window disposal.", "install_scope"),
  ],
  pillarScores: [
    pillar("safety_code", "Safety & Code Match", 98, "pass"),
    pillar("install_scope", "Install & Scope Clarity", 72, "pass"),
    pillar("price_fairness", "Price Fairness", 92, "pass"),
    pillar("fine_print", "Fine Print & Transparency", 90, "pass"),
    pillar("warranty", "Warranty Value", 95, "pass"),
  ],
};

// ─── Dev Preview State Types ───

export type DevPreviewState =
  | "off"                // Normal production flow
  | "preview_report"     // Valid report, preview access level
  | "full_report"        // Valid report, full access level
  | "strong_report"      // Grade A report
  | "invalid_document"   // Non-quote uploaded
  | "needs_better_upload" // Unreadable/incomplete
  | "otp_gate";          // Show OTP verification gate

export interface DevPreviewConfig {
  label: string;
  description: string;
}

export const DEV_PREVIEW_STATES: Record<DevPreviewState, DevPreviewConfig> = {
  off: { label: "Off (Live)", description: "Use real backend flow" },
  preview_report: { label: "Preview Report", description: "Grade C — locked teaser view" },
  full_report: { label: "Full Report (D)", description: "Grade D — unlocked, all flags visible" },
  strong_report: { label: "Strong Report (A)", description: "Grade A — mostly green" },
  invalid_document: { label: "Invalid Document", description: "Non-quote file uploaded" },
  needs_better_upload: { label: "Needs Better Upload", description: "Unreadable/low quality" },
  otp_gate: { label: "OTP Gate", description: "Phone verification prompt" },
};

export function getFixtureForState(state: DevPreviewState): AnalysisData | null {
  switch (state) {
    case "preview_report":
      return FIXTURE_PREVIEW_REPORT;
    case "full_report":
    case "otp_gate":
      return FIXTURE_FULL_REPORT;
    case "strong_report":
      return FIXTURE_STRONG_REPORT;
    default:
      return null;
  }
}
