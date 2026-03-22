// ═══════════════════════════════════════════════════════════════════════════════
// REPORT FIXTURES — Test scenarios for V2 report UI development
// ═══════════════════════════════════════════════════════════════════════════════
// Use these to render the report page in dev mode without touching the edge
// function or needing real uploads. Each fixture simulates a complete
// ReportEnvelope for a specific scenario.
// ═══════════════════════════════════════════════════════════════════════════════

import type { ReportEnvelope, ReportMode } from "@/types/report-v2";

// ── FIXTURE A: Grade D — "The Overpayment Trap" ─────────────────────────────
// High-risk quote with scope gaps, missing compliance, and vague pricing.
// This is the worst-case scenario most homeowners will encounter.

export const FIXTURE_GRADE_D: ReportEnvelope = {
  version: "findings_v2",
  mode: "full",
  meta: {
    analysisId: "fixture_grade_d",
    leadId: null,
    generatedAtIso: "2026-03-20T14:15:00Z",
    rulesetVersion: "wm_rules_florida_v1",
    scannerVersion: "scanner_brain_v1",
    render: {
      partialReveal: true,
      evidenceBlurred: false,
      benchmarksVisible: true,
      appendixVisible: true,
    },
    trustSignals: {
      documentVerified: true,
      multiPageAnalyzed: true,
      contractorIdentified: true,
      ocrReadQuality: "great",
      confidenceBand: "high",
    },
  },
  verdict: {
    grade: "D",
    stanceLine: "Significant risk unless key issues are addressed or renegotiated",
    postureChips: ["overpriced", "scope_gaps", "compliance_unclear"],
    summaryCounts: { critical: 2, caution: 2, confirmed: 1 },
  },
  topFindings: [
    {
      id: "merged_compliance_gaps",
      type: "compliance_safety_risk",
      severity: "critical",
      title: "Storm-code compliance cannot be verified",
      whyItMatters:
        "This quote is missing both DP ratings and product approval numbers. Without these, there is no way to confirm these products meet Florida hurricane code requirements.",
      whatToDo: [
        { id: "a1", label: "Ask for DP ratings and NOA/FL approval numbers for every opening", priority: "high", previewVisible: true },
        { id: "a2", label: "Do not sign until you can independently verify product compliance", priority: "high", previewVisible: true },
      ],
      impactReduction: "high",
      evidencePreview: [
        { id: "ev1", kind: "missing_from_quote", label: "4 items missing DP rating", previewVisible: true, blurredInPreview: false },
        { id: "ev2", kind: "missing_from_quote", label: "4 items missing NOA number", previewVisible: true, blurredInPreview: false },
      ],
      evidenceRefs: ["ev_missing_dp_rating", "ev_missing_noa_number"],
      triggeredBySignals: ["missing_dp_rating", "missing_noa_number"],
      coverageDomains: ["compliance"],
      previewSafe: true,
      sortScore: 255,
    },
    {
      id: "merged_scope_gaps",
      type: "scope_risk",
      severity: "critical",
      title: "Hidden installation costs are likely",
      whyItMatters:
        "Multiple scope items are vague or missing — permits, installation details, disposal, trim work. When these aren't spelled out, they become surprise charges after you've signed.",
      whatToDo: [
        { id: "a3", label: "Ask for a complete written scope of all installation work included", priority: "high", previewVisible: true },
        { id: "a4", label: "Confirm who pulls permits and whether fees are included", priority: "high", previewVisible: true },
        { id: "a5", label: "Ask specifically about disposal, stucco patching, and interior trim", priority: "medium", previewVisible: false },
      ],
      impactReduction: "high",
      evidencePreview: [
        { id: "ev3", kind: "missing_from_quote", label: "No permit responsibility stated", previewVisible: true, blurredInPreview: false },
        { id: "ev4", kind: "missing_from_quote", label: "Installation scope is vague or missing", previewVisible: true, blurredInPreview: false },
      ],
      evidenceRefs: ["ev_no_permits", "ev_vague_scope"],
      triggeredBySignals: ["no_permits_mentioned", "vague_install_scope"],
      coverageDomains: ["scope"],
      previewSafe: true,
      sortScore: 247,
    },
    {
      id: "finding_pricing_001",
      type: "cost_risk",
      severity: "caution",
      title: "Line item pricing is missing or bundled",
      whyItMatters:
        "When prices aren't broken out per opening, you can't tell if you're overpaying on specific items. Bundled quotes also make it harder to compare with competing bids.",
      whatToDo: [
        { id: "a6", label: "Request a per-opening price breakdown", priority: "high", previewVisible: true },
        { id: "a7", label: "Ask what's included in each line item total (product, labor, materials)", priority: "medium", previewVisible: false },
      ],
      impactReduction: "medium",
      evidencePreview: [
        { id: "ev5", kind: "missing_from_quote", label: "3 items missing individual pricing", previewVisible: true, blurredInPreview: false },
      ],
      evidenceRefs: ["ev_missing_pricing"],
      triggeredBySignals: ["missing_line_item_pricing"],
      coverageDomains: ["pricing"],
      previewSafe: true,
      sortScore: 175,
    },
    {
      id: "merged_fine_print",
      type: "contract_fine_print_risk",
      severity: "caution",
      title: "Contract terms leave you exposed",
      whyItMatters:
        "The fine print is missing key protections. Without specified brands and cancellation terms, the contractor has room to substitute products or lock you into unfavorable terms.",
      whatToDo: [
        { id: "a8", label: "Request exact brand and series for every product", priority: "high", previewVisible: true },
        { id: "a9", label: "Ask for cancellation and change-order terms in writing", priority: "medium", previewVisible: true },
      ],
      impactReduction: "medium",
      evidencePreview: [
        { id: "ev6", kind: "missing_from_quote", label: "No cancellation policy found", previewVisible: true, blurredInPreview: false },
        { id: "ev7", kind: "missing_from_quote", label: "3 items with unspecified brand/series", previewVisible: true, blurredInPreview: false },
      ],
      evidenceRefs: ["ev_no_cancel", "ev_unbranded"],
      triggeredBySignals: ["no_cancellation_policy", "unspecified_brand"],
      coverageDomains: ["contract"],
      previewSafe: true,
      sortScore: 168,
    },
    {
      id: "confirmed_warranty",
      type: "warranty_risk",
      severity: "confirmed",
      title: "Warranty information is present",
      whyItMatters: "This quote includes warranty terms, which is a positive sign of contractor transparency.",
      whatToDo: [
        { id: "a10", label: "Verify the labor warranty duration meets your expectations (industry standard: 2-5 years)", priority: "low", previewVisible: true },
      ],
      impactReduction: "low",
      evidencePreview: [
        { id: "ev8", kind: "extracted_field", label: "Warranty section detected in quote", previewVisible: true, blurredInPreview: false },
      ],
      evidenceRefs: ["ev_warranty_present"],
      triggeredBySignals: ["warranty"],
      coverageDomains: ["warranty"],
      previewSafe: true,
      sortScore: 102,
    },
  ],
  coverageMap: [
    { domain: "compliance", status: "needs_clarification", linkedFindingIds: ["merged_compliance_gaps"] },
    { domain: "scope", status: "needs_clarification", linkedFindingIds: ["merged_scope_gaps"] },
    { domain: "pricing", status: "needs_clarification", linkedFindingIds: ["finding_pricing_001"] },
    { domain: "contract", status: "needs_clarification", linkedFindingIds: ["merged_fine_print"] },
    { domain: "warranty", status: "confirmed", linkedFindingIds: ["confirmed_warranty"] },
    { domain: "identity", status: "confirmed", linkedFindingIds: [] },
  ],
  actionPlan: {
    renegotiationAsks: [
      { id: "rn1", label: "Ask for DP ratings and NOA/FL approval numbers for every opening", priority: "high", previewVisible: false },
      { id: "rn2", label: "Ask for a complete written scope of all installation work included", priority: "high", previewVisible: false },
      { id: "rn3", label: "Confirm who pulls permits and whether fees are included", priority: "high", previewVisible: false },
    ],
    contractorQuestions: [
      { id: "cq1", label: "Ask specifically about disposal, stucco patching, and interior trim", priority: "medium", previewVisible: false },
      { id: "cq2", label: "Ask what's included in each line item total (product, labor, materials)", priority: "medium", previewVisible: false },
      { id: "cq3", label: "Request exact brand and series for every product", priority: "high", previewVisible: false },
    ],
    doNotSignChecklist: [
      { id: "dns1", label: "Resolve: Storm-code compliance cannot be verified", priority: "high", previewVisible: false },
      { id: "dns2", label: "Resolve: Hidden installation costs are likely", priority: "high", previewVisible: false },
    ],
    nextStepOptions: ["renegotiate", "get_another_quote"],
  },
  evidenceExplorer: {
    items: [
      { id: "ev1", findingId: "merged_compliance_gaps", kind: "missing_from_quote", label: "4 items missing DP rating", previewVisible: true, blurredInPreview: false },
      { id: "ev2", findingId: "merged_compliance_gaps", kind: "missing_from_quote", label: "4 items missing NOA number", previewVisible: true, blurredInPreview: false },
      { id: "ev3", findingId: "merged_scope_gaps", kind: "missing_from_quote", label: "No permit responsibility stated", previewVisible: true, blurredInPreview: false },
      { id: "ev4", findingId: "merged_scope_gaps", kind: "missing_from_quote", label: "Installation scope is vague or missing", previewVisible: true, blurredInPreview: false },
      { id: "ev_total", findingId: "", kind: "extracted_field", label: "Total quoted price: $17,400", fieldKey: "total_quoted_price", fieldValue: 17400, previewVisible: false, blurredInPreview: true },
      { id: "ev_contractor", findingId: "", kind: "extracted_field", label: "Contractor: Hurricane Shield Pro LLC", fieldKey: "contractor_name", fieldValue: "Hurricane Shield Pro LLC", previewVisible: true, blurredInPreview: false },
    ],
  },
  benchmarks: {
    pricePerOpening: 2175,
    localRange: { low: 1200, high: 1800, unit: "usd_per_opening", regionLabel: "Broward County" },
    marketDeviationPct: 28,
    benchmarkConfidence: "medium",
    notes: [
      "Based on 8 line items extracted from this quote",
      "Regional benchmark data reflects Broward County residential averages",
    ],
  },
  appendix: {
    allFindings: [], // would contain all findings, skipping for fixture brevity
    signalAuditTrail: [
      { key: "missing_dp_rating", status: "present", value: "4 item(s) missing DP rating", evidenceRefs: ["ev1"] },
      { key: "missing_noa_number", status: "present", value: "4 item(s) missing NOA number", evidenceRefs: ["ev2"] },
      { key: "no_permits_mentioned", status: "present", value: "No permit responsibility stated", evidenceRefs: ["ev3"] },
      { key: "vague_install_scope", status: "present", value: "Installation scope is vague or missing", evidenceRefs: ["ev4"] },
      { key: "missing_line_item_pricing", status: "present", value: "3 item(s) missing pricing", evidenceRefs: ["ev5"] },
      { key: "no_cancellation_policy", status: "present", value: "No cancellation policy found", evidenceRefs: ["ev6"] },
      { key: "unspecified_brand", status: "present", value: "3 item(s) with unspecified brand/series", evidenceRefs: ["ev7"] },
    ],
    analysisTimestampIso: "2026-03-20T14:15:00Z",
    rulesetVersion: "wm_rules_florida_v1",
  },
};

// ── FIXTURE B: Grade B — "The Solid Quote" ──────────────────────────────────
// A mostly-clean quote with minor issues. Tests that good quotes feel rewarding.

export const FIXTURE_GRADE_B: ReportEnvelope = {
  version: "findings_v2",
  mode: "full",
  meta: {
    analysisId: "fixture_grade_b",
    leadId: null,
    generatedAtIso: "2026-03-20T14:15:00Z",
    rulesetVersion: "wm_rules_florida_v1",
    scannerVersion: "scanner_brain_v1",
    render: {
      partialReveal: true,
      evidenceBlurred: false,
      benchmarksVisible: true,
      appendixVisible: true,
    },
    trustSignals: {
      documentVerified: true,
      multiPageAnalyzed: true,
      contractorIdentified: true,
      ocrReadQuality: "excellent",
      confidenceBand: "high",
    },
  },
  verdict: {
    grade: "B",
    stanceLine: "Mostly fair, but a few areas need clarification before signing",
    postureChips: ["fair_pricing_visible", "warranty_imbalance"],
    summaryCounts: { critical: 0, caution: 1, confirmed: 2 },
  },
  topFindings: [
    {
      id: "finding_warranty_labor",
      type: "warranty_risk",
      severity: "caution",
      title: "Labor warranty is shorter than industry standard",
      whyItMatters:
        "The manufacturer warranty is strong at 25 years, but the labor warranty is only 1 year. If an installation defect shows up in year 2, you'd pay out of pocket for the repair.",
      whatToDo: [
        { id: "b_a1", label: "Ask the contractor if they offer extended labor warranty options", priority: "medium", previewVisible: true },
        { id: "b_a2", label: "Compare labor warranty terms with other bids you've received", priority: "low", previewVisible: true },
      ],
      impactReduction: "medium",
      evidencePreview: [
        { id: "b_ev1", kind: "extracted_field", label: "Labor warranty: 1 year · Manufacturer: 25 years", previewVisible: true, blurredInPreview: false },
      ],
      evidenceRefs: ["ev_warranty_labor"],
      triggeredBySignals: ["warranty"],
      coverageDomains: ["warranty"],
      previewSafe: true,
      sortScore: 142,
    },
    {
      id: "confirmed_pricing",
      type: "cost_risk",
      severity: "confirmed",
      title: "Pricing is transparent and within market range",
      whyItMatters: "Each opening has individual pricing listed, and the total falls within expected Broward County ranges for this scope.",
      whatToDo: [
        { id: "b_a3", label: "Save this quote as your baseline for comparison if getting additional bids", priority: "low", previewVisible: true },
      ],
      impactReduction: "low",
      evidencePreview: [
        { id: "b_ev2", kind: "extracted_field", label: "Per-opening pricing visible for all 6 items", previewVisible: true, blurredInPreview: false },
      ],
      evidenceRefs: ["ev_pricing_ok"],
      triggeredBySignals: ["total_price", "line_item_breakdown"],
      coverageDomains: ["pricing"],
      previewSafe: true,
      sortScore: 115,
    },
    {
      id: "confirmed_compliance",
      type: "compliance_safety_risk",
      severity: "confirmed",
      title: "Products meet Florida hurricane code requirements",
      whyItMatters: "All listed products include DP ratings and NOA approval numbers. This means the products are verifiable as Florida-compliant.",
      whatToDo: [
        { id: "b_a4", label: "Cross-check NOA numbers on the Miami-Dade product search portal for peace of mind", priority: "low", previewVisible: true },
      ],
      impactReduction: "low",
      evidencePreview: [
        { id: "b_ev3", kind: "extracted_field", label: "DP and NOA numbers present for all 6 items", previewVisible: true, blurredInPreview: false },
      ],
      evidenceRefs: ["ev_compliance_ok"],
      triggeredBySignals: ["dp_rating", "noa_or_fl_approval"],
      coverageDomains: ["compliance"],
      previewSafe: true,
      sortScore: 120,
    },
  ],
  coverageMap: [
    { domain: "compliance", status: "confirmed", linkedFindingIds: ["confirmed_compliance"] },
    { domain: "scope", status: "confirmed", linkedFindingIds: [] },
    { domain: "pricing", status: "confirmed", linkedFindingIds: ["confirmed_pricing"] },
    { domain: "contract", status: "confirmed", linkedFindingIds: [] },
    { domain: "warranty", status: "needs_clarification", linkedFindingIds: ["finding_warranty_labor"] },
    { domain: "identity", status: "confirmed", linkedFindingIds: [] },
  ],
  actionPlan: {
    renegotiationAsks: [],
    contractorQuestions: [
      { id: "b_cq1", label: "Ask about extended labor warranty options", priority: "medium", previewVisible: false },
    ],
    doNotSignChecklist: [],
    nextStepOptions: ["proceed_carefully"],
  },
};

// ── FIXTURE C: Grade C — "The Demo Quote" (Overpayment Trap) ────────────────
// Used for the /demo route. Dramatic enough to convert, realistic enough to trust.

export const FIXTURE_DEMO: ReportEnvelope = {
  version: "findings_v2",
  mode: "partial_reveal",
  meta: {
    analysisId: "demo_session",
    leadId: null,
    generatedAtIso: "2026-03-20T14:15:00Z",
    rulesetVersion: "wm_rules_florida_v1",
    scannerVersion: "scanner_brain_v1",
    render: {
      partialReveal: true,
      evidenceBlurred: true,
      benchmarksVisible: false,
      appendixVisible: false,
    },
    trustSignals: {
      documentVerified: true,
      multiPageAnalyzed: true,
      contractorIdentified: true,
      ocrReadQuality: "good",
      confidenceBand: "high",
    },
  },
  verdict: {
    grade: "C",
    stanceLine: "Mixed signals — review the flagged items before committing",
    postureChips: ["scope_gaps", "risky_clauses"],
    summaryCounts: { critical: 1, caution: 2, confirmed: 1 },
  },
  topFindings: [
    {
      id: "demo_scope",
      type: "scope_risk",
      severity: "critical",
      title: "Hidden installation costs are likely",
      whyItMatters:
        "The installation scope is vague and permit responsibility isn't stated. These gaps typically translate to $1,500-$3,000 in surprise charges.",
      whatToDo: [
        { id: "d_a1", label: "Ask for a complete written scope of all installation work", priority: "high", previewVisible: true },
      ],
      impactReduction: "high",
      evidencePreview: [
        { id: "d_ev1", kind: "missing_from_quote", label: "Permit responsibility not stated", previewVisible: true, blurredInPreview: false },
        { id: "d_ev2", kind: "missing_from_quote", label: "Disposal and trim work not mentioned", previewVisible: true, blurredInPreview: false },
      ],
      evidenceRefs: ["ev_scope_1", "ev_scope_2"],
      triggeredBySignals: ["vague_install_scope", "no_permits_mentioned"],
      coverageDomains: ["scope"],
      previewSafe: true,
      sortScore: 247,
    },
    {
      id: "demo_fine_print",
      type: "contract_fine_print_risk",
      severity: "caution",
      title: "Contract terms leave you exposed",
      whyItMatters:
        "No cancellation policy and some products lack brand specifications. This gives the contractor room to substitute lower-quality products.",
      whatToDo: [
        { id: "d_a2", label: "Request exact brand and series for every product", priority: "high", previewVisible: true },
      ],
      impactReduction: "medium",
      evidencePreview: [
        { id: "d_ev3", kind: "missing_from_quote", label: "No cancellation policy found", previewVisible: true, blurredInPreview: false },
      ],
      evidenceRefs: ["ev_fine_print_1"],
      triggeredBySignals: ["no_cancellation_policy", "unspecified_brand"],
      coverageDomains: ["contract"],
      previewSafe: true,
      sortScore: 168,
    },
    {
      id: "demo_pricing",
      type: "cost_risk",
      severity: "caution",
      title: "Line item pricing is bundled",
      whyItMatters:
        "Without per-opening pricing, you can't compare individual items against market rates or other bids.",
      whatToDo: [
        { id: "d_a3", label: "Request a per-opening price breakdown", priority: "high", previewVisible: true },
      ],
      impactReduction: "medium",
      evidencePreview: [
        { id: "d_ev4", kind: "benchmark", label: "Market comparison available in full report", previewVisible: true, blurredInPreview: true },
      ],
      evidenceRefs: ["ev_pricing_1"],
      triggeredBySignals: ["missing_line_item_pricing"],
      coverageDomains: ["pricing"],
      previewSafe: true,
      sortScore: 155,
    },
    {
      id: "demo_compliance_ok",
      type: "compliance_safety_risk",
      severity: "confirmed",
      title: "Products appear to meet hurricane code",
      whyItMatters: "Impact ratings and product approvals are present for most items listed.",
      whatToDo: [
        { id: "d_a4", label: "Verify NOA numbers independently on the Miami-Dade portal", priority: "low", previewVisible: true },
      ],
      impactReduction: "low",
      evidencePreview: [
        { id: "d_ev5", kind: "extracted_field", label: "DP ratings detected on 6 of 8 items", previewVisible: true, blurredInPreview: false },
      ],
      evidenceRefs: ["ev_compliance_1"],
      triggeredBySignals: ["dp_rating"],
      coverageDomains: ["compliance"],
      previewSafe: true,
      sortScore: 120,
    },
  ],
  coverageMap: [
    { domain: "scope", status: "needs_clarification", linkedFindingIds: ["demo_scope"] },
    { domain: "compliance", status: "confirmed", linkedFindingIds: ["demo_compliance_ok"] },
    { domain: "pricing", status: "needs_clarification", linkedFindingIds: ["demo_pricing"] },
    { domain: "contract", status: "needs_clarification", linkedFindingIds: ["demo_fine_print"] },
    { domain: "warranty", status: "confirmed", linkedFindingIds: [] },
    { domain: "identity", status: "confirmed", linkedFindingIds: [] },
  ],
};

// ── Fixture selector for dev mode ────────────────────────────────────────────

export type FixtureKey = "grade_d" | "grade_b" | "demo";

export const FIXTURES: Record<FixtureKey, ReportEnvelope> = {
  grade_d: FIXTURE_GRADE_D,
  grade_b: FIXTURE_GRADE_B,
  demo: FIXTURE_DEMO,
};

export function getFixture(key: FixtureKey, modeOverride?: ReportMode): ReportEnvelope {
  const fixture = { ...FIXTURES[key] };
  if (modeOverride) {
    fixture.mode = modeOverride;
    fixture.meta = {
      ...fixture.meta,
      render: {
        ...fixture.meta.render,
        partialReveal: modeOverride === "partial_reveal",
        evidenceBlurred: modeOverride === "partial_reveal",
        benchmarksVisible: modeOverride === "full",
        appendixVisible: modeOverride === "full",
      },
    };
  }
  return fixture;
}
