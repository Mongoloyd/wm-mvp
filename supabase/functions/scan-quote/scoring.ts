// ═══════════════════════════════════════════════════════════════════════════════
// SCANNER BRAIN — Pure Scoring Engine
// 100% deterministic TypeScript. Zero Supabase/Deno runtime dependencies.
// Canonical source for all rubric math. Imported by index.ts and index.test.ts.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Schema ───────────────────────────────────────────────────────────────────

export interface LineItem {
  description: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  brand?: string;
  series?: string;
  dp_rating?: string;
  noa_number?: string;
  dimensions?: string;

  // ── Glass package fields ────────────────────────────────────────────────
  glass_package_text?: string | null;
  glass_makeup_type?: "monolithic_laminated" | "insulated_laminated" | "laminated" | "insulated" | "tempered" | "unknown" | null;
  glass_low_e_present?: boolean | null;
  glass_argon_present?: boolean | null;
  glass_tint_text?: string | null;
  glass_spec_complete?: boolean | null;
}

export interface ExtractionResult {
  document_type: string;
  is_window_door_related: boolean;
  confidence: number;
  page_count?: number;
  line_items: LineItem[];

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
  price_fairness?: string;
  markup_estimate?: string;
  negotiation_leverage?: string;

  // ── Payment-trap fields ──────────────────────────────────────────────────
  subject_to_remeasure_present?: boolean;
  subject_to_remeasure_text?: string;
  deposit_percent?: number;
  deposit_amount?: number;
  final_payment_before_inspection?: boolean;
  payment_schedule_text?: string;

  // ── Fine-print / terms fields ────────────────────────────────────────────
  terms_conditions_present?: boolean;

  // ── Scope-gap fields ─────────────────────────────────────────────────────
  wall_repair_scope?: string;
  stucco_repair_included?: boolean;
  drywall_repair_included?: boolean;
  paint_touchup_included?: boolean;
  debris_removal_included?: boolean;
  engineering_mentioned?: boolean;
  engineering_fees_included?: boolean;
  permit_fees_itemized?: boolean;

  // ── Trust-signal fields ──────────────────────────────────────────────────
  insurance_proof_mentioned?: boolean;
  licensing_proof_mentioned?: boolean;
  completion_timeline_text?: string;
  lead_paint_disclosure_present?: boolean;

  // ── Product-quality fields ───────────────────────────────────────────────
  generic_product_description_present?: boolean;

  // ── Glass package fields ──────────────────────────────────────────────────
  opening_level_glass_specs_present?: boolean | null;
  blanket_glass_language_present?: boolean | null;
  mixed_glass_package_visibility?: boolean | null;

  // ── Jurisdiction fields ──────────────────────────────────────────────────
  contractor_address_text?: string;
  state_jurisdiction_mismatch?: boolean;
}

// ── Rubric constants ─────────────────────────────────────────────────────────

export const RUBRIC_VERSION = "1.2.0";

export const PILLAR_WEIGHTS = {
  safety: 0.25,
  install: 0.20,
  price: 0.20,
  finePrint: 0.20,
  warranty: 0.15,
};

export const GRADE_THRESHOLDS: Record<string, number> = { A: 88, B: 70, C: 52, D: 37 };

export const CONFIDENCE_THRESHOLD = 0.4;

export const GRADE_RANK: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, F: 1 };

// ── Helpers ──────────────────────────────────────────────────────────────────

export function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

export function letterGrade(score: number): string {
  if (score >= GRADE_THRESHOLDS.A) return "A";
  if (score >= GRADE_THRESHOLDS.B) return "B";
  if (score >= GRADE_THRESHOLDS.C) return "C";
  if (score >= GRADE_THRESHOLDS.D) return "D";
  return "F";
}

// ── Pillar scorers ───────────────────────────────────────────────────────────

export function scoreSafety(data: ExtractionResult): number {
  let score = 100;
  const items = data.line_items ?? [];

  const isMissing = (val?: string) =>
    !val || /^(n\/a|na|none|unknown|tbd|-|not applicable)$/i.test(val.trim());

  const itemsWithoutDp = items.filter(i => isMissing(i.dp_rating));
  const itemsWithoutNoa = items.filter(i => isMissing(i.noa_number));

  if (itemsWithoutDp.length > 0) score -= Math.min(50, itemsWithoutDp.length * 25);
  if (itemsWithoutNoa.length > 0) score -= Math.min(40, itemsWithoutNoa.length * 20);
  if (data.hvhz_zone === undefined || data.hvhz_zone === null) score -= 10;

  const hasImpactMention = items.some(i =>
    /impact|hurricane|storm/i.test(i.description || "")
  );
  if (!hasImpactMention && items.length > 0) score -= 25;

  // Generic descriptions are suspicious, but should not alone create a D-grade.
  // They matter most when paired with missing specs.
  if (data.generic_product_description_present === true) {
    score -= 15;
    const completelyMissingSpecs =
      items.length > 0 &&
      items.every(i => isMissing(i.dp_rating) && isMissing(i.noa_number));
    if (completelyMissingSpecs) score -= 10;
  }

  return clamp(score);
}

export function scoreInstall(data: ExtractionResult): number {
  let score = 100;

  // ── Core scope detail ──────────────────────────────────────────────────
  if (!data.installation?.scope_detail) score -= 20;

  // ── Permits ────────────────────────────────────────────────────────────
  if (!data.permits || data.permits.included === undefined) score -= 15;
  if (data.permit_fees_itemized === false) score -= 5;

  // ── Disposal / debris ──────────────────────────────────────────────────
  if (!data.installation?.disposal_included) score -= 10;
  if (data.debris_removal_included === false) score -= 10;

  // ── Wall repair scope gaps ─────────────────────────────────────────────
  // Missing wall repair info is a significant scope gap in FL window installs
  if (!data.wall_repair_scope) score -= 10;
  if (data.stucco_repair_included === false) score -= 5;
  if (data.drywall_repair_included === false) score -= 5;
  if (data.paint_touchup_included === false) score -= 5;

  // ── Engineering ────────────────────────────────────────────────────────
  if (data.engineering_mentioned === false) score -= 5;
  if (data.engineering_fees_included === false) score -= 5;

  // ── Opening count / line items ─────────────────────────────────────────
  if (!data.opening_count && (data.line_items ?? []).length === 0) score -= 10;
  if (!data.installation?.accessories_mentioned) score -= 5;

  return clamp(score);
}

export function scorePrice(data: ExtractionResult): number {
  let score = 100;
  const items = data.line_items ?? [];

  // ── Line-item price transparency ───────────────────────────────────────
  const itemsWithoutPrice = items.filter(i => i.unit_price === undefined && i.total_price === undefined);
  if (itemsWithoutPrice.length > 0) score -= Math.min(30, itemsWithoutPrice.length * 15);
  if (!data.total_quoted_price) score -= 10;

  // ── Unit price outliers ────────────────────────────────────────────────
  for (const item of items) {
    if (item.unit_price !== undefined) {
      if (item.unit_price < 100) score -= 5;
      if (item.unit_price > 5000) score -= 5;
    }
  }

  // ── Deposit traps ──────────────────────────────────────────────────────
  // Florida statute limits deposits; >50% is a major red flag, >40% is a warning
  if (data.deposit_percent !== undefined && data.deposit_percent !== null) {
    if (data.deposit_percent > 50) score -= 25;
    else if (data.deposit_percent > 40) score -= 15;
    else if (data.deposit_percent > 33) score -= 5;
  }

  // ── Final payment before inspection ────────────────────────────────────
  // Paying in full before final inspection removes homeowner leverage
  if (data.final_payment_before_inspection === true) score -= 20;

  // ── Subject to remeasure ───────────────────────────────────────────────
  // "Subject to remeasure" clauses allow price increases after signing
  if (data.subject_to_remeasure_present === true) score -= 15;

  // ── Payment schedule transparency ─────────────────────────────────────
  if (!data.payment_schedule_text) score -= 5;

  return clamp(score);
}

export function scoreFinePrint(data: ExtractionResult): number {
  let score = 100;

  // ── Cancellation policy ────────────────────────────────────────────────
  // Missing cancellation policy is a critical consumer protection gap
  if (!data.cancellation_policy) score -= 25;

  // ── Terms & conditions ─────────────────────────────────────────────────
  if (data.terms_conditions_present === false) score -= 10;

  // ── Vague line items ───────────────────────────────────────────────────
  const items = data.line_items ?? [];
  const vague = items.filter(i => (i.description || "").length < 10);
  score -= Math.min(20, vague.length * 10);

  // ── Unbranded / unspecified products ───────────────────────────────────
  const unbranded = items.filter(i => !i.brand && !i.series);
  score -= Math.min(20, unbranded.length * 10);

  // ── Generic product descriptions ───────────────────────────────────────
  if (data.generic_product_description_present === true) score -= 10;

  // ── Trust signals ──────────────────────────────────────────────────────
  if (data.insurance_proof_mentioned === false) score -= 5;
  if (data.licensing_proof_mentioned === false) score -= 5;
  if (!data.completion_timeline_text) score -= 5;

  // ── Jurisdiction mismatch ──────────────────────────────────────────────
  // Out-of-state contractor is a transparency concern
  if (data.state_jurisdiction_mismatch === true) score -= 10;

  // ── Lead paint disclosure ──────────────────────────────────────────────
  if (data.lead_paint_disclosure_present === false) score -= 5;

  return clamp(score);
}

export function scoreWarranty(data: ExtractionResult): number {
  let score = 100;

  // ── No warranty section at all ─────────────────────────────────────────
  if (!data.warranty) return clamp(score - 40);

  // ── Labor warranty tiers ───────────────────────────────────────────────
  if (data.warranty.labor_years === undefined) {
    score -= 20;
  } else if (data.warranty.labor_years < 1) {
    score -= 20;
  } else if (data.warranty.labor_years < 2) {
    score -= 10;
  } else if (data.warranty.labor_years < 5) {
    score -= 5;
  }
  // 5+ years labor = no penalty (strong)

  // ── Manufacturer warranty tiers ────────────────────────────────────────
  if (data.warranty.manufacturer_years === undefined) {
    score -= 20;
  } else if (data.warranty.manufacturer_years < 10) {
    score -= 15;
  } else if (data.warranty.manufacturer_years < 20) {
    score -= 5;
  }
  // 20+ years manufacturer = no penalty (strong)

  // ── Transferability ────────────────────────────────────────────────────
  if (data.warranty.transferable === undefined) score -= 10;
  if (data.warranty.transferable === false) score -= 5;

  // ── Written details ────────────────────────────────────────────────────
  if (!data.warranty.details) score -= 10;

  return clamp(score);
}

// ── Composite types ──────────────────────────────────────────────────────────

export interface PillarScores {
  safety: number;
  install: number;
  price: number;
  finePrint: number;
  warranty: number;
}

export interface GradeResult {
  weightedAverage: number;
  letterGrade: string;
  hardCapApplied: string | null;
  pillarScores: PillarScores;
}

export type PreviewPillarStatus = "pass" | "warn" | "fail";

export interface PreviewPillarScores {
  safety_code: { status: PreviewPillarStatus };
  install_scope: { status: PreviewPillarStatus };
  price_fairness: { status: PreviewPillarStatus };
  fine_print: { status: PreviewPillarStatus };
  warranty: { status: PreviewPillarStatus };
}

// ── Grade computation (the core "Brain") ─────────────────────────────────────

export function computeGrade(data: ExtractionResult): GradeResult {
  const pillarScores: PillarScores = {
    safety: scoreSafety(data),
    install: scoreInstall(data),
    price: scorePrice(data),
    finePrint: scoreFinePrint(data),
    warranty: scoreWarranty(data),
  };

  let weightedAvg =
    pillarScores.safety * PILLAR_WEIGHTS.safety +
    pillarScores.install * PILLAR_WEIGHTS.install +
    pillarScores.price * PILLAR_WEIGHTS.price +
    pillarScores.finePrint * PILLAR_WEIGHTS.finePrint +
    pillarScores.warranty * PILLAR_WEIGHTS.warranty;

  weightedAvg = Math.round(weightedAvg * 100) / 100;

  let grade = letterGrade(weightedAvg);
  let hardCapApplied: string | null = null;

  // Hard cap: no warranty section at all → max C
  if (!data.warranty && (data.line_items ?? []).length > 0) {
    if (GRADE_RANK[grade] > GRADE_RANK["C"]) {
      grade = "C";
      hardCapApplied = "no_warranty_section";
    }
  }

  // Hard cap: safety pillar critically low → max D
  if (pillarScores.safety < 40 && (data.line_items ?? []).length > 0) {
    if (GRADE_RANK[grade] > GRADE_RANK["D"]) {
      grade = "D";
      hardCapApplied = hardCapApplied ? hardCapApplied + "+critical_safety" : "critical_safety";
    }
  }

  // Hard cap: unverified impact specs → max D
  const items = data.line_items ?? [];
  const isMissing = (val?: string) =>
    !val || /^(n\/a|na|none|unknown|tbd|-|not applicable)$/i.test(val.trim());

  const hasImpactMention = items.some(i =>
    /impact|hurricane|storm/i.test(i.description || "")
  );

  const completelyMissingSpecs =
    items.length > 0 &&
    items.every(i => isMissing(i.dp_rating) && isMissing(i.noa_number));

  const genericAndUnverified =
    data.generic_product_description_present === true && completelyMissingSpecs;

  if (((!hasImpactMention && completelyMissingSpecs) || genericAndUnverified) && items.length > 0) {
    if (GRADE_RANK[grade] > GRADE_RANK["D"]) {
      grade = "D";
      hardCapApplied = hardCapApplied
        ? hardCapApplied + "+unverified_impact_specs"
        : "unverified_impact_specs";
    }
  }

  // Hard cap: zero line items → F
  if ((data.line_items ?? []).length === 0) {
    grade = "F";
    hardCapApplied = "zero_line_items";
  }

  return { weightedAverage: weightedAvg, letterGrade: grade, hardCapApplied, pillarScores };
}

// ── Preview helpers ──────────────────────────────────────────────────────────

export function toPreviewPillarStatus(score: number): PreviewPillarStatus {
  if (score >= GRADE_THRESHOLDS.B) return "pass";
  if (score >= GRADE_THRESHOLDS.D) return "warn";
  return "fail";
}

export function buildPreviewPillarScores(pillarScores: PillarScores): PreviewPillarScores {
  return {
    safety_code: { status: toPreviewPillarStatus(pillarScores.safety) },
    install_scope: { status: toPreviewPillarStatus(pillarScores.install) },
    price_fairness: { status: toPreviewPillarStatus(pillarScores.price) },
    fine_print: { status: toPreviewPillarStatus(pillarScores.finePrint) },
    warranty: { status: toPreviewPillarStatus(pillarScores.warranty) },
  };
}
