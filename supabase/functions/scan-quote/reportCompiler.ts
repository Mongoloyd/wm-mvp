// ═══════════════════════════════════════════════════════════════════════════════
// REPORT COMPILER — Deterministic Homeowner-Facing Output
// Converts structured ExtractionResult + flags + grade into readable warnings,
// missing-item checklists, and summaries. Zero AI. Zero Supabase dependencies.
// ═══════════════════════════════════════════════════════════════════════════════

import type { ExtractionResult, GradeResult } from "./scoring.ts";

// ── Public types ─────────────────────────────────────────────────────────────

export interface Warning {
  id: string;
  severity: "red" | "amber";
  pillar: string;
  headline: string;
  detail: string;
}

export interface MissingItem {
  id: string;
  label: string;
  why_it_matters: string;
}

export interface DerivedMetrics {
  price_per_opening?: number;
  county_median_per_opening?: number;
  dollar_delta?: number;
}

export interface CompiledReportOutput {
  warnings: Warning[];
  missing_items: MissingItem[];
  summary: string;
  top_warning: string | null;
  top_missing_item: string | null;
  price_per_opening: number | null;
  price_per_opening_band: string | null;
  summary_teaser: string;
  payment_risk_detected: boolean;
  scope_gap_detected: boolean;
}

// ── Flag shape (matches existing flags array stored in analyses.flags) ───────

export interface AnalysisFlag {
  id?: string;
  flag_id?: string;
  severity: "red" | "amber" | "green";
  pillar?: string;
  label: string;
  detail?: string;
  description?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt$(n: number): string {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function priceBand(ppo: number): string {
  if (ppo < 600) return "budget";
  if (ppo < 900) return "below-average";
  if (ppo < 1300) return "average";
  if (ppo < 1800) return "above-average";
  return "premium";
}

// ── buildWarnings ────────────────────────────────────────────────────────────

export function buildWarnings(
  extraction: ExtractionResult,
  flags: AnalysisFlag[],
  derivedMetrics: DerivedMetrics,
): Warning[] {
  const warnings: Warning[] = [];

  // ── Payment-trap warnings ──────────────────────────────────────────────
  if (extraction.deposit_percent !== undefined && extraction.deposit_percent !== null && extraction.deposit_percent > 40) {
    warnings.push({
      id: "high_deposit",
      severity: "red",
      pillar: "price",
      headline: `Deposit is ${extraction.deposit_percent}% of the total`,
      detail: `Florida law limits contractor deposits. A ${extraction.deposit_percent}% deposit exceeds safe thresholds and reduces your leverage if work is unsatisfactory.`,
    });
  } else if (extraction.deposit_percent !== undefined && extraction.deposit_percent !== null && extraction.deposit_percent > 33) {
    warnings.push({
      id: "elevated_deposit",
      severity: "amber",
      pillar: "price",
      headline: `Deposit is ${extraction.deposit_percent}% — higher than typical`,
      detail: "Most reputable contractors ask for 10–33% upfront. A higher deposit shifts financial risk to you.",
    });
  }

  if (extraction.final_payment_before_inspection === true) {
    warnings.push({
      id: "payment_before_inspection",
      severity: "red",
      pillar: "price",
      headline: "Full payment required before final inspection",
      detail: "Paying in full before the building department inspects removes your leverage to correct defective work.",
    });
  }

  if (extraction.subject_to_remeasure_present === true) {
    warnings.push({
      id: "subject_to_remeasure",
      severity: "red",
      pillar: "price",
      headline: "Price is 'subject to remeasure'",
      detail: "This clause allows the contractor to raise the price after you've signed. The quote you're holding is not a firm price.",
    });
  }

  // ── Fine-print warnings ────────────────────────────────────────────────
  if (!extraction.cancellation_policy) {
    warnings.push({
      id: "no_cancellation_policy",
      severity: "red",
      pillar: "finePrint",
      headline: "No cancellation policy found",
      detail: "Florida's 3-day right of rescission should be clearly stated. Its absence may indicate the contractor is not following consumer protection law.",
    });
  }

  if (extraction.state_jurisdiction_mismatch === true) {
    warnings.push({
      id: "out_of_state_contractor",
      severity: "amber",
      pillar: "finePrint",
      headline: "Contractor address appears to be out of state",
      detail: "An out-of-state business address raises questions about local licensing, warranty enforcement, and permit accountability.",
    });
  }

  if (extraction.generic_product_description_present === true) {
    warnings.push({
      id: "generic_products",
      severity: "amber",
      pillar: "finePrint",
      headline: "Product descriptions are vague or generic",
      detail: "Without specific brand, series, and performance ratings, you cannot verify what you're actually getting.",
    });
  }

  // ── Safety warnings ────────────────────────────────────────────────────
  const items = extraction.line_items ?? [];
  const hasImpact = items.some(i => /impact|hurricane|storm/i.test(i.description || ""));
  if (!hasImpact && items.length > 0) {
    warnings.push({
      id: "no_impact_products",
      severity: "red",
      pillar: "safety",
      headline: "No impact-rated products identified",
      detail: "Florida building code requires impact-rated windows in most zones. This quote does not clearly specify impact or hurricane-rated products.",
    });
  }

  const missingDp = items.filter(i => !i.dp_rating);
  if (missingDp.length > 0 && items.length > 0) {
    warnings.push({
      id: "missing_dp_ratings",
      severity: "amber",
      pillar: "safety",
      headline: `${missingDp.length} product(s) missing DP rating`,
      detail: "Design Pressure (DP) ratings prove a window can withstand hurricane-force winds. Missing ratings mean you can't verify code compliance.",
    });
  }

  // ── Scope warnings ────────────────────────────────────────────────────
  if (extraction.engineering_mentioned === false) {
    warnings.push({
      id: "no_engineering",
      severity: "amber",
      pillar: "install",
      headline: "No engineering or structural assessment mentioned",
      detail: "Impact window installations in Florida often require engineering sign-off, especially for large openings or older homes.",
    });
  }

  // ── Warranty warnings ─────────────────────────────────────────────────
  if (!extraction.warranty) {
    warnings.push({
      id: "no_warranty_section",
      severity: "red",
      pillar: "warranty",
      headline: "No warranty information found",
      detail: "A quote without warranty details leaves you unprotected if products fail or installation is defective.",
    });
  } else {
    if (extraction.warranty.labor_years !== undefined && extraction.warranty.labor_years < 2) {
      warnings.push({
        id: "weak_labor_warranty",
        severity: "amber",
        pillar: "warranty",
        headline: `Labor warranty is only ${extraction.warranty.labor_years} year(s)`,
        detail: "Industry standard for quality installers is 2–5 years on labor. A short warranty suggests the contractor isn't confident in their work.",
      });
    }
    if (extraction.warranty.manufacturer_years !== undefined && extraction.warranty.manufacturer_years < 10) {
      warnings.push({
        id: "weak_manufacturer_warranty",
        severity: "amber",
        pillar: "warranty",
        headline: `Manufacturer warranty is only ${extraction.warranty.manufacturer_years} years`,
        detail: "Top-tier impact windows carry 20+ year manufacturer warranties. Under 10 years may signal lower-grade products.",
      });
    }
  }

  // ── Price outlier from county benchmarks ───────────────────────────────
  if (derivedMetrics.price_per_opening && derivedMetrics.county_median_per_opening) {
    const ratio = derivedMetrics.price_per_opening / derivedMetrics.county_median_per_opening;
    if (ratio > 1.4) {
      warnings.push({
        id: "price_above_market",
        severity: "red",
        pillar: "price",
        headline: `Price is ${Math.round((ratio - 1) * 100)}% above the county average`,
        detail: `At ${fmt$(derivedMetrics.price_per_opening)} per opening vs. a county median of ${fmt$(derivedMetrics.county_median_per_opening)}, this quote is significantly above market.`,
      });
    } else if (ratio > 1.2) {
      warnings.push({
        id: "price_elevated",
        severity: "amber",
        pillar: "price",
        headline: `Price is ${Math.round((ratio - 1) * 100)}% above the county average`,
        detail: `At ${fmt$(derivedMetrics.price_per_opening)} per opening vs. ${fmt$(derivedMetrics.county_median_per_opening)} county median — worth negotiating.`,
      });
    }
  }

  // ── Absorb any existing flags not already covered ─────────────────────
  for (const flag of flags) {
    if (flag.severity === "green") continue;
    const fid = flag.id ?? flag.flag_id ?? flag.label;
    if (warnings.some(w => w.id === fid)) continue;
    warnings.push({
      id: fid,
      severity: flag.severity === "red" ? "red" : "amber",
      pillar: flag.pillar ?? "general",
      headline: flag.label,
      detail: flag.detail ?? flag.description ?? "",
    });
  }

  // Sort: red first, then amber
  warnings.sort((a, b) => (a.severity === "red" ? 0 : 1) - (b.severity === "red" ? 0 : 1));

  return warnings;
}

// ── buildMissingItems ────────────────────────────────────────────────────────

export function buildMissingItems(extraction: ExtractionResult): MissingItem[] {
  const missing: MissingItem[] = [];

  if (!extraction.permits || extraction.permits.included === undefined) {
    missing.push({
      id: "permits",
      label: "Permit information",
      why_it_matters: "Florida requires building permits for window replacements. If the quote doesn't address permits, you may face surprise fees or code violations.",
    });
  }

  if (extraction.permit_fees_itemized === false) {
    missing.push({
      id: "permit_fees",
      label: "Itemized permit fees",
      why_it_matters: "Without knowing the permit cost upfront, it could be buried in markup or billed as an add-on later.",
    });
  }

  if (!extraction.installation?.scope_detail) {
    missing.push({
      id: "install_scope",
      label: "Installation scope details",
      why_it_matters: "Without a clear scope of work, there's no way to hold the contractor accountable for what's included.",
    });
  }

  if (!extraction.installation?.disposal_included) {
    missing.push({
      id: "disposal",
      label: "Old window disposal",
      why_it_matters: "Disposal of old windows and debris is often an add-on charge. If it's not mentioned, expect a surprise fee on install day.",
    });
  }

  if (extraction.debris_removal_included === false) {
    missing.push({
      id: "debris_removal",
      label: "Debris and cleanup",
      why_it_matters: "Post-installation cleanup should be included. If not, you may be left with construction debris in your yard.",
    });
  }

  if (!extraction.wall_repair_scope) {
    missing.push({
      id: "wall_repair",
      label: "Wall repair / finishing scope",
      why_it_matters: "Window replacements often require stucco, drywall, or paint touch-up. If not specified, these become change orders.",
    });
  }

  if (extraction.stucco_repair_included === false) {
    missing.push({
      id: "stucco_repair",
      label: "Stucco repair",
      why_it_matters: "Removing old windows frequently damages exterior stucco. Repair should be included or clearly excluded.",
    });
  }

  if (extraction.drywall_repair_included === false) {
    missing.push({
      id: "drywall_repair",
      label: "Interior drywall repair",
      why_it_matters: "Interior wall damage during installation is common. If repair isn't included, you'll pay out-of-pocket.",
    });
  }

  if (extraction.paint_touchup_included === false) {
    missing.push({
      id: "paint_touchup",
      label: "Paint touch-up",
      why_it_matters: "Visible paint damage around new windows looks unfinished. Touch-up should be part of the job.",
    });
  }

  if (!extraction.cancellation_policy) {
    missing.push({
      id: "cancellation_policy",
      label: "Cancellation policy",
      why_it_matters: "Florida law gives you a 3-day right of rescission for home solicitation sales. A missing policy is a consumer protection gap.",
    });
  }

  if (!extraction.payment_schedule_text) {
    missing.push({
      id: "payment_schedule",
      label: "Payment schedule",
      why_it_matters: "A clear payment schedule protects both parties. Without one, the contractor controls when and how much you pay.",
    });
  }

  if (!extraction.completion_timeline_text) {
    missing.push({
      id: "completion_timeline",
      label: "Estimated completion timeline",
      why_it_matters: "Without a timeline commitment, there's no accountability for project delays.",
    });
  }

  if (extraction.insurance_proof_mentioned === false) {
    missing.push({
      id: "insurance_proof",
      label: "Proof of insurance",
      why_it_matters: "If a worker is injured on your property and the contractor is uninsured, you may be liable.",
    });
  }

  if (extraction.licensing_proof_mentioned === false) {
    missing.push({
      id: "licensing_proof",
      label: "Contractor license number",
      why_it_matters: "A licensed contractor is accountable to the state. Without a license number, you can't verify their credentials.",
    });
  }

  if (extraction.lead_paint_disclosure_present === false) {
    missing.push({
      id: "lead_paint_disclosure",
      label: "Lead paint disclosure",
      why_it_matters: "Homes built before 1978 require a lead paint disclosure. Its absence may violate federal law.",
    });
  }

  const items = extraction.line_items ?? [];
  const unbranded = items.filter(i => !i.brand && !i.series);
  if (unbranded.length > 0 && items.length > 0) {
    missing.push({
      id: "product_specs",
      label: `Product brand/series for ${unbranded.length} item(s)`,
      why_it_matters: "Without specific brand and series info, you can't comparison-shop or verify product quality.",
    });
  }

  const noPriceItems = items.filter(i => i.unit_price === undefined && i.total_price === undefined);
  if (noPriceItems.length > 0 && items.length > 0) {
    missing.push({
      id: "line_item_pricing",
      label: `Individual pricing for ${noPriceItems.length} item(s)`,
      why_it_matters: "Lump-sum pricing hides markup. Per-item pricing lets you see exactly what you're paying for each window.",
    });
  }

  return missing;
}

// ── buildSummary ─────────────────────────────────────────────────────────────

export function buildSummary(
  extraction: ExtractionResult,
  gradeResult: GradeResult,
  warnings: Warning[],
  missingItems: MissingItem[],
  derivedMetrics: DerivedMetrics,
): string {
  const grade = gradeResult.letterGrade;
  const redCount = warnings.filter(w => w.severity === "red").length;
  const amberCount = warnings.filter(w => w.severity === "amber").length;
  const missingCount = missingItems.length;
  const contractor = extraction.contractor_name ?? "This contractor";
  const openings = extraction.opening_count ?? (extraction.line_items ?? []).length;
  const total = extraction.total_quoted_price;

  const parts: string[] = [];

  // Opening line
  if (total && openings) {
    parts.push(
      `${contractor}'s quote of ${fmt$(total)} for ${openings} opening${openings !== 1 ? "s" : ""} received a grade of ${grade}.`,
    );
  } else {
    parts.push(`${contractor}'s quote received a grade of ${grade}.`);
  }

  // Flag summary
  if (redCount > 0 && amberCount > 0) {
    parts.push(`We found ${redCount} critical issue${redCount !== 1 ? "s" : ""} and ${amberCount} concern${amberCount !== 1 ? "s" : ""} that need your attention.`);
  } else if (redCount > 0) {
    parts.push(`We found ${redCount} critical issue${redCount !== 1 ? "s" : ""} that need${redCount === 1 ? "s" : ""} your attention.`);
  } else if (amberCount > 0) {
    parts.push(`We found ${amberCount} concern${amberCount !== 1 ? "s" : ""} worth reviewing.`);
  }

  // Missing items
  if (missingCount > 0) {
    parts.push(`${missingCount} item${missingCount !== 1 ? "s are" : " is"} missing from this quote that a complete proposal should include.`);
  }

  // Price context
  if (derivedMetrics.price_per_opening && derivedMetrics.county_median_per_opening) {
    const ratio = derivedMetrics.price_per_opening / derivedMetrics.county_median_per_opening;
    if (ratio > 1.2) {
      parts.push(`At ${fmt$(derivedMetrics.price_per_opening)} per opening, the price is above the county average of ${fmt$(derivedMetrics.county_median_per_opening)}.`);
    } else if (ratio < 0.8) {
      parts.push(`At ${fmt$(derivedMetrics.price_per_opening)} per opening, the price is below the county average — verify that quality and scope are not being sacrificed.`);
    } else {
      parts.push(`The price of ${fmt$(derivedMetrics.price_per_opening)} per opening is within the normal range for your county.`);
    }
  }

  return parts.join(" ");
}

// ── compileReportOutput ──────────────────────────────────────────────────────

export function compileReportOutput(
  extraction: ExtractionResult,
  gradeResult: GradeResult,
  flags: AnalysisFlag[],
  derivedMetrics: DerivedMetrics,
): CompiledReportOutput {
  const warnings = buildWarnings(extraction, flags, derivedMetrics);
  const missing_items = buildMissingItems(extraction);
  const summary = buildSummary(extraction, gradeResult, warnings, missing_items, derivedMetrics);

  const ppo = derivedMetrics.price_per_opening ?? null;

  const redWarnings = warnings.filter(w => w.severity === "red");
  const topWarning = redWarnings.length > 0 ? redWarnings[0].headline : (warnings.length > 0 ? warnings[0].headline : null);

  const topMissing = missing_items.length > 0 ? missing_items[0].label : null;

  // Teaser: safe to show before OTP unlock
  const teaserParts: string[] = [];
  if (redWarnings.length > 0) {
    teaserParts.push(`${redWarnings.length} red flag${redWarnings.length !== 1 ? "s" : ""}`);
  }
  if (missing_items.length > 0) {
    teaserParts.push(`${missing_items.length} missing item${missing_items.length !== 1 ? "s" : ""}`);
  }
  const summary_teaser = teaserParts.length > 0
    ? `We found ${teaserParts.join(" and ")} in this quote. Verify to see the full report.`
    : `Your quote has been analyzed. Verify to see the full report.`;

  const payment_risk_detected =
    (extraction.deposit_percent !== undefined && extraction.deposit_percent !== null && extraction.deposit_percent > 33) ||
    extraction.final_payment_before_inspection === true ||
    extraction.subject_to_remeasure_present === true;

  const scope_gap_detected =
    !extraction.wall_repair_scope ||
    extraction.debris_removal_included === false ||
    !extraction.installation?.disposal_included ||
    !extraction.installation?.scope_detail;

  return {
    warnings,
    missing_items,
    summary,
    top_warning: topWarning,
    top_missing_item: topMissing,
    price_per_opening: ppo,
    price_per_opening_band: ppo !== null ? priceBand(ppo) : null,
    summary_teaser,
    payment_risk_detected,
    scope_gap_detected,
  };
}
