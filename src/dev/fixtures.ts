/**
 * Dev-only fixture data mirroring real backend AnalysisData shapes.
 * Used by DevPreviewPanel to preview report states without uploading a quote.
 * SECURITY: This is cosmetic fixture data — no real full_json is exposed.
 */

import type { AnalysisData } from "@/hooks/useAnalysisData";
import type { ReportAccessLevel } from "@/hooks/useReportAccess";

export type DevPreviewState =
  | "none"
  | "grade_a_full"
  | "grade_c_preview"
  | "grade_d_full"
  | "otp_gate"
  | "invalid_document"
  | "needs_better_upload";

export interface DevPreviewConfig {
  label: string;
  description: string;
  analysisData: AnalysisData | null;
  accessLevel: ReportAccessLevel;
  /** If true, render the invalid-document or needs-better-upload UI instead of TruthReport */
  specialState?: "invalid_document" | "needs_better_upload";
}

const GRADE_A_DATA: AnalysisData = {
  grade: "A",
  contractorName: "Hurricane Shield Windows",
  confidenceScore: 94,
  documentType: "quote",
  pageCount: 4,
  openingCount: 8,
  lineItemCount: 12,
  qualityBand: "good",
  hasWarranty: true,
  hasPermits: true,
  analysisStatus: "complete",
  flags: [
    { id: 1, severity: "green", label: "NOA Codes Present", detail: "All product approval numbers are listed and verifiable.", tip: null, pillar: "safety_code" },
    { id: 2, severity: "green", label: "DP Rating Specified", detail: "Design pressure ratings match Broward County requirements.", tip: null, pillar: "safety_code" },
    { id: 3, severity: "green", label: "Installation Scope Clear", detail: "Scope includes removal, installation, flashing, and cleanup.", tip: null, pillar: "install_scope" },
    { id: 4, severity: "green", label: "Pricing Within Range", detail: "Total is within 8% of Broward County Q1 2025 benchmark.", tip: null, pillar: "price_fairness" },
    { id: 5, severity: "amber", label: "Permit Fee Listed as Estimate", detail: "Permit costs are estimated, not fixed. Could change.", tip: "Ask for a fixed permit cost cap or a not-to-exceed clause.", pillar: "fine_print" },
    { id: 6, severity: "green", label: "Warranty Terms Documented", detail: "Manufacturer and labor warranties are clearly stated.", tip: null, pillar: "warranty" },
  ],
  pillarScores: [
    { key: "safety_code", label: "Safety & Code Match", score: 92, status: "pass" },
    { key: "install_scope", label: "Install & Scope Clarity", score: 88, status: "pass" },
    { key: "price_fairness", label: "Price Fairness", score: 85, status: "pass" },
    { key: "fine_print", label: "Fine Print & Transparency", score: 68, status: "warn" },
    { key: "warranty", label: "Warranty Value", score: 90, status: "pass" },
  ],
};

const GRADE_C_DATA: AnalysisData = {
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

const GRADE_D_DATA: AnalysisData = {
  grade: "D",
  contractorName: "WindowWorld Express",
  confidenceScore: 65,
  documentType: "proposal",
  flags: [
    { id: 1, severity: "red", label: "Price 38% Above Market", detail: "Total quoted is $12,500 above Broward County Q1 2025 benchmark for this scope.", tip: "Get at least two competing quotes before signing.", pillar: "price_fairness" },
    { id: 2, severity: "red", label: "Missing NOA Codes", detail: "No product approval numbers anywhere in the document.", tip: "Do not proceed without verifiable NOA numbers.", pillar: "safety_code" },
    { id: 3, severity: "red", label: "No Permit Handling", detail: "Document makes no mention of building permits.", tip: "Florida law requires permits for impact window installation. Ask who pulls them.", pillar: "fine_print" },
    { id: 4, severity: "red", label: "No DP Rating Listed", detail: "Design pressure ratings are missing. Cannot confirm wind resistance.", tip: "Require DP ratings that meet your county's wind zone requirements.", pillar: "safety_code" },
    { id: 5, severity: "amber", label: "Vague Installation Scope", detail: "Says 'professional installation included' with no details on flashing, trim, or sealant.", tip: "Get a detailed scope of work in writing.", pillar: "install_scope" },
    { id: 6, severity: "amber", label: "Warranty Not Transferable", detail: "Labor warranty is void if homeowner sells the property.", tip: "Request transferable warranty terms — it affects resale value.", pillar: "warranty" },
    { id: 7, severity: "green", label: "Company Licensed", detail: "Contractor license number is listed and verifiable.", tip: null, pillar: "fine_print" },
  ],
  pillarScores: [
    { key: "safety_code", label: "Safety & Code Match", score: 22, status: "fail" },
    { key: "install_scope", label: "Install & Scope Clarity", score: 35, status: "fail" },
    { key: "price_fairness", label: "Price Fairness", score: 18, status: "fail" },
    { key: "fine_print", label: "Fine Print & Transparency", score: 45, status: "warn" },
    { key: "warranty", label: "Warranty Value", score: 42, status: "warn" },
  ],
};

export const DEV_PREVIEW_CONFIGS: Record<DevPreviewState, DevPreviewConfig> = {
  none: {
    label: "Off",
    description: "Normal flow",
    analysisData: null,
    accessLevel: "preview",
  },
  grade_a_full: {
    label: "Grade A (Full)",
    description: "Unlocked report, strong quote",
    analysisData: GRADE_A_DATA,
    accessLevel: "full",
  },
  grade_c_preview: {
    label: "Grade C (Preview)",
    description: "Locked teaser with OTP gate hidden",
    analysisData: GRADE_C_DATA,
    accessLevel: "preview",
  },
  grade_d_full: {
    label: "Grade D (Full)",
    description: "Unlocked, problem quote",
    analysisData: GRADE_D_DATA,
    accessLevel: "full",
  },
  otp_gate: {
    label: "OTP Gate",
    description: "Preview mode — phone verification visible",
    analysisData: GRADE_C_DATA,
    accessLevel: "preview",
  },
  invalid_document: {
    label: "Invalid Doc",
    description: "Non-window document detected",
    analysisData: null,
    accessLevel: "preview",
    specialState: "invalid_document",
  },
  needs_better_upload: {
    label: "Bad Upload",
    description: "Unreadable / low quality",
    analysisData: null,
    accessLevel: "preview",
    specialState: "needs_better_upload",
  },
};
