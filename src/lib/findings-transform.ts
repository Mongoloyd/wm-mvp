// ═══════════════════════════════════════════════════════════════════════════════
// FINDINGS TRANSFORM — V1 Scanner Output → V2 ReportEnvelope
// ═══════════════════════════════════════════════════════════════════════════════
// This module takes the raw output from the scan-quote edge function (pillar
// scores, flags, extraction data) and reshapes it into the findings-first
// ReportEnvelope contract. The scanner brain stays untouched; this layer
// interprets its output for the V2 UI.
// ═══════════════════════════════════════════════════════════════════════════════

import type {
  ReportEnvelope,
  ReportMode,
  ReportMeta,
  VerdictHeader,
  Grade,
  RiskPostureChip,
  Finding,
  FindingSeverity,
  FindingType,
  ActionItem,
  EvidencePreviewItem,
  CoverageRow,
  CoverageDomain,
  CoverageStatus,
  ActionPlan,
  EvidenceExplorer,
  EvidenceItem,
  V1FullJson,
  V1PreviewJson,
  V1Flag,
  V1Extraction,
} from "@/types/report-v2";

// ── Ranking constants (from V2 spec) ─────────────────────────────────────────

const TYPE_WEIGHT: Record<FindingType, number> = {
  compliance_safety_risk: 100,
  cost_risk: 95,
  scope_risk: 92,
  contract_fine_print_risk: 88,
  warranty_risk: 82,
  identity_legitimacy_risk: 76,
};

const SEVERITY_WEIGHT: Record<FindingSeverity, number> = {
  critical: 100,
  caution: 60,
  confirmed: 20,
};

const CONFIDENCE_WEIGHT: Record<string, number> = {
  high: 20,
  medium: 10,
  low: 0,
};

// ── Stance lines ─────────────────────────────────────────────────────────────

const STANCE_LINES: Record<Grade, string> = {
  A: "This quote looks solid — verify the details and move forward with confidence",
  B: "Mostly fair, but a few areas need clarification before signing",
  C: "Mixed signals — review the flagged items before committing",
  D: "Significant risk unless key issues are addressed or renegotiated",
  F: "Do not sign this quote without major corrections",
};

// ── V1 flag → V2 finding type mapping ────────────────────────────────────────

const FLAG_TO_FINDING_TYPE: Record<string, FindingType> = {
  missing_dp_rating: "compliance_safety_risk",
  missing_noa_number: "compliance_safety_risk",
  no_permits_mentioned: "scope_risk",
  vague_install_scope: "scope_risk",
  missing_line_item_pricing: "cost_risk",
  no_cancellation_policy: "contract_fine_print_risk",
  unspecified_brand: "contract_fine_print_risk",
  no_warranty_section: "warranty_risk",
};

const FLAG_TO_COVERAGE_DOMAIN: Record<string, CoverageDomain> = {
  missing_dp_rating: "compliance",
  missing_noa_number: "compliance",
  no_permits_mentioned: "scope",
  vague_install_scope: "scope",
  missing_line_item_pricing: "pricing",
  no_cancellation_policy: "contract",
  unspecified_brand: "contract",
  no_warranty_section: "warranty",
};

// ── V1 severity → V2 severity mapping ────────────────────────────────────────

function mapSeverity(v1Severity: string): FindingSeverity {
  switch (v1Severity) {
    case "Critical":
      return "critical";
    case "High":
      return "critical";
    case "Medium":
      return "caution";
    case "Low":
      return "caution";
    default:
      return "caution";
  }
}

// ── Human-readable finding content ───────────────────────────────────────────

interface FindingContent {
  title: string;
  whyItMatters: string;
  actions: Array<{ label: string; priority: "high" | "medium" | "low" }>;
}

const FINDING_CONTENT: Record<string, FindingContent> = {
  missing_dp_rating: {
    title: "Storm-code compliance cannot be verified",
    whyItMatters:
      "Without DP (Design Pressure) ratings on every window, there's no proof these products meet Florida hurricane code. Your permit could be denied or your insurance claim rejected after a storm.",
    actions: [
      { label: "Ask the contractor to provide DP ratings for every opening listed", priority: "high" },
      { label: "Confirm all products carry a valid Florida Product Approval or Miami-Dade NOA", priority: "high" },
    ],
  },
  missing_noa_number: {
    title: "Product approval numbers are missing",
    whyItMatters:
      "NOA (Notice of Acceptance) numbers prove a product passed independent testing for Florida conditions. Without them, you can't verify the products are actually impact-rated.",
    actions: [
      { label: "Request NOA or FL approval numbers for each product in the quote", priority: "high" },
      { label: "Cross-check approval numbers on the Miami-Dade product search portal", priority: "medium" },
    ],
  },
  no_permits_mentioned: {
    title: "Permit responsibility is not stated",
    whyItMatters:
      "Impact window installations in Florida require building permits. If the quote doesn't say who handles permits, you may discover unexpected fees or delays — or worse, an unpermitted installation.",
    actions: [
      { label: "Ask whether permit costs are included in the quoted price", priority: "high" },
      { label: "Confirm who is responsible for pulling and closing permits", priority: "high" },
    ],
  },
  vague_install_scope: {
    title: "Installation scope is vague or incomplete",
    whyItMatters:
      "Hidden costs live in the details: stucco patching, interior trim, disposal of old windows, rot repair. If the scope isn't spelled out, those become surprise charges after the contract is signed.",
    actions: [
      { label: "Ask for a written breakdown of all installation tasks included", priority: "high" },
      { label: "Confirm whether disposal, trim, stucco, and rot repair are covered", priority: "medium" },
    ],
  },
  missing_line_item_pricing: {
    title: "Line item pricing is missing or bundled",
    whyItMatters:
      "When prices aren't broken out per opening, you can't tell if you're overpaying on specific items. Bundled quotes also make it harder to compare with competing bids.",
    actions: [
      { label: "Request a per-opening price breakdown", priority: "high" },
      { label: "Ask what's included in each line item total (product, labor, materials)", priority: "medium" },
    ],
  },
  no_cancellation_policy: {
    title: "No cancellation or refund terms found",
    whyItMatters:
      "Without clear cancellation terms, you could lose your deposit if you change your mind or if the contractor delays. Some contracts lock you in with no exit.",
    actions: [
      { label: "Ask the contractor to add cancellation terms to the contract", priority: "medium" },
      { label: "Confirm the refund policy if the project is delayed beyond the quoted timeline", priority: "medium" },
    ],
  },
  unspecified_brand: {
    title: "Product brands or series are not specified",
    whyItMatters:
      "Generic descriptions like 'impact window' without a brand and series leave room for substitution. You could receive lower-quality products that technically meet minimum code but don't match what you expected.",
    actions: [
      { label: "Ask the contractor to list the exact brand, series, and model for each product", priority: "high" },
      { label: "Verify the named products carry the appropriate DP ratings and approvals", priority: "medium" },
    ],
  },
  no_warranty_section: {
    title: "Warranty information is missing",
    whyItMatters:
      "Impact windows should come with both a manufacturer warranty (typically 10-50 years) and a labor warranty (typically 1-5 years). Missing warranty info means you have no guaranteed recourse if something fails.",
    actions: [
      { label: "Request written warranty terms for both products and installation labor", priority: "high" },
      { label: "Ask whether warranties are transferable if you sell the home", priority: "low" },
    ],
  },
};

// ── Merge rules ──────────────────────────────────────────────────────────────

interface MergeRule {
  triggerFlags: string[];
  minMatches: number;
  mergedFinding: {
    id: string;
    type: FindingType;
    severity: FindingSeverity;
    title: string;
    whyItMatters: string;
    actions: Array<{ label: string; priority: "high" | "medium" | "low" }>;
    domains: CoverageDomain[];
  };
}

const MERGE_RULES: MergeRule[] = [
  {
    triggerFlags: ["no_permits_mentioned", "vague_install_scope"],
    minMatches: 2,
    mergedFinding: {
      id: "merged_scope_gaps",
      type: "scope_risk",
      severity: "critical",
      title: "Hidden installation costs are likely",
      whyItMatters:
        "Multiple scope items are vague or missing — permits, installation details, disposal, trim work. When these aren't spelled out, they become surprise charges after you've signed.",
      actions: [
        { label: "Ask for a complete written scope of all installation work included", priority: "high" },
        { label: "Confirm who pulls permits and whether fees are included", priority: "high" },
        { label: "Ask specifically about disposal, stucco patching, and interior trim", priority: "medium" },
      ],
      domains: ["scope"],
    },
  },
  {
    triggerFlags: ["missing_dp_rating", "missing_noa_number"],
    minMatches: 2,
    mergedFinding: {
      id: "merged_compliance_gaps",
      type: "compliance_safety_risk",
      severity: "critical",
      title: "Storm-code compliance cannot be verified",
      whyItMatters:
        "This quote is missing both DP ratings and product approval numbers. Without these, there is no way to confirm these products meet Florida hurricane code requirements.",
      actions: [
        { label: "Ask for DP ratings and NOA/FL approval numbers for every opening", priority: "high" },
        { label: "Do not sign until you can independently verify product compliance", priority: "high" },
      ],
      domains: ["compliance"],
    },
  },
  {
    triggerFlags: ["no_cancellation_policy", "unspecified_brand"],
    minMatches: 2,
    mergedFinding: {
      id: "merged_fine_print",
      type: "contract_fine_print_risk",
      severity: "caution",
      title: "Contract terms leave you exposed",
      whyItMatters:
        "The fine print is missing key protections. Without specified brands and cancellation terms, the contractor has room to substitute products or lock you into unfavorable terms.",
      actions: [
        { label: "Request exact brand and series for every product", priority: "high" },
        { label: "Ask for cancellation and change-order terms in writing", priority: "medium" },
      ],
      domains: ["contract"],
    },
  },
];

// ── Transform Functions ──────────────────────────────────────────────────────

function buildConfidenceBand(confidence: number): "high" | "medium" | "low" {
  if (confidence >= 0.85) return "high";
  if (confidence >= 0.6) return "medium";
  return "low";
}

function buildOcrQuality(confidence: number): "excellent" | "great" | "good" | "fair" | "limited" {
  if (confidence >= 0.95) return "excellent";
  if (confidence >= 0.85) return "great";
  if (confidence >= 0.7) return "good";
  if (confidence >= 0.5) return "fair";
  return "limited";
}

function derivePostureChips(flags: V1Flag[], extraction: V1Extraction, grade: Grade): RiskPostureChip[] {
  const chips: RiskPostureChip[] = [];

  const hasPrice = flags.some((f) => f.flag === "missing_line_item_pricing");
  const hasScope = flags.some((f) => ["vague_install_scope", "no_permits_mentioned"].includes(f.flag));
  const hasCompliance = flags.some((f) => ["missing_dp_rating", "missing_noa_number"].includes(f.flag));
  const hasContract = flags.some((f) => ["no_cancellation_policy", "unspecified_brand"].includes(f.flag));
  const hasWarranty = flags.some((f) => f.flag === "no_warranty_section");

  if (hasPrice) chips.push("overpriced");
  if (hasScope) chips.push("scope_gaps");
  if (hasContract) chips.push("risky_clauses");
  if (hasWarranty) chips.push("warranty_imbalance");
  if (hasCompliance) chips.push("compliance_unclear");

  // Positive chips for good quotes
  if (!hasPrice && extraction.total_quoted_price) chips.push("fair_pricing_visible");
  if (!hasScope && !hasCompliance && !hasContract && !hasWarranty) chips.push("well_specified");

  return chips.slice(0, 4); // max 4 chips
}

function buildFindingFromFlag(flag: V1Flag, index: number): Finding {
  const content = FINDING_CONTENT[flag.flag];
  const findingType = FLAG_TO_FINDING_TYPE[flag.flag] || "contract_fine_print_risk";
  const severity = mapSeverity(flag.severity);
  const domain = FLAG_TO_COVERAGE_DOMAIN[flag.flag] || "contract";

  const actions: ActionItem[] = (content?.actions || [{ label: flag.detail, priority: "medium" as const }]).map(
    (a, i) => ({
      id: `action_${flag.flag}_${i}`,
      label: a.label,
      priority: a.priority,
      previewVisible: i === 0, // first action always visible in preview
    })
  );

  const evidencePreview: EvidencePreviewItem[] = [
    {
      id: `ev_${flag.flag}`,
      kind: flag.flag.startsWith("missing_") || flag.flag.startsWith("no_") ? "missing_from_quote" : "extracted_field",
      label: flag.detail,
      previewVisible: true,
      blurredInPreview: false,
    },
  ];

  const sortScore =
    SEVERITY_WEIGHT[severity] +
    TYPE_WEIGHT[findingType] +
    Math.min(actions.length * 4, 20);

  return {
    id: `finding_${flag.flag}_${index}`,
    type: findingType,
    severity,
    title: content?.title || flag.detail,
    whyItMatters: content?.whyItMatters || `This issue was detected in the ${flag.pillar} area of your quote.`,
    whatToDo: actions,
    impactReduction: severity === "critical" ? "high" : severity === "caution" ? "medium" : "low",
    evidencePreview,
    evidenceRefs: [`ev_${flag.flag}`],
    triggeredBySignals: [flag.flag],
    coverageDomains: [domain],
    previewSafe: true,
    sortScore,
  };
}

function applyMergeRules(flags: V1Flag[], findings: Finding[]): Finding[] {
  const result: Finding[] = [];
  const consumedFlagIds = new Set<string>();

  for (const rule of MERGE_RULES) {
    const matchingFlags = flags.filter((f) => rule.triggerFlags.includes(f.flag));
    if (matchingFlags.length >= rule.minMatches) {
      // Mark these flags as consumed
      matchingFlags.forEach((f) => consumedFlagIds.add(f.flag));

      const allTriggeredSignals = matchingFlags.map((f) => f.flag);
      const actions: ActionItem[] = rule.mergedFinding.actions.map((a, i) => ({
        id: `action_${rule.mergedFinding.id}_${i}`,
        label: a.label,
        priority: a.priority,
        previewVisible: i < 2,
      }));

      const sortScore =
        SEVERITY_WEIGHT[rule.mergedFinding.severity] +
        TYPE_WEIGHT[rule.mergedFinding.type] +
        CONFIDENCE_WEIGHT["high"] +
        Math.min(allTriggeredSignals.length * 3, 15) +
        Math.min(actions.length * 4, 20);

      result.push({
        id: rule.mergedFinding.id,
        type: rule.mergedFinding.type,
        severity: rule.mergedFinding.severity,
        title: rule.mergedFinding.title,
        whyItMatters: rule.mergedFinding.whyItMatters,
        whatToDo: actions,
        impactReduction: "high",
        evidencePreview: matchingFlags.map((f) => ({
          id: `ev_merged_${f.flag}`,
          kind: "missing_from_quote" as const,
          label: f.detail,
          previewVisible: true,
          blurredInPreview: false,
        })),
        evidenceRefs: matchingFlags.map((f) => `ev_${f.flag}`),
        triggeredBySignals: allTriggeredSignals,
        coverageDomains: rule.mergedFinding.domains,
        previewSafe: true,
        sortScore,
      });
    }
  }

  // Add non-consumed individual findings
  for (const f of findings) {
    const flagId = f.triggeredBySignals[0];
    if (!consumedFlagIds.has(flagId)) {
      result.push(f);
    }
  }

  return result;
}

function rankFindings(findings: Finding[]): Finding[] {
  const sorted = [...findings].sort((a, b) => {
    // Rule A: critical always above caution
    if (a.severity === "critical" && b.severity !== "critical") return -1;
    if (b.severity === "critical" && a.severity !== "critical") return 1;

    // Sort by score descending
    if (b.sortScore !== a.sortScore) return b.sortScore - a.sortScore;

    // Tie-break: more evidence refs wins
    if (b.evidenceRefs.length !== a.evidenceRefs.length)
      return b.evidenceRefs.length - a.evidenceRefs.length;

    // Tie-break: more triggered signals wins
    return b.triggeredBySignals.length - a.triggeredBySignals.length;
  });

  // Rule B: no more than 1 confirmed in top 5 unless < 3 risk findings
  const riskCount = sorted.filter((f) => f.severity !== "confirmed").length;
  if (riskCount >= 3) {
    let confirmedInTop5 = 0;
    return sorted.filter((f, i) => {
      if (i >= 5) return true; // don't filter after top 5
      if (f.severity === "confirmed") {
        confirmedInTop5++;
        return confirmedInTop5 <= 1;
      }
      return true;
    });
  }

  return sorted;
}

function buildCoverageMap(findings: Finding[], extraction: V1Extraction): CoverageRow[] {
  const domains: CoverageDomain[] = ["scope", "compliance", "pricing", "contract", "warranty", "identity"];

  return domains.map((domain) => {
    const linked = findings.filter((f) => f.coverageDomains.includes(domain));
    const linkedIds = linked.map((f) => f.id);

    let status: CoverageStatus;
    if (linked.some((f) => f.severity === "critical" || f.severity === "caution")) {
      status = "needs_clarification";
    } else if (linked.length > 0) {
      status = "confirmed";
    } else {
      // Check if we have any data at all for this domain
      switch (domain) {
        case "identity":
          status = extraction.contractor_name ? "confirmed" : "not_visible_in_quote";
          break;
        case "warranty":
          status = extraction.warranty ? "confirmed" : "not_visible_in_quote";
          break;
        default:
          status = "confirmed";
      }
    }

    return { domain, status, linkedFindingIds: linkedIds };
  });
}

function buildActionPlan(findings: Finding[]): ActionPlan {
  const criticalFindings = findings.filter((f) => f.severity === "critical");
  const cautionFindings = findings.filter((f) => f.severity === "caution");

  const renegotiationAsks: ActionItem[] = criticalFindings
    .flatMap((f) => f.whatToDo.filter((a) => a.priority === "high"))
    .slice(0, 5);

  const contractorQuestions: ActionItem[] = [
    ...criticalFindings.flatMap((f) => f.whatToDo.filter((a) => a.priority === "medium")),
    ...cautionFindings.flatMap((f) => f.whatToDo.filter((a) => a.priority === "high")),
  ].slice(0, 5);

  const doNotSignChecklist: ActionItem[] = criticalFindings.map((f, i) => ({
    id: `dns_${i}`,
    label: `Resolve: ${f.title}`,
    priority: "high" as const,
    previewVisible: false,
  }));

  const nextStepOptions: Array<"renegotiate" | "get_another_quote" | "proceed_carefully"> = [];
  if (criticalFindings.length > 0) nextStepOptions.push("renegotiate");
  if (criticalFindings.length > 1) nextStepOptions.push("get_another_quote");
  if (criticalFindings.length === 0) nextStepOptions.push("proceed_carefully");

  return { renegotiationAsks, contractorQuestions, doNotSignChecklist, nextStepOptions };
}

function buildEvidenceExplorer(findings: Finding[], extraction: V1Extraction): EvidenceExplorer {
  const items: EvidenceItem[] = [];

  for (const finding of findings) {
    for (const ep of finding.evidencePreview) {
      items.push({
        id: ep.id,
        findingId: finding.id,
        kind: ep.kind,
        label: ep.label,
        previewVisible: ep.previewVisible,
        blurredInPreview: ep.blurredInPreview,
      });
    }
  }

  // Add extraction-derived evidence items
  if (extraction.total_quoted_price) {
    items.push({
      id: "ev_total_price",
      findingId: "",
      kind: "extracted_field",
      label: `Total quoted price: $${extraction.total_quoted_price.toLocaleString()}`,
      fieldKey: "total_quoted_price",
      fieldValue: extraction.total_quoted_price,
      previewVisible: false,
      blurredInPreview: true,
    });
  }

  if (extraction.contractor_name) {
    items.push({
      id: "ev_contractor",
      findingId: "",
      kind: "extracted_field",
      label: `Contractor: ${extraction.contractor_name}`,
      fieldKey: "contractor_name",
      fieldValue: extraction.contractor_name,
      previewVisible: true,
      blurredInPreview: false,
    });
  }

  return { items };
}

// ── Main Transform Function ──────────────────────────────────────────────────

export interface TransformInput {
  scanSessionId: string;
  leadId?: string | null;
  fullJson: V1FullJson;
  previewJson: V1PreviewJson;
  proofOfRead: {
    page_count: number | null;
    opening_count: number;
    contractor_name: string | null;
    document_type: string;
    line_item_count: number;
  };
  confidenceScore: number;
}

export function transformToV2(input: TransformInput, mode: ReportMode): ReportEnvelope {
  const { scanSessionId, leadId, fullJson, previewJson, proofOfRead, confidenceScore } = input;
  const extraction = fullJson.extraction;
  const flags = fullJson.flags;
  const grade = fullJson.grade as Grade;
  const confidenceBand = buildConfidenceBand(confidenceScore);
  const isLocked = mode === "partial_reveal";

  // 1. Build meta
  const meta: ReportMeta = {
    analysisId: scanSessionId,
    leadId: leadId || null,
    generatedAtIso: new Date().toISOString(),
    rulesetVersion: fullJson.rubric_version,
    scannerVersion: "scanner_brain_v1",
    render: {
      partialReveal: isLocked,
      evidenceBlurred: isLocked,
      benchmarksVisible: !isLocked,
      appendixVisible: !isLocked,
    },
    trustSignals: {
      documentVerified: true,
      multiPageAnalyzed: (proofOfRead.page_count || 1) > 1,
      contractorIdentified: !!proofOfRead.contractor_name,
      ocrReadQuality: buildOcrQuality(confidenceScore),
      confidenceBand,
    },
  };

  // 2. Build individual findings from flags
  const individualFindings = flags.map((flag, i) => buildFindingFromFlag(flag, i));

  // 3. Apply merge rules
  const mergedFindings = applyMergeRules(flags, individualFindings);

  // 4. Add confirmed findings for good areas
  if (extraction.warranty && !flags.some((f) => f.flag === "no_warranty_section")) {
    mergedFindings.push({
      id: "confirmed_warranty",
      type: "warranty_risk",
      severity: "confirmed",
      title: "Warranty information is present",
      whyItMatters: "This quote includes warranty terms, which is a positive sign of contractor transparency.",
      whatToDo: [
        {
          id: "action_confirm_warranty",
          label: "Verify the labor warranty duration meets your expectations (industry standard: 2-5 years)",
          priority: "low",
          previewVisible: true,
        },
      ],
      impactReduction: "low",
      evidencePreview: [
        {
          id: "ev_warranty_present",
          kind: "extracted_field",
          label: "Warranty section detected in quote",
          previewVisible: true,
          blurredInPreview: false,
        },
      ],
      evidenceRefs: ["ev_warranty_present"],
      triggeredBySignals: ["warranty"],
      coverageDomains: ["warranty"],
      previewSafe: true,
      sortScore: 20 + 82, // confirmed + warranty weight
    });
  }

  // 5. Rank findings
  const rankedFindings = rankFindings(mergedFindings);

  // 6. Limit for mode
  const topFindings = isLocked ? rankedFindings.slice(0, 5) : rankedFindings.slice(0, 6);

  // 7. Build verdict
  const summaryCounts = {
    critical: rankedFindings.filter((f) => f.severity === "critical").length,
    caution: rankedFindings.filter((f) => f.severity === "caution").length,
    confirmed: rankedFindings.filter((f) => f.severity === "confirmed").length,
  };

  const verdict: VerdictHeader = {
    grade,
    stanceLine: STANCE_LINES[grade],
    postureChips: derivePostureChips(flags, extraction, grade),
    summaryCounts,
  };

  // 8. Build coverage map
  const coverageMap = buildCoverageMap(rankedFindings, extraction);

  // 9. Build optional sections (full mode only)
  const actionPlan = isLocked ? undefined : buildActionPlan(rankedFindings);
  const evidenceExplorer = isLocked ? undefined : buildEvidenceExplorer(rankedFindings, extraction);

  const benchmarks: ReportEnvelope["benchmarks"] = isLocked
    ? undefined
    : {
        pricePerOpening: extraction.total_quoted_price && extraction.opening_count
          ? Math.round(extraction.total_quoted_price / extraction.opening_count)
          : null,
        localRange: null, // future: county-based benchmark data
        marketDeviationPct: null, // future: benchmark comparison
        benchmarkConfidence: confidenceBand,
        notes: [
          "Benchmark comparisons will be available in a future update",
          `Based on ${proofOfRead.line_item_count} line items extracted`,
        ],
      };

  const appendix: ReportEnvelope["appendix"] = isLocked
    ? undefined
    : {
        allFindings: rankedFindings,
        signalAuditTrail: flags.map((f) => ({
          key: f.flag,
          status: "present" as const,
          value: f.detail,
          evidenceRefs: [`ev_${f.flag}`],
        })),
        analysisTimestampIso: new Date().toISOString(),
        rulesetVersion: fullJson.rubric_version,
      };

  return {
    version: "findings_v2",
    mode,
    meta,
    verdict,
    topFindings,
    coverageMap,
    actionPlan,
    evidenceExplorer,
    benchmarks,
    appendix,
  };
}
