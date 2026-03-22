// ═══════════════════════════════════════════════════════════════════════════════
// V2 REPORT CONTRACTS — Findings-First Report Architecture
// ═══════════════════════════════════════════════════════════════════════════════
// These types define the canonical shape of every V2 report. The scanner brain
// produces raw pillar scores + flags. The transform layer reshapes them into
// this contract. The UI renders exclusively from this shape.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Report Envelope ──────────────────────────────────────────────────────────

export type ReportMode = "partial_reveal" | "full";

// Gate state drives the OTP overlay behavior — NOT data access.
// The report always contains all data; the UI decides what to show.
export type GateState =
  | "otp_required"
  | "otp_submitting"
  | "otp_invalid"
  | "otp_expired"
  | "unlocked";

// Rich outcome from the OTP verification callback.
// Returned by the page layer (which owns Twilio), consumed by the shell.
export type OtpVerifyOutcome = "verified" | "invalid" | "expired" | "error";

export interface ReportEnvelope {
  version: "findings_v2";
  mode: ReportMode;
  meta: ReportMeta;
  verdict: VerdictHeader;
  topFindings: Finding[];
  coverageMap: CoverageRow[];
  actionPlan?: ActionPlan;
  evidenceExplorer?: EvidenceExplorer;
  benchmarks?: BenchmarksSection;
  appendix?: AppendixSection;
}

// ── Meta ─────────────────────────────────────────────────────────────────────

export interface ReportMeta {
  analysisId: string;
  leadId?: string | null;
  generatedAtIso: string;
  rulesetVersion: string;
  countyVersion?: string | null;
  scannerVersion?: string | null;

  render: {
    partialReveal: boolean;
    evidenceBlurred: boolean;
    benchmarksVisible: boolean;
    appendixVisible: boolean;
  };

  trustSignals: {
    documentVerified: boolean;
    multiPageAnalyzed: boolean;
    contractorIdentified: boolean;
    ocrReadQuality: "excellent" | "great" | "good" | "fair" | "limited";
    confidenceBand: "high" | "medium" | "low";
  };
}

// ── Verdict ──────────────────────────────────────────────────────────────────

export type Grade = "A" | "B" | "C" | "D" | "F";

export type RiskPostureChip =
  | "overpriced"
  | "scope_gaps"
  | "risky_clauses"
  | "warranty_imbalance"
  | "compliance_unclear"
  | "identity_concern"
  | "well_specified"
  | "fair_pricing_visible";

export interface VerdictHeader {
  grade: Grade;
  stanceLine: string;
  postureChips: RiskPostureChip[];
  summaryCounts: {
    critical: number;
    caution: number;
    confirmed: number;
  };
}

// ── Findings ─────────────────────────────────────────────────────────────────

export type FindingSeverity = "critical" | "caution" | "confirmed";

export type FindingType =
  | "cost_risk"
  | "scope_risk"
  | "compliance_safety_risk"
  | "contract_fine_print_risk"
  | "warranty_risk"
  | "identity_legitimacy_risk";

export type ImpactReduction = "high" | "medium" | "low";

export interface Finding {
  id: string;
  type: FindingType;
  severity: FindingSeverity;
  title: string;
  whyItMatters: string;
  whatToDo: ActionItem[];
  impactReduction: ImpactReduction;
  evidencePreview: EvidencePreviewItem[];
  evidenceRefs: string[];
  triggeredBySignals: string[];
  coverageDomains: CoverageDomain[];
  previewSafe: boolean;
  sortScore: number;
}

// ── Action Items ─────────────────────────────────────────────────────────────

export interface ActionItem {
  id: string;
  label: string;
  priority: "high" | "medium" | "low";
  previewVisible: boolean;
}

// ── Evidence ─────────────────────────────────────────────────────────────────

export interface EvidencePreviewItem {
  id: string;
  kind: "ocr_text" | "extracted_field" | "benchmark" | "derived_calc" | "missing_from_quote";
  label: string;
  previewVisible: boolean;
  blurredInPreview: boolean;
}

export interface EvidenceExplorer {
  items: EvidenceItem[];
}

export interface EvidenceItem {
  id: string;
  findingId: string;
  kind: "ocr_text" | "extracted_field" | "benchmark" | "derived_calc" | "missing_from_quote";
  label: string;
  sourceText?: string;
  fieldKey?: string;
  fieldValue?: string | number | boolean | null;
  page?: number;
  benchmark?: {
    label: string;
    value: string;
    region?: string;
  };
  previewVisible: boolean;
  blurredInPreview: boolean;
}

// ── Coverage Map ─────────────────────────────────────────────────────────────

export type CoverageDomain =
  | "scope"
  | "compliance"
  | "pricing"
  | "contract"
  | "warranty"
  | "identity";

export type CoverageStatus =
  | "confirmed"
  | "needs_clarification"
  | "not_visible_in_quote";

export interface CoverageRow {
  domain: CoverageDomain;
  status: CoverageStatus;
  linkedFindingIds: string[];
}

// ── Action Plan ──────────────────────────────────────────────────────────────

export interface ActionPlan {
  renegotiationAsks: ActionItem[];
  contractorQuestions: ActionItem[];
  doNotSignChecklist: ActionItem[];
  nextStepOptions: Array<"renegotiate" | "get_another_quote" | "proceed_carefully">;
}

// ── Benchmarks ───────────────────────────────────────────────────────────────

export interface BenchmarksSection {
  pricePerOpening?: number | null;
  localRange?: {
    low: number;
    high: number;
    unit: "usd_per_opening";
    regionLabel: string;
  } | null;
  marketDeviationPct?: number | null;
  benchmarkConfidence: "high" | "medium" | "low";
  notes: string[];
}

// ── Appendix ─────────────────────────────────────────────────────────────────

export interface AppendixSection {
  allFindings: Finding[];
  signalAuditTrail: SignalAuditItem[];
  analysisTimestampIso: string;
  rulesetVersion: string;
}

export interface SignalAuditItem {
  key: string;
  status: "present" | "missing" | "unclear" | "negative" | "derived";
  value?: string | number | boolean | null;
  confidence?: number | null;
  evidenceRefs: string[];
}

// ── V1 Scanner Output (what the edge function currently returns) ─────────────
// Used by the transform layer to bridge V1 → V2

export interface V1Flag {
  flag: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  pillar: string;
  detail: string;
}

export interface V1PillarScores {
  safety: number;
  install: number;
  price: number;
  finePrint: number;
  warranty: number;
}

export interface V1PreviewJson {
  grade: string;
  flag_count: number;
  opening_count_bucket: string;
  quality_band: string;
  hard_cap_applied: string | null;
  has_warranty: boolean;
  has_permits: boolean;
  pillar_scores: {
    safety_code: { status: "pass" | "warn" | "fail" };
    install_scope: { status: "pass" | "warn" | "fail" };
    price_fairness: { status: "pass" | "warn" | "fail" };
    fine_print: { status: "pass" | "warn" | "fail" };
    warranty: { status: "pass" | "warn" | "fail" };
  };
}

export interface V1FullJson {
  grade: string;
  weighted_average: number;
  hard_cap_applied: string | null;
  pillar_scores: V1PillarScores;
  flags: V1Flag[];
  extraction: V1Extraction;
  rubric_version: string;
}

export interface V1Extraction {
  document_type: string;
  is_window_door_related: boolean;
  confidence: number;
  page_count?: number;
  line_items: Array<{
    description: string;
    quantity?: number;
    unit_price?: number;
    total_price?: number;
    brand?: string;
    series?: string;
    dp_rating?: string;
    noa_number?: string;
    dimensions?: string;
  }>;
  warranty?: {
    labor_years?: number;
    manufacturer_years?: number;
    transferable?: boolean;
    details?: string;
  };
  permits?: {
    included?: boolean;
    responsible_party?: string;
    details?: string;
  };
  installation?: {
    scope_detail?: string;
    disposal_included?: boolean;
    accessories_mentioned?: boolean;
  };
  cancellation_policy?: string;
  total_quoted_price?: number;
  opening_count?: number;
  contractor_name?: string;
  hvhz_zone?: boolean;
}
