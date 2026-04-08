import { describe, expect, it } from "vitest";

import { BASE_GOOD_QUOTE } from "./fixtures.ts";
import { computeGrade, GRADE_RANK, type ExtractionResult } from "./scoring.ts";

function makeQuote(overrides: Partial<ExtractionResult> = {}): ExtractionResult {
  const quote = structuredClone(BASE_GOOD_QUOTE) as ExtractionResult;
  return {
    ...quote,
    ...overrides,
    line_items: overrides.line_items ?? quote.line_items,
    permits: overrides.permits ?? quote.permits,
    installation: overrides.installation ?? quote.installation,
    warranty: overrides.warranty ?? quote.warranty,
  };
}

describe("scan-quote rubric expansion scoring", () => {
  it("keeps the clean control quote at A or B with no hard cap", () => {
    const result = computeGrade(makeQuote());

    expect(GRADE_RANK[result.letterGrade]).toBeGreaterThanOrEqual(GRADE_RANK["B"]);
    expect(result.hardCapApplied).toBeNull();
  });

  it("caps glass-package ambiguity at C", () => {
    const quote = makeQuote({
      opening_level_glass_specs_present: false,
      blanket_glass_language_present: true,
      generic_product_description_present: true,
      line_items: BASE_GOOD_QUOTE.line_items.map((item) => ({
        ...item,
        glass_makeup_type: "unknown",
        glass_spec_complete: false,
      })),
    });

    const result = computeGrade(quote);

    expect(GRADE_RANK[result.letterGrade]).toBeLessThanOrEqual(GRADE_RANK["C"]);
    expect(result.hardCapApplied).toContain("unverified_glass_package");
  });

  it("caps ambiguous opening scope at C", () => {
    const result = computeGrade(
      makeQuote({
        opening_count: 12,
        opening_schedule_present: false,
        opening_schedule_product_assignments_present: false,
        bulk_scope_blob_present: true,
      }),
    );

    expect(GRADE_RANK[result.letterGrade]).toBeLessThanOrEqual(GRADE_RANK["C"]);
    expect(result.hardCapApplied).toContain("ambiguous_opening_scope");
  });

  it("caps unilateral contractor price adjustment at D", () => {
    const result = computeGrade(
      makeQuote({
        unilateral_price_adjustment_allowed: true,
        substrate_condition_clause_present: true,
        written_change_order_required: false,
        homeowner_approval_required_for_change_orders: false,
      }),
    );

    expect(GRADE_RANK[result.letterGrade]).toBeLessThanOrEqual(GRADE_RANK["D"]);
    expect(result.hardCapApplied).toContain("unilateral_price_adjustment");
  });

  it("caps substrate open-checkbook language at C", () => {
    const result = computeGrade(
      makeQuote({
        substrate_condition_clause_present: true,
        rot_unit_pricing_present: false,
        buck_replacement_unit_pricing_present: false,
        written_change_order_required: false,
      }),
    );

    expect(GRADE_RANK[result.letterGrade]).toBeLessThanOrEqual(GRADE_RANK["C"]);
    expect(result.hardCapApplied).toContain("substrate_open_checkbook");
  });

  it("caps critically underspecified install method at C", () => {
    const result = computeGrade(
      makeQuote({
        anchoring_method_text: null,
        waterproofing_method_text: null,
        manufacturer_install_compliance_stated: false,
        code_compliance_install_statement_present: false,
      }),
    );

    expect(GRADE_RANK[result.letterGrade]).toBeLessThanOrEqual(GRADE_RANK["C"]);
    expect(result.hardCapApplied).toContain("install_method_unverified");
  });

  it.skip("caps opaque warranty execution at C once Area 5 lands in scoring.ts", () => {
    const quote = makeQuote({
      // Blocked: current scoring.ts on this branch does not yet expose the
      // warranty-execution fields needed for this scenario.
    });

    const result = computeGrade(quote);
    expect(GRADE_RANK[result.letterGrade]).toBeLessThanOrEqual(GRADE_RANK["C"]);
    expect(result.hardCapApplied).toContain("opaque_warranty_execution");
  });
});
