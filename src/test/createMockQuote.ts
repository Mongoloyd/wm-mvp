import sampleQuoteUrl from "./sample-quote.png";

let cachedBlob: Blob | null = null;

async function getSampleQuoteBlob(): Promise<Blob> {
  if (cachedBlob) return cachedBlob;
  const res = await fetch(sampleQuoteUrl);
  cachedBlob = await res.blob();
  return cachedBlob;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ExtractionResult — matches the edge function's ExtractionResult interface
// ═══════════════════════════════════════════════════════════════════════════════

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
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO FIXTURES — 14 deterministic extraction payloads
// ═══════════════════════════════════════════════════════════════════════════════

export interface ScenarioFixture {
  key: string;
  label: string;
  description: string;
  extraction: ExtractionResult;
  expectedGrade: string | null; // null = terminal state (invalid_document, needs_better_upload)
  expectedTerminal?: "invalid_document" | "needs_better_upload";
}

export const SCENARIO_FIXTURES: ScenarioFixture[] = [
  {
    key: "gradeA",
    label: "Grade A",
    description: "Complete quote: all specs, warranty, permits, install scope",
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
  {
    key: "gradeB",
    label: "Grade B",
    description: "Good quote, missing NOA numbers, no cancellation policy, no disposal",
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
      line_items: [
        {
          description: "PGT WinGuard Impact Single Hung Window",
          quantity: 2,
          unit_price: 1700,
          total_price: 3400,
          brand: "PGT",
          series: "WinGuard",
          dp_rating: "DP50",
          dimensions: "36x60",
        },
        {
          description: "Impact Sliding Glass Door - hurricane rated",
          quantity: 1,
          unit_price: 4200,
          total_price: 4200,
          brand: "CGI",
          series: "Sentinel",
          dp_rating: "DP50",
          dimensions: "72x80",
        },
      ],
      warranty: { labor_years: 2, manufacturer_years: 20, transferable: true },
      permits: { included: true, responsible_party: "contractor" },
      installation: { scope_detail: "Remove and replace all specified openings. Caulk and seal." },
    },
  },
  {
    key: "gradeC",
    label: "Grade C",
    description: "Multiple missing DP ratings, vague install scope, no disposal",
    expectedGrade: "C",
    extraction: {
      document_type: "impact_window_quote",
      is_window_door_related: true,
      confidence: 0.78,
      page_count: 1,
      contractor_name: "Budget Windows FL",
      opening_count: 5,
      total_quoted_price: 8500,
      line_items: [
        {
          description: "Impact single hung window",
          quantity: 3,
          unit_price: 950,
          total_price: 2850,
          brand: "PGT",
          dimensions: "36x48",
        },
        {
          description: "Impact horizontal roller",
          quantity: 2,
          unit_price: 1100,
          total_price: 2200,
          dimensions: "60x36",
        },
      ],
      warranty: { manufacturer_years: 10, details: "See manufacturer documentation." },
      installation: { scope_detail: "Install windows" },
    },
  },
  {
    key: "gradeD",
    label: "Grade D",
    description: "No NOA, no DP, no permits, short descriptions, sparse warranty",
    expectedGrade: "D",
    extraction: {
      document_type: "impact_window_quote",
      is_window_door_related: true,
      confidence: 0.72,
      page_count: 1,
      contractor_name: "J&R Windows",
      total_quoted_price: 6000,
      line_items: [
        { description: "Window", quantity: 4, unit_price: 750, total_price: 3000 },
        { description: "Slider", quantity: 1, unit_price: 1500, total_price: 1500 },
      ],
      warranty: { details: "1 year labor" },
    },
  },
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
  {
    key: "mixedPillars",
    label: "Mixed Pillars",
    description: "A-grade safety (all DP/NOA) but weak warranty and sparse install",
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
        },
      ],
      warranty: { details: "Contact manufacturer for warranty terms." },
      installation: { scope_detail: "Replace openings" },
    },
  },
  {
    key: "cornerCutting",
    label: "Corner-Cutting",
    description: "$150/unit, no brand/series, no DP — suspiciously cheap",
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
  {
    key: "overpaymentTrap",
    label: "Overpayment Trap",
    description: "Premium pricing, missing NOA on one item, no cancellation policy",
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
        },
        {
          description: "PGT WinGuard Impact Sliding Door - Hurricane rated",
          quantity: 1,
          unit_price: 5200,
          total_price: 5200,
          brand: "PGT",
          series: "WinGuard",
          dp_rating: "DP50",
          dimensions: "72x80",
        },
      ],
      warranty: {
        labor_years: 10,
        manufacturer_years: 25,
        details: "Full lifetime manufacturer warranty. 10-year labor.",
      },
      permits: { included: true, responsible_party: "contractor", details: "Permits and inspection included." },
      installation: {
        scope_detail: "Full removal, install, caulk, foam, stucco patch, trim, cleanup.",
        disposal_included: true,
      },
    },
  },
  {
    key: "vagueScope",
    label: "Vague Scope",
    description: "Descriptions <10 chars, no brand, no install detail",
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
  {
    key: "missingWarranty",
    label: "Missing Warranty",
    description: "Decent specs but no warranty section at all",
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
      line_items: [
        {
          description: "PGT WinGuard Impact Single Hung - hurricane",
          quantity: 2,
          unit_price: 1600,
          total_price: 3200,
          brand: "PGT",
          series: "WinGuard",
          dp_rating: "DP50",
          dimensions: "36x60",
        },
        {
          description: "Impact Sliding Glass Door - storm rated",
          quantity: 1,
          unit_price: 3800,
          total_price: 3800,
          brand: "CGI",
          dp_rating: "DP45",
          dimensions: "72x80",
        },
      ],
      permits: { included: true, responsible_party: "contractor" },
      installation: {
        scope_detail: "Remove and replace specified openings. Caulking and cleanup.",
        disposal_included: true,
      },
    },
  },
  {
    key: "finePrintTrap",
    label: "Fine Print Trap",
    description: "No cancellation, unbranded items, vague descriptions",
    expectedGrade: "C",
    extraction: {
      document_type: "impact_window_quote",
      is_window_door_related: true,
      confidence: 0.75,
      page_count: 1,
      contractor_name: "AllStar Construction",
      total_quoted_price: 9000,
      line_items: [
        { description: "Impact rated window unit", quantity: 3, unit_price: 1200, total_price: 3600 },
        { description: "Impact rated slider", quantity: 1, unit_price: 2500, total_price: 2500 },
      ],
      warranty: { labor_years: 1, manufacturer_years: 10 },
      permits: { included: true, responsible_party: "homeowner" },
      installation: { scope_detail: "Standard installation per manufacturer specs.", disposal_included: false },
    },
  },
  {
    key: "insuranceSensitive",
    label: "Insurance-Sensitive",
    description: "No HVHZ, no DP, but has pricing and warranty",
    expectedGrade: "C",
    extraction: {
      document_type: "impact_window_quote",
      is_window_door_related: true,
      confidence: 0.8,
      page_count: 2,
      contractor_name: "Coastal Guard Windows",
      opening_count: 6,
      total_quoted_price: 16000,
      line_items: [
        {
          description: "Impact single hung window - hurricane protection",
          quantity: 4,
          unit_price: 1400,
          total_price: 5600,
          brand: "ECO",
          series: "StormMax",
        },
        {
          description: "Impact sliding glass door - hurricane protection",
          quantity: 2,
          unit_price: 3200,
          total_price: 6400,
          brand: "ECO",
          series: "StormMax",
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
      cancellation_policy: "50% deposit non-refundable.",
    },
  },
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
  {
    key: "lipstickOnAPig_NonImpact",
    label: "Lipstick on a Pig",
    description: "Perfect quote but uses non-impact glass — should hard cap at D",
    expectedGrade: "D",
    extraction: {
      document_type: "impact_window_quote",
      metadata: {
        contractor_name: "Premium Illusions LLC",
        total_price: 24500,
      },
      windows: [
        {
          quantity: 12,
          window_type: "Single Hung",
          glass_type: "Non-Impact", // <-- THE FATAL FLAW
          brand: "PGT", // Premium brand (Plus points)
          dp_rating: 65, // Excellent safety rating (Plus points)
          noa_number: "22-0414.01", // Fully documented (Plus points)
        },
      ],
      flags: {
        has_warranty_details: true, // Perfect warranty
        includes_permit_fees: true, // Perfect transparency
        includes_debris_removal: true, // Perfect transparency
      },
    },
  },
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

// ═══════════════════════════════════════════════════════════════════════════════
// Legacy mock quote creator (still used for storage upload testing)
// ═══════════════════════════════════════════════════════════════════════════════

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
