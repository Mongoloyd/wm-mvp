import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { computeGrade, GRADE_RANK, type ExtractionResult } from "./scoring.ts";
import { BASE_GOOD_QUOTE } from "./fixtures.ts";

function makeQuote(overrides: Partial<ExtractionResult> = {}): ExtractionResult {
  const base = structuredClone(BASE_GOOD_QUOTE) as ExtractionResult;
  return {
    ...base,
    ...overrides,
    line_items: overrides.line_items ?? base.line_items,
    permits: overrides.permits ?? base.permits,
    installation: overrides.installation ?? base.installation,
    warranty: overrides.warranty ?? base.warranty,
  };
}

// ── 1. Control: baseline quote → Grade A, no hard cap ───────────────────────

Deno.test("Control: baseline quote returns Grade A with no hard cap", () => {
  const result = computeGrade(makeQuote());
  assertEquals(result.letterGrade, "A");
  assertEquals(result.hardCapApplied, null);
});

// ── 2. Glass Ambiguity Cap → max C, unverified_glass_package ────────────────

Deno.test("Glass ambiguity caps at C with unverified_glass_package", () => {
  // Keep DP/NOA intact so safety pillar stays healthy — only strip glass detail
  const quote = makeQuote({
    opening_level_glass_specs_present: false,
    blanket_glass_language_present: true,
    generic_product_description_present: true,
    line_items: BASE_GOOD_QUOTE.line_items.map((item) => ({
      ...item,
      glass_makeup_type: "unknown" as const,
      glass_spec_complete: false,
      glass_low_e_present: null,
      glass_argon_present: null,
      glass_package_text: null,
    })),
  });
  const result = computeGrade(quote);
  assertEquals(
    GRADE_RANK[result.letterGrade] <= GRADE_RANK["C"],
    true,
    `Expected grade C or worse, got ${result.letterGrade}`,
  );
  assertEquals(
    result.hardCapApplied?.includes("unverified_glass_package"),
    true,
    `Expected hardCapApplied to include unverified_glass_package, got ${result.hardCapApplied}`,
  );
});

// ── 3. Ambiguous Scope Cap → max C, ambiguous_opening_scope ─────────────────

Deno.test("Ambiguous opening scope caps at C with ambiguous_opening_scope", () => {
  const result = computeGrade(
    makeQuote({
      opening_count: 12,
      opening_schedule_present: false,
      opening_schedule_product_assignments_present: false,
      bulk_scope_blob_present: true,
    }),
  );
  assertEquals(
    GRADE_RANK[result.letterGrade] <= GRADE_RANK["C"],
    true,
    `Expected grade C or worse, got ${result.letterGrade}`,
  );
  assertEquals(
    result.hardCapApplied?.includes("ambiguous_opening_scope"),
    true,
    `Expected hardCapApplied to include ambiguous_opening_scope, got ${result.hardCapApplied}`,
  );
});

// ── 4. Unilateral Price Adjustment Cap → max D ──────────────────────────────

Deno.test("Unilateral price adjustment caps at D", () => {
  const result = computeGrade(
    makeQuote({
      unilateral_price_adjustment_allowed: true,
      written_change_order_required: false,
      homeowner_approval_required_for_change_orders: false,
    }),
  );
  assertEquals(
    GRADE_RANK[result.letterGrade] <= GRADE_RANK["D"],
    true,
    `Expected grade D or worse, got ${result.letterGrade}`,
  );
  assertEquals(
    result.hardCapApplied?.includes("unilateral_price_adjustment"),
    true,
    `Expected hardCapApplied to include unilateral_price_adjustment, got ${result.hardCapApplied}`,
  );
});

// ── 5. Substrate Open Checkbook Cap → max C ─────────────────────────────────

Deno.test("Substrate open checkbook caps at C", () => {
  const result = computeGrade(
    makeQuote({
      substrate_condition_clause_present: true,
      rot_unit_pricing_present: false,
      buck_replacement_unit_pricing_present: false,
      written_change_order_required: false,
    }),
  );
  assertEquals(
    GRADE_RANK[result.letterGrade] <= GRADE_RANK["C"],
    true,
    `Expected grade C or worse, got ${result.letterGrade}`,
  );
  assertEquals(
    result.hardCapApplied?.includes("substrate_open_checkbook"),
    true,
    `Expected hardCapApplied to include substrate_open_checkbook, got ${result.hardCapApplied}`,
  );
});

// ── 6. Install Method Underspecified Cap → max C ────────────────────────────

Deno.test("Install method underspecified caps at C", () => {
  const result = computeGrade(
    makeQuote({
      anchoring_method_text: null,
      waterproofing_method_text: null,
      manufacturer_install_compliance_stated: false,
      code_compliance_install_statement_present: false,
    }),
  );
  assertEquals(
    GRADE_RANK[result.letterGrade] <= GRADE_RANK["C"],
    true,
    `Expected grade C or worse, got ${result.letterGrade}`,
  );
  assertEquals(
    result.hardCapApplied?.includes("install_method_unverified"),
    true,
    `Expected hardCapApplied to include install_method_unverified, got ${result.hardCapApplied}`,
  );
});

// ── 7. Opaque Warranty Execution Cap → max C ────────────────────────────────

Deno.test("Opaque warranty execution caps at C", () => {
  const result = computeGrade(
    makeQuote({
      warranty_execution_details_present: false,
      warranty_service_provider_type: "unknown",
      warranty_service_provider_name: null,
      leak_callback_sla_days: null,
      labor_service_sla_days: null,
      callback_process_text: null,
    }),
  );
  assertEquals(
    GRADE_RANK[result.letterGrade] <= GRADE_RANK["C"],
    true,
    `Expected grade C or worse, got ${result.letterGrade}`,
  );
  assertEquals(
    result.hardCapApplied?.includes("opaque_warranty_execution"),
    true,
    `Expected hardCapApplied to include opaque_warranty_execution, got ${result.hardCapApplied}`,
  );
});

// ── 8. Harsher Cap Wins: D + C → final grade D ─────────────────────────────

Deno.test("Harsher cap wins: unilateral (D) + ambiguous scope (C) → grade D", () => {
  const result = computeGrade(
    makeQuote({
      unilateral_price_adjustment_allowed: true,
      written_change_order_required: false,
      homeowner_approval_required_for_change_orders: false,
      opening_count: 12,
      opening_schedule_present: false,
      opening_schedule_product_assignments_present: false,
      bulk_scope_blob_present: true,
    }),
  );
  assertEquals(result.letterGrade, "D");
  assertEquals(
    result.hardCapApplied?.includes("unilateral_price_adjustment"),
    true,
    `Expected hardCapApplied to include unilateral_price_adjustment, got ${result.hardCapApplied}`,
  );
});
