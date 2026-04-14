import sampleQuoteUrl from "./sample-quote.png";

let cachedBlob: Blob | null = null;

async function getSampleQuoteBlob(): Promise<Blob> {
  if (cachedBlob) return cachedBlob;
  const res = await fetch(sampleQuoteUrl);
  cachedBlob = await res.blob();
  return cachedBlob;
}

// ══════════════════════════════════════════════════════════════════════════════
// ExtractionResult — mirrors supabase/functions/scan-quote/scoring.ts v1.6.0
// Keep in sync whenever scoring.ts ExtractionResult changes.
// ══════════════════════════════════════════════════════════════════════════════

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
  // ── Glass package fields ──────────────────────────────────────────────────
  glass_package_text?: string | null;
  glass_makeup_type?:
    | "monolithic_laminated"
    | "insulated_laminated"
    | "laminated"
    | "insulated"
    | "tempered"
    | "unknown"
    | null;
  glass_low_e_present?: boolean | null;
  glass_argon_present?: boolean | null;
  glass_tint_text?: string | null;
  glass_spec_complete?: boolean | null;
  // ── Opening scope fields ──────────────────────────────────────────────────
  opening_location?: string | null;
  opening_tag?: string | null;
  product_assignment_text?: string | null;
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
  // ── Payment-trap fields ───────────────────────────────────────────────────
  subject_to_remeasure_present?: boolean;
  subject_to_remeasure_text?: string;
  deposit_percent?: number;
  deposit_amount?: number;
  final_payment_before_inspection?: boolean;
  payment_schedule_text?: string;
  // ── Fine-print / terms fields ─────────────────────────────────────────────
  terms_conditions_present?: boolean;
  // ── Scope-gap fields ──────────────────────────────────────────────────────
  wall_repair_scope?: string;
  stucco_repair_included?: boolean;
  drywall_repair_included?: boolean;
  paint_touchup_included?: boolean;
  debris_removal_included?: boolean;
  engineering_mentioned?: boolean;
  engineering_fees_included?: boolean;
  permit_fees_itemized?: boolean;
  // ── Trust-signal fields ───────────────────────────────────────────────────
  insurance_proof_mentioned?: boolean;
  licensing_proof_mentioned?: boolean;
  completion_timeline_text?: string;
  lead_paint_disclosure_present?: boolean;
  // ── Product-quality fields ────────────────────────────────────────────────
  generic_product_description_present?: boolean;
  // ── Glass package fields ──────────────────────────────────────────────────
  opening_level_glass_specs_present?: boolean | null;
  blanket_glass_language_present?: boolean | null;
  mixed_glass_package_visibility?: boolean | null;
  // ── Opening scope fields ──────────────────────────────────────────────────
  opening_schedule_present?: boolean | null;
  opening_schedule_room_labels_present?: boolean | null;
  opening_schedule_dimensions_complete?: boolean | null;
  opening_schedule_product_assignments_present?: boolean | null;
  bulk_scope_blob_present?: boolean | null;
  // ── Change-order / substrate fields ──────────────────────────────────────
  change_order_policy_text?: string | null;
  written_change_order_required?: boolean | null;
  homeowner_approval_required_for_change_orders?: boolean | null;
  unilateral_price_adjustment_allowed?: boolean | null;
  substrate_condition_clause_present?: boolean | null;
  rot_unit_pricing_present?: boolean | null;
  buck_replacement_unit_pricing_present?: boolean | null;
  substrate_allowance_text?: string | null;
  remeasure_price_adjustment_cap_present?: boolean | null;
  // ── Installation method / anchoring fields ────────────────────────────────
  anchoring_method_text?: string | null;
  anchor_spacing_specified?: boolean | null;
  fastener_type_specified?: boolean | null;
  waterproofing_method_text?: string | null;
  sealant_specified?: boolean | null;
  buck_treatment_method_text?: string | null;
  manufacturer_install_compliance_stated?: boolean | null;
  code_compliance_install_statement_present?: boolean | null;
  // ── Warranty execution fields ─────────────────────────────────────────────
  warranty_execution_details_present?: boolean | null;
  warranty_service_provider_type?: "contractor" | "manufacturer" | "third_party" | "unknown" | null;
  warranty_service_provider_name?: string | null;
  leak_callback_sla_days?: number | null;
  labor_service_sla_days?: number | null;
  callback_process_text?: string | null;
  post_install_stucco_excluded?: boolean | null;
  post_install_paint_excluded?: boolean | null;
  water_intrusion_damage_excluded?: boolean | null;
  contractor_address_text?: string;
  state_jurisdiction_mismatch?: boolean;
}

// ══════════════════════════════════════════════════════════════════════════════
// SCENARIO FIXTURES — 14 deterministic extraction payloads
// Calibrated against scoring.ts RUBRIC_VERSION = "1.6.0"
// Thresholds: A≥88, B≥70, C≥52, D≥37, else F
// ══════════════════════════════════════════════════════════════════════════════

export interface ScenarioFixture {
  key: string;
  label: string;
  description: string;
  extraction: ExtractionResult;
  expectedGrade: string | null; // null = terminal state (invalid_document, needs_better_upload)
  expectedTerminal?: "invalid_document" | "needs_better_upload";
}

export const SCENARIO_FIXTURES: ScenarioFixture[] = [
  // ── Grade A ────────────────────────────────────────────────────────────────
  // All 5 pillars fully satisfied. No hard caps. Weighted average ≥ 88.
  {
    key: "gradeA",
    label: "Grade A",
    description: "Complete quote: all specs, warranty, permits, install scope — all v1.6.0 fields satisfied",
    expectedGrade: "A",
    extraction: {
      document_type: "impact_window_quote",
      is_window_door_related: true,
      confidence: 0.95,
      page_count: 3,
      contractor_name: "Elite Impact Windows LLC",
      opening_count: 4,
      total_quoted_price: 18400,
      hvhz_zone: true,
      cancellation_policy: "Full refund within 3 business days of signing. 15% restocking fee after materials ordered.",
      // ── Glass (Area 1) ────────────────────────────────────────────────────
      opening_level_glass_specs_present: true,
      blanket_glass_language_present: false,
      mixed_glass_package_visibility: false,
      // ── Opening scope (Area 2) ────────────────────────────���───────────────
      opening_schedule_present: true,
      opening_schedule_room_labels_present: true,
      opening_schedule_dimensions_complete: true,
      opening_schedule_product_assignments_present: true,
      bulk_scope_blob_present: false,
      // ── Legal / Fine Print (Area 3) ───────────────────────────────────────
      terms_conditions_present: true,
      written_change_order_required: true,
      homeowner_approval_required_for_change_orders: true,
      unilateral_price_adjustment_allowed: false,
      substrate_condition_clause_present: false,
      rot_unit_pricing_present: true,
      buck_replacement_unit_pricing_present: true,
      subject_to_remeasure_present: false,
      final_payment_before_inspection: false,
      remeasure_price_adjustment_cap_present: true,
      payment_schedule_text: "30% deposit, 40% on material delivery, 30% on completion",
      deposit_percent: 30,
      generic_product_description_present: false,
      // ── Install method (Area 4) ───────────────────────────────────────────
      anchoring_method_text: "Tapcon concrete anchors per manufacturer spec",
      anchor_spacing_specified: true,
      fastener_type_specified: true,
      waterproofing_method_text: "Sealant and flashing tape per FBC",
      sealant_specified: true,
      buck_treatment_method_text: "Pressure-treated 2x4 buck with moisture barrier",
      manufacturer_install_compliance_stated: true,
      code_compliance_install_statement_present: true,
      // ── Warranty execution (Area 5) ───────────────────────────────────────
      warranty_execution_details_present: true,
      warranty_service_provider_type: "contractor",
      warranty_service_provider_name: "Elite Impact Windows LLC",
      leak_callback_sla_days: 5,
      labor_service_sla_days: 5,
      callback_process_text: "Call office within 48 hours — technician dispatched within 5 business days",
      post_install_stucco_excluded: false,
      post_install_paint_excluded: false,
      water_intrusion_damage_excluded: false,
      // ── Scope gaps / trust signals ────────────────────────────────────────
      wall_repair_scope: "Stucco patch and interior trim replacement included",
      stucco_repair_included: true,
      drywall_repair_included: true,
      paint_touchup_included: true,
      debris_removal_included: true,
      engineering_mentioned: true,
      engineering_fees_included: true,
      permit_fees_itemized: true,
      insurance_proof_mentioned: true,
      licensing_proof_mentioned: true,
      completion_timeline_text: "6-8 weeks from permit approval",
      lead_paint_disclosure_present: true,
      line_items: [
        {
          description: "PGT WinGuard Impact Single Hung Window",
          quantity: 2,
          unit_price: 1850,
          total_price: 3700,
          brand: "PGT",
          series: "WinGuard",
          dp_rating: "DP50",
          noa_number: "NOA 17-0501.06",
          dimensions: "36x60",
          opening_location: "Living Room",
          opening_tag: "W1",
          product_assignment_text: "PGT WinGuard SH 36x60",
          glass_package_text: "Insulated laminated Low-E Argon",
          glass_makeup_type: "insulated_laminated",
          glass_low_e_present: true,
          glass_argon_present: true,
          glass_tint_text: "clear",
          glass_spec_complete: true,
        },
        {
          description: "PGT WinGuard Impact Horizontal Roller",
          quantity: 1,
          unit_price: 2200,
          total_price: 2200,
          brand: "PGT",
          series: "WinGuard",
          dp_rating: "DP50",
          noa_number: "NOA 17-0501.06",
          dimensions: "72x48",
          opening_location: "Master Bedroom",
          opening_tag: "W2",
          product_assignment_text: "PGT WinGuard HR 72x48",
          glass_package_text: "Insulated laminated Low-E Argon",
          glass_makeup_type: "insulated_laminated",
          glass_low_e_present: true,
          glass_argon_present: true,
          glass_tint_text: "clear",
          glass_spec_complete: true,
        },
        {
          description: "CGI Sentinel Impact Sliding Glass Door",
          quantity: 1,
          unit_price: 4500,
          total_price: 4500,
          brand: "CGI",
          series: "Sentinel",
          dp_rating: "DP50",
          noa_number: "NOA 18-0312.02",
          dimensions: "96x80",
          opening_location: "Back Patio",
          opening_tag: "D1",
          product_assignment_text: "CGI Sentinel SGD 96x80",
          glass_package_text: "Insulated laminated Low-E Argon",
          glass_makeup_type: "insulated_laminated",
          glass_low_e_present: true,
          glass_argon_present: true,
          glass_tint_text: "clear",
          glass_spec_complete: true,
        },
        {
          description: "PGT WinGuard Impact Picture Window - Hurricane rated",
          quantity: 1,
          unit_price: 2800,
          total_price: 2800,
          brand: "PGT",
          series: "WinGuard",
          dp_rating: "DP65",
          noa_number: "NOA 17-0501.06",
          dimensions: "60x48",
          opening_location: "Dining Room",
          opening_tag: "W3",
          product_assignment_text: "PGT WinGuard PW 60x48",
          glass_package_text: "Insulated laminated Low-E Argon",
          glass_makeup_type: "insulated_laminated",
          glass_low_e_present: true,
          glass_argon_present: true,
          glass_tint_text: "clear",
          glass_spec_complete: true,
        },
      ],
      warranty: {
        labor_years: 5,
        manufacturer_years: 25,
        transferable: true,
        details: "Manufacturer: limited lifetime on glass seal. Labor: 5-year full coverage including callbacks.",
      },
      permits: {
        included: true,
        responsible_party: "contractor",
        details: "All building permits and final inspection included in quoted price.",
      },
      installation: {
        scope_detail:
          "Full removal of existing windows, installation of new impact units, stucco patching, interior/exterior caulking, foam insulation, and final cleanup.",
        disposal_included: true,
        accessories_mentioned: true,
      },
    },
  },

  // ── Grade B ────────────────────────────────────────────────────────────────
  // Intentional B-level failures: missing NOA numbers, no cancellation policy,
  // no disposal. All v1.6.0 baseline fields present to prevent unintended C/D caps.
  {
    key: "gradeB",
    label: "Grade B",
    description: "Good quote — missing NOA numbers, no cancellation policy, no disposal",
    expectedGrade: "B",
    extraction: {
      document_type: "impact_window_quote",
      is_window_door_related: true,
      confidence: 0.88,
      page_count: 2,
      contractor_name: "Sunshine Windows Inc",
      opening_count: 3,
      total_quoted_price: 12600,
      hvhz_zone: true,
      // Intentional B-level gaps: no cancellation_policy, no disposal
      // ── Glass (Area 1) ────────────────────────────────────────────────────
      opening_level_glass_specs_present: true,
      blanket_glass_language_present: false,
      mixed_glass_package_visibility: false,
      // ── Opening scope (Area 2) ────────────────────────────────────────────
      // opening_count: 3, so no ambiguous_opening_scope cap (requires ≥5)
      opening_schedule_present: true,
      opening_schedule_room_labels_present: true,
      opening_schedule_dimensions_complete: true,
      opening_schedule_product_assignments_present: true,
      bulk_scope_blob_present: false,
      // ── Legal / Fine Print (Area 3) ───────────────────────────────────────
      terms_conditions_present: true,
      written_change_order_required: true,
      homeowner_approval_required_for_change_orders: true,
      unilateral_price_adjustment_allowed: false,
      substrate_condition_clause_present: false,
      subject_to_remeasure_present: false,
      final_payment_before_inspection: false,
      remeasure_price_adjustment_cap_present: true,
      payment_schedule_text: "33% deposit, 34% on delivery, 33% on completion",
      deposit_percent: 33,
      generic_product_description_present: false,
      // ── Install method (Area 4) — fully specified to avoid install_method_unverified cap
      anchoring_method_text: "Tapcon anchors per manufacturer spec",
      anchor_spacing_specified: true,
      fastener_type_specified: true,
      waterproofing_method_text: "Silicone sealant and flashing tape",
      sealant_specified: true,
      buck_treatment_method_text: "Moisture barrier and buck prep",
      manufacturer_install_compliance_stated: true,
      code_compliance_install_statement_present: true,
      // ── Warranty execution (Area 5) — specified to avoid opaque_warranty_execution cap
      warranty_execution_details_present: true,
      warranty_service_provider_type: "contractor",
      warranty_service_provider_name: "Sunshine Windows Inc",
      leak_callback_sla_days: 7,
      labor_service_sla_days: 5,
      callback_process_text: "Call our service line — technician dispatched within 7 business days",
      post_install_stucco_excluded: false,
      post_install_paint_excluded: false,
      water_intrusion_damage_excluded: false,
      // ── Scope gaps / trust signals ────────────────────────────────────────
      wall_repair_scope: "Caulk and sealant around all openings",
      stucco_repair_included: true,
      drywall_repair_included: true,
      paint_touchup_included: true,
      debris_removal_included: true,
      engineering_mentioned: true,
      engineering_fees_included: true,
      permit_fees_itemized: true,
      insurance_proof_mentioned: true,
      licensing_proof_mentioned: true,
      completion_timeline_text: "8-10 weeks from permit approval",
      lead_paint_disclosure_present: true,
      line_items: [
        {
          description: "PGT WinGuard Impact Single Hung Window",
          quantity: 2,
          unit_price: 1700,
          total_price: 3400,
          brand: "PGT",
          series: "WinGuard",
          dp_rating: "DP50",
          // Intentional B-level gap: no noa_number
          dimensions: "36x60",
          opening_location: "Living Room",
          opening_tag: "W1",
          product_assignment_text: "PGT WinGuard SH 36x60",
          glass_package_text: "Insulated laminated Low-E Argon",
          glass_makeup_type: "insulated_laminated",
          glass_low_e_present: true,
          glass_argon_present: true,
          glass_tint_text: "clear",
          glass_spec_complete: true,
        },
        {
          description: "Impact Sliding Glass Door - hurricane rated",
          quantity: 1,
          unit_price: 4200,
          total_price: 4200,
          brand: "CGI",
          series: "Sentinel",
          dp_rating: "DP50",
          // Intentional B-level gap: no noa_number
          dimensions: "72x80",
          opening_location: "Back Patio",
          opening_tag: "D1",
          product_assignment_text: "CGI Sentinel SGD 72x80",
          glass_package_text: "Insulated laminated Low-E Argon",
          glass_makeup_type: "insulated_laminated",
          glass_low_e_present: true,
          glass_argon_present: true,
          glass_tint_text: "clear",
          glass_spec_complete: true,
        },
      ],
      warranty: {
        // Intentional B-level weakness: shorter labor (2yr → -5 deduction)
        labor_years: 2,
        manufacturer_years: 20,
        transferable: true,
        details: "Written manufacturer and labor warranty provided at installation.",
      },
      permits: { included: true, responsible_party: "contractor" },
      installation: {
        scope_detail: "Remove and replace all specified openings. Caulk and seal.",
        // Intentional B-level gap: no disposal_included
        accessories_mentioned: true,
      },
    },
  },

  // ── Grade C ────────────────────────────────────────────────────────────────
  // Intentional C-level trigger: opening_count: 5 + no opening_schedule →
  // ambiguous_opening_scope hard cap (max C). Baseline fields prevent D-caps.
  {
    key: "gradeC",
    label: "Grade C",
    description: "Multiple missing specs, vague install scope — ambiguous_opening_scope hard cap fires",
    expectedGrade: "C",
    extraction: {
      document_type: "impact_window_quote",
      is_window_door_related: true,
      confidence: 0.78,
      page_count: 1,
      contractor_name: "Budget Windows FL",
      opening_count: 5, // ≥5 + no schedule → ambiguous_opening_scope C-cap
      total_quoted_price: 8500,
      hvhz_zone: true,
      // No cancellation_policy — intentional
      // ── Glass (Area 1) ────────────────────────────────────────────────────
      opening_level_glass_specs_present: true,
      blanket_glass_language_present: false,
      mixed_glass_package_visibility: false,
      // ── Opening scope (Area 2) — intentionally absent to trigger ambiguous cap
      // opening_schedule_present: not set → cap fires at opening_count ≥ 5
      bulk_scope_blob_present: false,
      // ── Legal / Fine Print (Area 3) ───────────────────────────────────────
      written_change_order_required: true,
      homeowner_approval_required_for_change_orders: true,
      unilateral_price_adjustment_allowed: false,
      substrate_condition_clause_present: false,
      subject_to_remeasure_present: false,
      final_payment_before_inspection: false,
      generic_product_description_present: false,
      // ── Install method (Area 4) — specified to avoid install_method_unverified C-cap
      anchoring_method_text: "Standard anchors per spec",
      waterproofing_method_text: "Caulk and foam",
      manufacturer_install_compliance_stated: true,
      code_compliance_install_statement_present: true,
      sealant_specified: true,
      // ── Warranty execution (Area 5) — specified to avoid opaque_warranty_execution C-cap
      warranty_execution_details_present: true,
      warranty_service_provider_type: "manufacturer",
      leak_callback_sla_days: 14,
      callback_process_text: "Contact manufacturer for warranty service",
      post_install_stucco_excluded: false,
      post_install_paint_excluded: false,
      water_intrusion_damage_excluded: false,
      line_items: [
        {
          description: "Impact single hung window",
          quantity: 3,
          unit_price: 950,
          total_price: 2850,
          brand: "PGT",
          // Intentional: no dp_rating, no noa_number on this item
          dimensions: "36x48",
          glass_package_text: "Laminated glass",
          glass_makeup_type: "laminated",
          glass_low_e_present: true,
          glass_argon_present: false,
          glass_spec_complete: true,
        },
        {
          description: "Impact horizontal roller",
          quantity: 2,
          unit_price: 1100,
          total_price: 2200,
          // Intentional: no brand, no dp_rating, no noa_number
          dimensions: "60x36",
          glass_package_text: "Laminated glass",
          glass_makeup_type: "laminated",
          glass_low_e_present: true,
          glass_argon_present: false,
          glass_spec_complete: true,
        },
      ],
      warranty: {
        manufacturer_years: 10,
        details: "See manufacturer documentation.",
      },
      installation: { scope_detail: "Install windows per specification" },
    },
  },

  // ── Grade D ────────────────────────────────────────────────────────────────
  // Vague descriptions, no dp/noa, no brand. critical_safety D-cap fires
  // (safety near 0: −50 dp, −40 noa, −10 hvhz, −25 no impact mention, ...).
  // No changes needed from original — kept as-is.
  {
    key: "gradeD",
    label: "Grade D",
    description: "No NOA, no DP, no permits, short descriptions, sparse warranty — critical_safety D-cap",
    expectedGrade: "D",
    extraction: {
      document_type: "impact_window_quote",
      is_window_door_related: true,
      confidence: 0.72,
      page_count: 1,
      contractor_name: "J&R Windows",
      total_quoted_price: 6000,
      // "Window" and "Slider" — no impact/hurricane/storm mention → unverified_impact_specs D-cap
      line_items: [
        { description: "Window", quantity: 4, unit_price: 750, total_price: 3000 },
        { description: "Slider", quantity: 1, unit_price: 1500, total_price: 1500 },
      ],
      warranty: { details: "1 year labor" },
    },
  },

  // ── Grade F ────────────────────────────────────────────────────────────────
  // Zero line items → zero_line_items hard cap → F.
  {
    key: "gradeF",
    label: "Grade F",
    description: "Zero line items — triggers hard cap to F",
    expectedGrade: "F",
    extraction: {
      document_type: "impact_window_quote",
      is_window_door_related: true,
      confidence: 0.65,
      page_count: 1,
      contractor_name: "Unknown Contractor",
      total_quoted_price: 15000,
      line_items: [],
    },
  },

  // ── Mixed Pillars ──────────────────────────────────────────────────────────
  // A-grade safety (all DP/NOA present, hvhz). Weak warranty (no execution detail).
  // Install method fields added to prevent install_method_unverified C-cap.
  // Expected B from weighted average: strong safety drags up, weak warranty pulls down.
  {
    key: "mixedPillars",
    label: "Mixed Pillars",
    description: "A-grade safety (all DP/NOA) but weak warranty and sparse install — expected B",
    expectedGrade: "B",
    extraction: {
      document_type: "impact_window_quote",
      is_window_door_related: true,
      confidence: 0.9,
      page_count: 2,
      contractor_name: "ProTech Windows",
      opening_count: 3,
      total_quoted_price: 14000,
      hvhz_zone: true,
      cancellation_policy: "No refunds after 48 hours.",
      // ── Glass (Area 1) ────────────────────────────────────────────────────
      opening_level_glass_specs_present: true,
      blanket_glass_language_present: false,
      mixed_glass_package_visibility: false,
      // ── Opening scope (Area 2) ────────────────────────────────────────────
      opening_schedule_present: true,
      opening_schedule_room_labels_present: true,
      opening_schedule_dimensions_complete: true,
      opening_schedule_product_assignments_present: true,
      bulk_scope_blob_present: false,
      // ── Legal (Area 3) ────────────────────────────────────────────────────
      written_change_order_required: true,
      homeowner_approval_required_for_change_orders: true,
      unilateral_price_adjustment_allowed: false,
      substrate_condition_clause_present: false,
      subject_to_remeasure_present: false,
      final_payment_before_inspection: false,
      generic_product_description_present: false,
      // ── Install method (Area 4) — must be present to prevent install_method_unverified C-cap
      anchoring_method_text: "Tapcon anchors",
      anchor_spacing_specified: true,
      fastener_type_specified: true,
      waterproofing_method_text: "Silicone sealant",
      sealant_specified: true,
      buck_treatment_method_text: "Moisture barrier",
      manufacturer_install_compliance_stated: true,
      code_compliance_install_statement_present: true,
      // ── Warranty execution (Area 5) — present to prevent opaque_warranty_execution C-cap
      warranty_execution_details_present: true,
      warranty_service_provider_type: "contractor",
      warranty_service_provider_name: "ProTech Windows",
      leak_callback_sla_days: 7,
      labor_service_sla_days: 7,
      callback_process_text: "Call office for warranty service",
      post_install_stucco_excluded: false,
      post_install_paint_excluded: false,
      water_intrusion_damage_excluded: false,
      line_items: [
        {
          description: "PGT WinGuard Impact Single Hung",
          quantity: 2,
          unit_price: 1800,
          total_price: 3600,
          brand: "PGT",
          series: "WinGuard",
          dp_rating: "DP50",
          noa_number: "NOA 17-0501.06",
          dimensions: "36x60",
          opening_location: "Living Room",
          opening_tag: "W1",
          product_assignment_text: "PGT WinGuard SH 36x60",
          glass_package_text: "Insulated laminated Low-E Argon",
          glass_makeup_type: "insulated_laminated",
          glass_low_e_present: true,
          glass_argon_present: true,
          glass_spec_complete: true,
        },
        {
          description: "CGI Sentinel Impact Slider - hurricane",
          quantity: 1,
          unit_price: 4500,
          total_price: 4500,
          brand: "CGI",
          series: "Sentinel",
          dp_rating: "DP50",
          noa_number: "NOA 18-0312.02",
          dimensions: "72x80",
          opening_location: "Back Patio",
          opening_tag: "D1",
          product_assignment_text: "CGI Sentinel SGD 72x80",
          glass_package_text: "Insulated laminated Low-E Argon",
          glass_makeup_type: "insulated_laminated",
          glass_low_e_present: true,
          glass_argon_present: true,
          glass_spec_complete: true,
        },
      ],
      // Intentional B-level weakness: warranty section exists but fields are sparse.
      // labor_years undefined → -20 warranty. No details → -10 warranty.
      // Overall warranty pillar will be low, dragging weighted average below A.
      warranty: { details: "Contact manufacturer for warranty terms." },
      installation: {
        scope_detail: "Replace all specified openings per manufacturer guidelines.",
        disposal_included: true,
        accessories_mentioned: true,
      },
      permits: { included: true, responsible_party: "contractor" },
    },
  },

  // ── Corner Cutting ─────────────────────────────────────────────────────────
  // $150/unit, no brand/series, no DP. "Impact window"/"Impact slider" have impact
  // mention so unverified_impact_specs cap won't fire on that condition alone.
  // However safety cratera: −50 dp, −40 noa, −10 hvhz, −20 glass specs →
  // safety = 0 → critical_safety D-cap fires. No changes from original.
  {
    key: "cornerCutting",
    label: "Corner-Cutting",
    description: "$150/unit, no brand/series, no DP — critical_safety D-cap from missing specs",
    expectedGrade: "D",
    extraction: {
      document_type: "impact_window_quote",
      is_window_door_related: true,
      confidence: 0.7,
      page_count: 1,
      contractor_name: "Discount Fenestration",
      total_quoted_price: 3000,
      line_items: [
        { description: "Impact window", quantity: 5, unit_price: 150, total_price: 750 },
        { description: "Impact slider", quantity: 2, unit_price: 150, total_price: 300 },
      ],
    },
  },

  // ── Overpayment Trap ───────────────────────────────────────────────────────
  // Premium pricing, missing NOA on one item, no cancellation policy.
  // Install method + warranty execution fields added to prevent C-caps.
  // Intentional B failures: 1 missing NOA (−20 safety), no cancellation (−25 finePrint).
  {
    key: "overpaymentTrap",
    label: "Overpayment Trap",
    description: "Premium pricing, one item missing NOA, no cancellation — expected B",
    expectedGrade: "B",
    extraction: {
      document_type: "impact_window_quote",
      is_window_door_related: true,
      confidence: 0.92,
      page_count: 2,
      contractor_name: "Premium Impact Solutions",
      opening_count: 5,
      total_quoted_price: 22000,
      hvhz_zone: true,
      // Intentional B gap: no cancellation_policy
      // ── Glass (Area 1) ────────────────────────────────────────────────────
      opening_level_glass_specs_present: true,
      blanket_glass_language_present: false,
      mixed_glass_package_visibility: false,
      // ── Opening scope (Area 2) — opening_count: 5 but schedule present, so no cap
      opening_schedule_present: true,
      opening_schedule_room_labels_present: true,
      opening_schedule_dimensions_complete: true,
      opening_schedule_product_assignments_present: true,
      bulk_scope_blob_present: false,
      // ── Legal (Area 3) ────────────────────────────────────────────────────
      terms_conditions_present: true,
      written_change_order_required: true,
      homeowner_approval_required_for_change_orders: true,
      unilateral_price_adjustment_allowed: false,
      substrate_condition_clause_present: false,
      subject_to_remeasure_present: false,
      final_payment_before_inspection: false,
      payment_schedule_text: "33% deposit, 33% delivery, 34% completion",
      deposit_percent: 33,
      generic_product_description_present: false,
      // ── Install method (Area 4) — specified to avoid install_method_unverified C-cap
      anchoring_method_text: "Tapcon concrete anchors",
      anchor_spacing_specified: true,
      fastener_type_specified: true,
      waterproofing_method_text: "Silicone sealant and flashing",
      sealant_specified: true,
      buck_treatment_method_text: "Moisture barrier wrap",
      manufacturer_install_compliance_stated: true,
      code_compliance_install_statement_present: true,
      // ── Warranty execution (Area 5) — specified to avoid opaque_warranty_execution C-cap
      warranty_execution_details_present: true,
      warranty_service_provider_type: "contractor",
      warranty_service_provider_name: "Premium Impact Solutions",
      leak_callback_sla_days: 7,
      labor_service_sla_days: 5,
      callback_process_text: "Call our warranty line for all service requests",
      post_install_stucco_excluded: false,
      post_install_paint_excluded: false,
      water_intrusion_damage_excluded: false,
      // ── Scope gaps ────────────────────────────────────────────────────────
      wall_repair_scope: "Stucco patch and caulk included",
      stucco_repair_included: true,
      drywall_repair_included: true,
      paint_touchup_included: true,
      debris_removal_included: true,
      engineering_mentioned: true,
      engineering_fees_included: true,
      permit_fees_itemized: true,
      insurance_proof_mentioned: true,
      licensing_proof_mentioned: true,
      completion_timeline_text: "8-12 weeks from signed contract",
      lead_paint_disclosure_present: true,
      line_items: [
        {
          description: "PGT WinGuard Impact Single Hung - Hurricane rated",
          quantity: 4,
          unit_price: 2200,
          total_price: 8800,
          brand: "PGT",
          series: "WinGuard",
          dp_rating: "DP50",
          noa_number: "NOA 17-0501.06",
          dimensions: "36x60",
          opening_location: "Various Bedrooms",
          opening_tag: "W1-W4",
          product_assignment_text: "PGT WinGuard SH 36x60",
          glass_package_text: "Insulated laminated Low-E Argon",
          glass_makeup_type: "insulated_laminated",
          glass_low_e_present: true,
          glass_argon_present: true,
          glass_spec_complete: true,
        },
        {
          description: "PGT WinGuard Impact Sliding Door - Hurricane rated",
          quantity: 1,
          unit_price: 5200,
          total_price: 5200,
          brand: "PGT",
          series: "WinGuard",
          dp_rating: "DP50",
          // Intentional B-level gap: missing noa_number on this item → −20 safety
          dimensions: "72x80",
          opening_location: "Back Patio",
          opening_tag: "D1",
          product_assignment_text: "PGT WinGuard SGD 72x80",
          glass_package_text: "Insulated laminated Low-E Argon",
          glass_makeup_type: "insulated_laminated",
          glass_low_e_present: true,
          glass_argon_present: true,
          glass_spec_complete: true,
        },
      ],
      warranty: {
        labor_years: 10,
        manufacturer_years: 25,
        transferable: true,
        details: "Full lifetime manufacturer warranty. 10-year labor coverage.",
      },
      permits: { included: true, responsible_party: "contractor", details: "Permits and inspection included." },
      installation: {
        scope_detail: "Full removal, install, caulk, foam, stucco patch, trim, cleanup.",
        disposal_included: true,
        accessories_mentioned: true,
      },
    },
  },

  // ── Vague Scope ────────────────────────────────────────────────────────────
  // Descriptions < 10 chars, no brand, no dp/noa, no impact mention.
  // unverified_impact_specs D-cap fires (no impact word + all specs missing).
  // No changes from original.
  {
    key: "vagueScope",
    label: "Vague Scope",
    description: "Descriptions <10 chars, no brand, no install detail — unverified_impact_specs D-cap",
    expectedGrade: "D",
    extraction: {
      document_type: "impact_window_quote",
      is_window_door_related: true,
      confidence: 0.68,
      page_count: 1,
      contractor_name: "Quick Fix LLC",
      total_quoted_price: 7500,
      line_items: [
        { description: "Window", quantity: 3, unit_price: 800, total_price: 2400 },
        { description: "Door", quantity: 1, unit_price: 2000, total_price: 2000 },
        { description: "Screen", quantity: 2, unit_price: 300, total_price: 600 },
      ],
    },
  },

  // ── Missing Warranty ───────────────────────────────────────────────────────
  // Decent specs but no warranty section at all → no_warranty_section C-cap.
  // NOA numbers and glass fields added to keep safety ≥ 40 (avoids D-cap).
  {
    key: "missingWarranty",
    label: "Missing Warranty",
    description: "Decent specs but no warranty section — no_warranty_section C-cap fires",
    expectedGrade: "C",
    extraction: {
      document_type: "impact_window_quote",
      is_window_door_related: true,
      confidence: 0.82,
      page_count: 2,
      contractor_name: "SunShield Windows",
      opening_count: 3,
      total_quoted_price: 11000,
      hvhz_zone: true,
      // No warranty property → no_warranty_section C-cap fires
      // ── Glass (Area 1) ────────────────────────────────────────────────────
      opening_level_glass_specs_present: true,
      blanket_glass_language_present: false,
      mixed_glass_package_visibility: false,
      // ── Opening scope (Area 2) ────────────────────────────────────────────
      opening_schedule_present: true,
      opening_schedule_room_labels_present: true,
      opening_schedule_dimensions_complete: true,
      opening_schedule_product_assignments_present: true,
      bulk_scope_blob_present: false,
      // ── Legal (Area 3) ────────────────────────────────────────────────────
      written_change_order_required: true,
      homeowner_approval_required_for_change_orders: true,
      unilateral_price_adjustment_allowed: false,
      substrate_condition_clause_present: false,
      subject_to_remeasure_present: false,
      final_payment_before_inspection: false,
      generic_product_description_present: false,
      // ── Install method (Area 4) — specified to avoid install_method_unverified C-cap
      anchoring_method_text: "Tapcon anchors per spec",
      anchor_spacing_specified: true,
      fastener_type_specified: true,
      waterproofing_method_text: "Sealant and flashing",
      sealant_specified: true,
      buck_treatment_method_text: "Buck prep and moisture barrier",
      manufacturer_install_compliance_stated: true,
      code_compliance_install_statement_present: true,
      line_items: [
        {
          description: "PGT WinGuard Impact Single Hung - hurricane",
          quantity: 2,
          unit_price: 1600,
          total_price: 3200,
          brand: "PGT",
          series: "WinGuard",
          dp_rating: "DP50",
          noa_number: "NOA 17-0501.06", // Added to keep safety ≥ 40
          dimensions: "36x60",
          opening_location: "Living Room",
          opening_tag: "W1",
          product_assignment_text: "PGT WinGuard SH 36x60",
          glass_package_text: "Insulated laminated Low-E Argon",
          glass_makeup_type: "insulated_laminated",
          glass_low_e_present: true,
          glass_argon_present: true,
          glass_spec_complete: true,
        },
        {
          description: "Impact Sliding Glass Door - storm rated",
          quantity: 1,
          unit_price: 3800,
          total_price: 3800,
          brand: "CGI",
          series: "Sentinel",
          dp_rating: "DP45",
          noa_number: "NOA 18-0312.02", // Added to keep safety ≥ 40
          dimensions: "72x80",
          opening_location: "Back Patio",
          opening_tag: "D1",
          product_assignment_text: "CGI Sentinel SGD 72x80",
          glass_package_text: "Insulated laminated Low-E Argon",
          glass_makeup_type: "insulated_laminated",
          glass_low_e_present: true,
          glass_argon_present: true,
          glass_spec_complete: true,
        },
      ],
      // warranty: intentionally omitted → no_warranty_section C-cap
      permits: { included: true, responsible_party: "contractor" },
      installation: {
        scope_detail: "Remove and replace specified openings. Caulking and cleanup.",
        disposal_included: true,
        accessories_mentioned: true,
      },
    },
  },

  // ── Fine Print Trap ────────────────────────────────────────────────────────
  // No cancellation policy, unbranded items, homeowner-responsible permits.
  // dp_rating + noa added to items to keep safety ≥ 40 (avoids D-cap).
  // C comes from weak finePrint + install score on weighted average.
  {
    key: "finePrintTrap",
    label: "Fine Print Trap",
    description: "No cancellation, unbranded items — finePrint pillar failures drive grade to C",
    expectedGrade: "C",
    extraction: {
      document_type: "impact_window_quote",
      is_window_door_related: true,
      confidence: 0.75,
      page_count: 1,
      contractor_name: "AllStar Construction",
      total_quoted_price: 9000,
      // No cancellation_policy — intentional (−25 finePrint)
      // ── Glass (Area 1) ────────────────────────────────────────────────────
      opening_level_glass_specs_present: true,
      blanket_glass_language_present: false,
      mixed_glass_package_visibility: false,
      // ── Legal (Area 3) ────────────────────────────────────────────────────
      written_change_order_required: true,
      homeowner_approval_required_for_change_orders: true,
      unilateral_price_adjustment_allowed: false,
      substrate_condition_clause_present: false,
      subject_to_remeasure_present: false,
      final_payment_before_inspection: false,
      generic_product_description_present: false,
      // ── Install method (Area 4) — specified to avoid install_method_unverified C-cap
      anchoring_method_text: "Standard anchors",
      waterproofing_method_text: "Caulk and foam",
      manufacturer_install_compliance_stated: true,
      code_compliance_install_statement_present: true,
      sealant_specified: true,
      // ── Warranty execution (Area 5) — minimal to avoid opaque_warranty_execution C-cap
      warranty_execution_details_present: true,
      warranty_service_provider_type: "contractor",
      leak_callback_sla_days: 14,
      callback_process_text: "Call office for warranty service",
      post_install_stucco_excluded: false,
      post_install_paint_excluded: false,
      water_intrusion_damage_excluded: false,
      line_items: [
        {
          description: "Impact rated window unit",
          quantity: 3,
          unit_price: 1200,
          total_price: 3600,
          // Intentional: no brand, no series — unbranded penalty (−10 finePrint per item)
          dp_rating: "DP50", // Added to prevent critical_safety D-cap
          noa_number: "NOA 17-0501.06", // Added to prevent critical_safety D-cap
          glass_package_text: "Laminated glass",
          glass_makeup_type: "laminated",
          glass_low_e_present: true,
          glass_argon_present: false,
          glass_spec_complete: true,
        },
        {
          description: "Impact rated slider",
          quantity: 1,
          unit_price: 2500,
          total_price: 2500,
          // Intentional: no brand, no series — unbranded penalty
          dp_rating: "DP50", // Added to prevent critical_safety D-cap
          noa_number: "NOA 17-0501.06", // Added to prevent critical_safety D-cap
          glass_package_text: "Laminated glass",
          glass_makeup_type: "laminated",
          glass_low_e_present: true,
          glass_argon_present: false,
          glass_spec_complete: true,
        },
      ],
      // Intentional weakness: short labor warranty (1yr → -10), no transferable
      warranty: { labor_years: 1, manufacturer_years: 10 },
      // Intentional: homeowner responsible for permits — adds risk signal
      permits: { included: true, responsible_party: "homeowner" },
      installation: {
        scope_detail: "Standard installation per manufacturer specs.",
        disposal_included: false, // Intentional gap
      },
    },
  },

  // ── Insurance Sensitive ────────────────────────────────────────────────────
  // No HVHZ, no NOA — insurance coverage risk. dp_rating added to items to keep
  // safety ≥ 40 (avoids D-cap). opening_count: 6 + no opening_schedule →
  // ambiguous_opening_scope C-cap fires as the primary cap.
  {
    key: "insuranceSensitive",
    label: "Insurance-Sensitive",
    description: "No HVHZ, no NOA numbers — ambiguous_opening_scope C-cap from 6 openings + no schedule",
    expectedGrade: "C",
    extraction: {
      document_type: "impact_window_quote",
      is_window_door_related: true,
      confidence: 0.8,
      page_count: 2,
      contractor_name: "Coastal Guard Windows",
      opening_count: 6, // ≥5 + no schedule → ambiguous_opening_scope C-cap
      total_quoted_price: 16000,
      // hvhz_zone intentionally not set — shows absence of HVHZ certification
      cancellation_policy: "50% deposit non-refundable.",
      // ── Glass (Area 1) ────────────────────────────────────────────────────
      opening_level_glass_specs_present: true,
      blanket_glass_language_present: false,
      mixed_glass_package_visibility: false,
      // ── Opening scope (Area 2) — intentionally absent → ambiguous_opening_scope C-cap
      // opening_schedule_present: not set
      bulk_scope_blob_present: false,
      // ── Legal (Area 3) ────────────────────────────────────────────────────
      written_change_order_required: true,
      homeowner_approval_required_for_change_orders: true,
      unilateral_price_adjustment_allowed: false,
      substrate_condition_clause_present: false,
      subject_to_remeasure_present: false,
      final_payment_before_inspection: false,
      generic_product_description_present: false,
      // ── Install method (Area 4) — specified to avoid install_method_unverified C-cap
      anchoring_method_text: "Anchors per manufacturer spec",
      waterproofing_method_text: "Silicone sealant",
      manufacturer_install_compliance_stated: true,
      code_compliance_install_statement_present: true,
      sealant_specified: true,
      // ── Warranty execution (Area 5) — minimal to avoid opaque_warranty_execution C-cap
      warranty_execution_details_present: true,
      warranty_service_provider_type: "contractor",
      leak_callback_sla_days: 14,
      callback_process_text: "Contact us for warranty service",
      post_install_stucco_excluded: false,
      post_install_paint_excluded: false,
      water_intrusion_damage_excluded: false,
      line_items: [
        {
          description: "Impact single hung window - hurricane protection",
          quantity: 4,
          unit_price: 1400,
          total_price: 5600,
          brand: "ECO",
          series: "StormMax",
          dp_rating: "DP40", // Added to prevent critical_safety D-cap
          // noa_number intentionally absent — insurance risk signal
          glass_package_text: "Laminated Low-E",
          glass_makeup_type: "laminated",
          glass_low_e_present: true,
          glass_argon_present: false,
          glass_spec_complete: true,
        },
        {
          description: "Impact sliding glass door - hurricane protection",
          quantity: 2,
          unit_price: 3200,
          total_price: 6400,
          brand: "ECO",
          series: "StormMax",
          dp_rating: "DP40", // Added to prevent critical_safety D-cap
          // noa_number intentionally absent — insurance risk signal
          glass_package_text: "Laminated Low-E",
          glass_makeup_type: "laminated",
          glass_low_e_present: true,
          glass_argon_present: false,
          glass_spec_complete: true,
        },
      ],
      warranty: {
        labor_years: 3,
        manufacturer_years: 15,
        transferable: false,
        details: "Limited manufacturer warranty.",
      },
      permits: { included: true, responsible_party: "contractor", details: "Permit fees included." },
      installation: {
        scope_detail: "Full removal and replacement. Caulk and seal. Disposal of old windows.",
        disposal_included: true,
        accessories_mentioned: true,
      },
    },
  },

  // ── Invalid Document ───────────────────────────────────────────────────────
  // Not a window/door quote → invalid_document terminal gate.
  {
    key: "invalidDocument",
    label: "Invalid Document",
    description: "Not a window/door quote — triggers invalid_document gate",
    expectedGrade: null,
    expectedTerminal: "invalid_document",
    extraction: {
      document_type: "general_contractor_estimate",
      is_window_door_related: false,
      confidence: 0.9,
      line_items: [
        {
          description: "Kitchen remodel - cabinets and countertops",
          quantity: 1,
          unit_price: 15000,
          total_price: 15000,
        },
      ],
    },
  },

  // ── Lipstick on a Pig ──────────────────────────────────────────────────────
  // Perfect-looking quote but FATAL FLAW: non-impact standard glass.
  // Description has NO "impact"/"hurricane"/"storm" word + all items missing
  // dp_rating + noa_number → unverified_impact_specs D-cap fires.
  // NOTE: "Non-Impact Glass" was renamed to "Standard Annealed Glass" to ensure
  // the word "impact" does NOT appear in the description (hasImpactMention = false).
  {
    key: "lipstickOnAPig_NonImpact",
    label: "Lipstick on a Pig",
    description: "Perfect quote but non-impact standard glass — unverified_impact_specs D-cap fires",
    expectedGrade: "D",
    extraction: {
      document_type: "impact_window_quote",
      is_window_door_related: true,
      confidence: 0.95,
      total_quoted_price: 24500,
      contractor_name: "Premium Illusions LLC",
      line_items: [
        {
          // FATAL FLAW: no "impact"/"hurricane"/"storm" + no dp/noa → D-cap
          description: "PGT WinGuard Single Hung - Standard Annealed Glass",
          quantity: 12,
          unit_price: 1800,
          total_price: 21600,
          brand: "PGT",
          series: "WinGuard",
          // dp_rating and noa_number intentionally absent — unverified spec
        },
      ],
      warranty: {
        labor_years: 10,
        manufacturer_years: 25,
        details: "Full lifetime manufacturer warranty.",
      },
      permits: { included: true, responsible_party: "contractor" },
      installation: { scope_detail: "Full removal and install", disposal_included: true },
    },
  },

  // ── Low Confidence ─────────────────────────────────────────────────────────
  // Confidence 0.2 → needs_better_upload terminal gate.
  {
    key: "lowConfidence",
    label: "Low Confidence",
    description: "Confidence 0.2 — triggers needs_better_upload gate",
    expectedGrade: null,
    expectedTerminal: "needs_better_upload",
    extraction: {
      document_type: "impact_window_quote",
      is_window_door_related: true,
      confidence: 0.2,
      line_items: [{ description: "Blurry text - possibly window", quantity: 1 }],
    },
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// Legacy mock quote creator (still used for storage upload testing)
// ══════════════════════════════════════════════════════════════════════════════

export function createMockQuote(overrides: Record<string, unknown> = {}) {
  const id = globalThis.crypto.randomUUID();

  const baseData = {
    contractor_name: `Test Contractor ${id.slice(0, 4)}`,
    price_per_window: Math.floor(Math.random() * 400) + 300,
    warranty_length: Math.random() > 0.5 ? "Lifetime" : "10 years",
    missing_specs: [] as string[],
    address: "123 Test Lane",
    city: "Pompano Beach",
    state: "FL",
    zip: "33062",
    ...overrides,
  };

  const fallbackBytes = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49,
    0x44, 0x41, 0x54, 0x78, 0x9c, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xe5, 0x27, 0xde, 0xfc, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
  const file = new File([fallbackBytes], `mock-quote-${id.slice(0, 8)}.png`, { type: "image/png" });

  return {
    id,
    file,
    extracted: baseData,
    getFile: async (): Promise<File> => {
      const blob = await getSampleQuoteBlob();
      return new File([blob], `sample-quote-${id.slice(0, 8)}.png`, { type: "image/png" });
    },
  };
}
