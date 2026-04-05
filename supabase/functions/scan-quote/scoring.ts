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
}

// ── Rubric constants ─────────────────────────────────────────────────────────

export const RUBRIC_VERSION = "1.1.0";

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
  const itemsWithoutDp = items.filter(i => !i.dp_rating);
  const itemsWithoutNoa = items.filter(i => !i.noa_number);

  if (itemsWithoutDp.length > 0) score -= Math.min(50, itemsWithoutDp.length * 25);
  if (itemsWithoutNoa.length > 0) score -= Math.min(40, itemsWithoutNoa.length * 20);
  if (data.hvhz_zone === undefined || data.hvhz_zone === null) score -= 10;

  const hasImpactMention = items.some(i =>
    /impact|hurricane|storm/i.test(i.description || "")
  );
  if (!hasImpactMention && items.length > 0) score -= 25;

  return clamp(score);
}

export function scoreInstall(data: ExtractionResult): number {
  let score = 100;
  if (!data.installation?.scope_detail) score -= 25;
  if (!data.permits || data.permits.included === undefined) score -= 20;
  if (!data.installation?.disposal_included) score -= 15;
  if (!data.opening_count && (data.line_items ?? []).length === 0) score -= 10;
  if (!data.installation?.accessories_mentioned) score -= 5;
  return clamp(score);
}

export function scorePrice(data: ExtractionResult): number {
  let score = 100;
  const items = data.line_items ?? [];
  const itemsWithoutPrice = items.filter(i => i.unit_price === undefined && i.total_price === undefined);

  if (itemsWithoutPrice.length > 0) score -= Math.min(40, itemsWithoutPrice.length * 20);
  if (!data.total_quoted_price) score -= 15;

  for (const item of items) {
    if (item.unit_price !== undefined) {
      if (item.unit_price < 100) score -= 10;
      if (item.unit_price > 5000) score -= 10;
    }
  }

  return clamp(score);
}

export function scoreFinePrint(data: ExtractionResult): number {
  let score = 100;
  if (!data.cancellation_policy) score -= 20;

  const items = data.line_items ?? [];
  const vague = items.filter(i => (i.description || "").length < 10);
  score -= Math.min(30, vague.length * 15);

  const unbranded = items.filter(i => !i.brand && !i.series);
  score -= Math.min(30, unbranded.length * 15);

  return clamp(score);
}

export function scoreWarranty(data: ExtractionResult): number {
  let score = 100;
  if (!data.warranty) return clamp(score - 40);
  if (data.warranty.labor_years === undefined) score -= 20;
  if (data.warranty.manufacturer_years === undefined) score -= 20;
  if (data.warranty.transferable === undefined) score -= 10;
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

  // Hard cap: safety pillar critically low → max C
  if (pillarScores.safety < 25 && (data.line_items ?? []).length > 0) {
    if (GRADE_RANK[grade] > GRADE_RANK["C"]) {
      grade = "C";
      hardCapApplied = hardCapApplied ? hardCapApplied + "+critical_safety" : "critical_safety";
    }
  }

  // Hard cap: no impact product mentions → max D
  const hasImpact = (data.line_items ?? []).some(i => /impact|hurricane|storm/i.test(i.description || ""));
  if (!hasImpact && (data.line_items ?? []).length > 0) {
    if (GRADE_RANK[grade] > GRADE_RANK["D"]) {
      grade = "D";
      hardCapApplied = hardCapApplied ? hardCapApplied + "+no_impact_products" : "no_impact_products";
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
