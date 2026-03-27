/**
 * evidenceMapping — Maps flag labels to forensic evidence exhibits.
 *
 * Each exhibit contains:
 *  - yourQuoteText: what was extracted (or "Not found in document")
 *  - benchmark: the code/market standard
 *  - interpretation: one-line forensic consequence
 *  - hasHardEvidence: gate for rendering the exhibit UI
 */

import type { AnalysisFlag } from "@/hooks/useAnalysisData";

export type EvidenceExhibit = {
  yourQuoteText: string;
  benchmark: string;
  interpretation: string;
  hasHardEvidence: boolean;
};

// ── BENCHMARK_MAP — approved entries ─────────────────────────────────────────
type BenchmarkEntry = {
  benchmark: string;
  interpretation: string;
  absenceText: string;
};

const BENCHMARK_MAP: Record<string, BenchmarkEntry> = {
  missing_dp_rating: {
    benchmark: "Florida Building Code §1626.2 requires wind load ratings (DP) for all fenestration products in HVHZ.",
    interpretation: "Without DP ratings, wind resistance cannot be confirmed for your county's requirements.",
    absenceText: "No DP ratings found in document",
  },
  missing_noa_number: {
    benchmark: "Miami-Dade HVHZ compliance requires a valid NOA (Notice of Acceptance) for every impact product installed.",
    interpretation: "Without NOA numbers, code compliance cannot be verified from this quote.",
    absenceText: "No product approval codes found in document",
  },
  no_permits_mentioned: {
    benchmark: "FL Statute §489.129 — installing impact fenestration without a building permit is a first-degree misdemeanor.",
    interpretation: "Unpermitted work may void your insurance and code compliance certificates.",
    absenceText: "No permit language found in document",
  },
  vague_install_scope: {
    benchmark: "Industry standard scope includes: old unit removal, waterproofing, flashing, trim, sealant, and debris disposal.",
    interpretation: "Vague scope creates disputes over what is and isn't included after signing.",
    absenceText: "Installation scope details missing or too vague",
  },
  missing_line_item_pricing: {
    benchmark: "Transparent pricing requires per-unit or per-opening cost breakdowns to enable comparison shopping.",
    interpretation: "Lump-sum pricing prevents per-unit cost verification against market rates.",
    absenceText: "No per-unit pricing breakdown found",
  },
  no_cancellation_policy: {
    benchmark: "FL Home Solicitation Sale Act (§501.021) grants a 3-day cancellation right on home-solicited contracts.",
    interpretation: "Missing cancellation terms may limit your legal protections if you need to exit the contract.",
    absenceText: "No cancellation policy found in document",
  },
  unspecified_brand: {
    benchmark: "Quotes should specify manufacturer, product series, and model number to prevent product substitution.",
    interpretation: "Unspecified products allow the contractor to substitute lower-grade materials without notice.",
    absenceText: "No specific brand or product series identified",
  },
  no_warranty_section: {
    benchmark: "Industry standard: 10-year manufacturer warranty on product, 2–5 year labor warranty from installer.",
    interpretation: "No written warranty leaves you exposed to full replacement cost if products fail.",
    absenceText: "No warranty terms found in document",
  },
};

// ── Label → key mapping via keyword matching ─────────────────────────────────
const LABEL_KEYWORDS: [string, string][] = [
  ["dp rating", "missing_dp_rating"],
  ["noa", "missing_noa_number"],
  ["permit", "no_permits_mentioned"],
  ["scope", "vague_install_scope"],
  ["lump", "missing_line_item_pricing"],
  ["line item", "missing_line_item_pricing"],
  ["cancellation", "no_cancellation_policy"],
  ["brand", "unspecified_brand"],
  ["warranty", "no_warranty_section"],
];

function resolveKey(label: string): string | null {
  const lower = label.toLowerCase();
  for (const [keyword, key] of LABEL_KEYWORDS) {
    if (lower.includes(keyword)) return key;
  }
  return null;
}

// ── Dollar/percentage extraction from detail ─────────────────────────────────
function extractQuoteEvidence(detail: string): string | null {
  // Look for dollar amounts with context
  const dollarMatch = detail.match(/\$[\d,]+\s*(?:above|over|more|higher)/i);
  if (dollarMatch) return dollarMatch[0];

  // Look for percentage with context
  const pctMatch = detail.match(/(\d+)%\s*(?:above|over|higher|more)/i);
  if (pctMatch) return `${pctMatch[1]}% above benchmark`;

  // Count-based evidence (e.g., "3 of 5 line items")
  const countMatch = detail.match(/(\d+)\s*(?:of|out of)\s*(\d+)/i);
  if (countMatch) return `${countMatch[1]} of ${countMatch[2]} items affected`;

  return null;
}

/**
 * Maps a flag to an evidence exhibit for the CriticalFlagCard.
 * Returns null if the flag has no matching benchmark (generic flags).
 */
export function mapFlagToExhibit(flag: AnalysisFlag): EvidenceExhibit | null {
  const key = resolveKey(flag.label);
  if (!key) return null;

  const entry = BENCHMARK_MAP[key];
  if (!entry) return null;

  // Determine yourQuoteText
  const extracted = extractQuoteEvidence(flag.detail);
  const isAbsence = flag.detail.toLowerCase().includes("not found") ||
    flag.detail.toLowerCase().includes("missing") ||
    flag.detail.toLowerCase().includes("no ") ||
    flag.detail.toLowerCase().includes("zero") ||
    flag.detail.toLowerCase().includes("absent");

  let yourQuoteText: string;
  let hasHardEvidence: boolean;

  if (extracted) {
    yourQuoteText = extracted;
    hasHardEvidence = true;
  } else if (isAbsence) {
    yourQuoteText = entry.absenceText;
    hasHardEvidence = true; // Confirmed absence IS evidence
  } else {
    yourQuoteText = flag.detail;
    hasHardEvidence = false;
  }

  return {
    yourQuoteText,
    benchmark: entry.benchmark,
    interpretation: entry.interpretation,
    hasHardEvidence,
  };
}
