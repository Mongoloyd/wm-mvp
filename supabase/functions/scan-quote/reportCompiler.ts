import type { ExtractionResult, GradeResult } from "./scoring.ts";

export interface CompiledReportOutput {
  warnings: string[];
  missing_items: string[];
  summary: string;
  top_warning: string | null;
  top_missing_item: string | null;
  price_per_opening: number | null;
  price_per_opening_band: "low" | "market" | "high" | "extreme" | null;
  summary_teaser: string | null;
  payment_risk_detected: boolean;
  scope_gap_detected: boolean;
}

type FlagLike = {
  flag: string;
  severity: string;
  pillar: string;
  detail: string;
};

function pushIfMissing(target: string[], label: string, condition: boolean) {
  if (condition && !target.includes(label)) target.push(label);
}

function resolvePriceBand(derivedMetrics: Record<string, unknown> | null): CompiledReportOutput["price_per_opening_band"] {
  const perOpening = (derivedMetrics?.per_opening as Record<string, unknown> | undefined)?.installed_price_per_opening;
  const value = typeof perOpening === "number" ? perOpening : null;
  if (value == null) return null;
  if (value < 800) return "low";
  if (value <= 1500) return "market";
  if (value <= 2000) return "high";
  return "extreme";
}

function resolvePricePerOpening(derivedMetrics: Record<string, unknown> | null): number | null {
  const perOpening = (derivedMetrics?.per_opening as Record<string, unknown> | undefined)?.installed_price_per_opening;
  return typeof perOpening === "number" ? perOpening : null;
}

export function buildWarnings(
  extraction: ExtractionResult,
  flags: FlagLike[],
  derivedMetrics: Record<string, unknown> | null,
): string[] {
  const warnings: string[] = [];

  if (extraction.subject_to_remeasure_present === true) {
    warnings.push(`RED FLAG: "Subject to remeasure" language allows the contractor to increase price after signing.`);
  }

  if (typeof extraction.deposit_percent === "number" && extraction.deposit_percent > 40) {
    warnings.push(`High risk: Deposit exceeds 40% (${extraction.deposit_percent}% required upfront).`);
  }

  if (extraction.final_payment_before_inspection === true) {
    warnings.push(`High risk: Final payment appears due before inspection or final sign-off.`);
  }

  if (flags.some(f => f.flag === "missing_noa_number") || flags.some(f => f.flag === "missing_dp_rating")) {
    warnings.push(`RED FLAG: No proof of impact compliance was found (missing NOA/FL approval numbers or DP ratings).`);
  }

  if (extraction.state_jurisdiction_mismatch === true) {
    warnings.push(`High risk: Contractor address or jurisdiction appears inconsistent with the Florida project context.`);
  }

  if (extraction.generic_product_description_present === true) {
    warnings.push(`High risk: Product description is too generic to verify the exact impact-rated product being sold.`);
  }

  return warnings;
}

export function buildMissingItems(extraction: ExtractionResult): string[] {
  const missing: string[] = [];

  pushIfMissing(missing, "NOA/FL product approval numbers for all windows and doors", !extraction.line_items?.every(i => !!i.noa_number));
  pushIfMissing(missing, "Design Pressure (DP) ratings for all windows and doors", !extraction.line_items?.every(i => !!i.dp_rating));
  pushIfMissing(missing, "Specific manufacturer, product line, and series", extraction.line_items?.some(i => !i.brand && !i.series) ?? true);
  pushIfMissing(missing, "Detailed wall repair scope (stucco / drywall / paint)", !extraction.wall_repair_scope);
  pushIfMissing(missing, "Debris removal and disposal clearly listed", extraction.debris_removal_included !== true);
  pushIfMissing(missing, "Permit responsibility and permit fees itemized", extraction.permit_fees_itemized !== true);
  pushIfMissing(missing, "Engineering scope or engineering fees", extraction.engineering_mentioned !== true);
  pushIfMissing(missing, "Warranty details for labor and materials", !extraction.warranty);
  pushIfMissing(missing, "Payment schedule and deposit requirements", !extraction.payment_schedule_text);
  pushIfMissing(missing, "Cancellation policy / right-to-cancel language", !extraction.cancellation_policy);
  pushIfMissing(missing, "Terms and conditions section", extraction.terms_conditions_present === false);
  pushIfMissing(missing, "Proof of insurance and licensing", extraction.insurance_proof_mentioned !== true || extraction.licensing_proof_mentioned !== true);
  pushIfMissing(missing, "Project completion timeline", !extraction.completion_timeline_text);

  return missing;
}

export function buildSummary(
  extraction: ExtractionResult,
  gradeResult: GradeResult,
  warnings: string[],
  missingItems: string[],
  derivedMetrics: Record<string, unknown> | null,
): string {
  const priceBand = resolvePriceBand(derivedMetrics);

  if (warnings.length >= 3) {
    return `This quote shows multiple high-risk issues, including contract traps and missing technical proof that should be resolved before signing.`;
  }

  if (priceBand === "extreme") {
    return `This quote appears materially overpriced for the visible scope and should be renegotiated before you move forward.`;
  }

  if (missingItems.length >= 6) {
    return `This quote is missing several key scope, compliance, and contract details that should be added before you consider signing.`;
  }

  return `This Grade ${gradeResult.letterGrade} quote needs clarification in several areas before it can be considered safe to sign.`;
}

export function compileReportOutput(
  extraction: ExtractionResult,
  gradeResult: GradeResult,
  flags: FlagLike[],
  derivedMetrics: Record<string, unknown> | null,
): CompiledReportOutput {
  const warnings = buildWarnings(extraction, flags, derivedMetrics);
  const missing_items = buildMissingItems(extraction);
  const summary = buildSummary(extraction, gradeResult, warnings, missing_items, derivedMetrics);
  const price_per_opening = resolvePricePerOpening(derivedMetrics);
  const price_per_opening_band = resolvePriceBand(derivedMetrics);

  return {
    warnings,
    missing_items,
    summary,
    top_warning: warnings[0] ?? null,
    top_missing_item: missing_items[0] ?? null,
    price_per_opening,
    price_per_opening_band,
    summary_teaser: warnings[0] ?? summary,
    payment_risk_detected:
      extraction.subject_to_remeasure_present === true ||
      extraction.final_payment_before_inspection === true ||
      (typeof extraction.deposit_percent === "number" && extraction.deposit_percent > 40),
    scope_gap_detected:
      !extraction.wall_repair_scope ||
      extraction.debris_removal_included !== true ||
      extraction.engineering_mentioned !== true,
  };
}
