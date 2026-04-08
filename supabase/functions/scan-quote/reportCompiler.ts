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
  flag?: string;
  severity?: string;
  pillar?: string;
  detail?: string;
};

function hasFlag(flags: FlagLike[] | null | undefined, flagName: string): boolean {
  return Array.isArray(flags) && flags.some((f) => f?.flag === flagName);
}

function resolvePricePerOpening(
  derivedMetrics: Record<string, unknown> | null | undefined,
): number | null {
  const perOpening = (derivedMetrics?.per_opening as Record<string, unknown> | undefined)?.installed_price_per_opening;
  return typeof perOpening === "number" && Number.isFinite(perOpening) ? perOpening : null;
}

function resolvePricePerOpeningBand(
  derivedMetrics: Record<string, unknown> | null | undefined,
): "low" | "market" | "high" | "extreme" | null {
  const value = resolvePricePerOpening(derivedMetrics);
  if (value === null) return null;
  if (value < 800) return "low";
  if (value <= 1500) return "market";
  if (value <= 2000) return "high";
  return "extreme";
}

export function buildWarnings(
  extraction: ExtractionResult,
  flags: FlagLike[] | null | undefined,
): string[] {
  const warnings: string[] = [];

  if (extraction?.subject_to_remeasure_present === true) {
    warnings.push('RED FLAG: "Subject to remeasure" language may allow the contractor to raise the price after signing.');
  }

  if (typeof extraction?.deposit_percent === "number" && Number.isFinite(extraction.deposit_percent) && extraction.deposit_percent > 40) {
    warnings.push(`High risk: Deposit requirement is unusually high at ${extraction.deposit_percent}%.`);
  }

  if (extraction?.final_payment_before_inspection === true) {
    warnings.push("High risk: Final payment appears due before inspection or final sign-off.");
  }

  if (hasFlag(flags, "missing_noa_number") || hasFlag(flags, "missing_dp_rating")) {
    warnings.push("RED FLAG: No proof of impact compliance was found (missing NOA/FL approval numbers or DP ratings).");
  }

  if (extraction?.state_jurisdiction_mismatch === true) {
    warnings.push("High risk: Contractor address or jurisdiction appears inconsistent with the Florida project context.");
  }

  if (extraction?.generic_product_description_present === true) {
    warnings.push("High risk: Product description is too generic to verify the exact impact-rated product being sold.");
  }

  if (extraction?.terms_conditions_present === false) {
    warnings.push("Caution: No terms and conditions section was found in the quote.");
  }

  if (!extraction?.cancellation_policy) {
    warnings.push("Caution: No cancellation policy or right-to-cancel language was found.");
  }

  return warnings;
}

export function buildMissingItems(
  extraction: ExtractionResult,
  flags: FlagLike[] | null | undefined,
): string[] {
  const missing: string[] = [];

  if (hasFlag(flags, "missing_noa_number")) {
    missing.push("NOA/FL product approval numbers for all windows and doors");
  }

  if (hasFlag(flags, "missing_dp_rating")) {
    missing.push("Design Pressure (DP) ratings for all windows and doors");
  }

  if (
    !Array.isArray(extraction?.line_items) ||
    extraction.line_items.some((item) => !item?.brand && !item?.series)
  ) {
    missing.push("Specific manufacturer, product line, and series");
  }

  if (!extraction?.wall_repair_scope) {
    missing.push("Detailed wall repair scope (stucco / drywall / paint)");
  }

  if (extraction?.debris_removal_included !== true) {
    missing.push("Debris removal and disposal clearly listed");
  }

  if (extraction?.permit_fees_itemized !== true) {
    missing.push("Permit responsibility and permit fees itemized");
  }

  if (extraction?.engineering_mentioned !== true) {
    missing.push("Engineering scope or engineering fees");
  }

  if (!extraction?.warranty) {
    missing.push("Warranty details for labor and materials");
  }

  if (!extraction?.payment_schedule_text) {
    missing.push("Payment schedule and deposit requirements");
  }

  if (!extraction?.cancellation_policy) {
    missing.push("Cancellation policy / right-to-cancel language");
  }

  if (extraction?.terms_conditions_present !== true) {
    missing.push("Terms and conditions section");
  }

  if (extraction?.insurance_proof_mentioned !== true || extraction?.licensing_proof_mentioned !== true) {
    missing.push("Proof of insurance and licensing");
  }

  if (!extraction?.completion_timeline_text) {
    missing.push("Project completion timeline");
  }

  return missing;
}

export function buildSummary(
  gradeResult: GradeResult,
  warnings: string[],
  missingItems: string[],
  priceBand: "low" | "market" | "high" | "extreme" | null,
): string {
  if (warnings.length >= 3) {
    return "This quote shows multiple high-risk issues, including contract traps and missing technical proof that should be resolved before signing.";
  }

  if (priceBand === "extreme") {
    return "This quote appears materially overpriced for the visible scope and should be renegotiated before you move forward.";
  }

  if (missingItems.length >= 6) {
    return "This quote is missing several key scope, compliance, and contract details that should be added before you consider signing.";
  }

  return `This Grade ${gradeResult?.letterGrade ?? "?"} quote needs clarification in several areas before it can be considered safe to sign.`;
}

export function compileReportOutput(
  extraction: ExtractionResult,
  gradeResult: GradeResult,
  flags: FlagLike[] | null | undefined,
  derivedMetrics: Record<string, unknown> | null | undefined,
): CompiledReportOutput {
  const warnings = buildWarnings(extraction, flags);
  const missing_items = buildMissingItems(extraction, flags);
  const price_per_opening = resolvePricePerOpening(derivedMetrics);
  const price_per_opening_band = resolvePricePerOpeningBand(derivedMetrics);
  const summary = buildSummary(gradeResult, warnings, missing_items, price_per_opening_band);

  return {
    warnings,
    missing_items,
    summary,
    top_warning: warnings.length > 0 ? warnings[0] : null,
    top_missing_item: missing_items.length > 0 ? missing_items[0] : null,
    price_per_opening,
    price_per_opening_band,
    summary_teaser: warnings.length > 0 ? warnings[0] : summary,
    payment_risk_detected:
      extraction?.subject_to_remeasure_present === true ||
      extraction?.final_payment_before_inspection === true ||
      (typeof extraction?.deposit_percent === "number" && Number.isFinite(extraction.deposit_percent) && extraction.deposit_percent > 40),
    scope_gap_detected:
      !extraction?.wall_repair_scope ||
      extraction?.debris_removal_included !== true ||
      extraction?.engineering_mentioned !== true,
  };
}
