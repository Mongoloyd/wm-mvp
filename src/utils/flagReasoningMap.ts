/**
 * flagReasoningMap — Expert explanations for each red flag type.
 * Keyword-matched lookup, same pattern as evidenceMapping.ts.
 */

const REASONING_MAP: Record<string, string> = {
  missing_dp_rating:
    "The Design Pressure (DP) rating determines the wind load a window can withstand; without it, there is no proof the product meets your specific Florida wind zone requirements.",
  missing_noa_number:
    "The Notice of Acceptance (NOA) is the 'legal birth certificate' of a Florida impact product; missing this means the building department cannot verify the product's legality.",
  no_permits_mentioned:
    "Permits are your primary legal protection; if unmentioned, you are legally liable for fines or unpermitted work discovered during a future home sale.",
  vague_install_scope:
    "Vague scope language creates disputes over what is and isn't included after signing, often leading to surprise charges for basic work like trim, flashing, or debris removal.",
  missing_line_item_pricing:
    "Lump-sum pricing prevents per-unit cost verification against market rates, making it impossible to know if individual items are fairly priced.",
  no_cancellation_policy:
    "Florida's Home Solicitation Sale Act (§501.021) grants a 3-day cancellation right; missing cancellation terms may limit your legal protections if you need to exit the contract.",
  unspecified_brand:
    "Unspecified products allow the contractor to substitute lower-grade materials without notice; quotes should specify manufacturer, product series, and model number.",
  no_warranty_section:
    "No written warranty leaves you exposed to full replacement cost if products fail; industry standard is a 10-year manufacturer warranty and 2–5 year labor warranty.",
  state_jurisdiction_mismatch:
    "Referencing out-of-state standards suggests the product may bypass Florida's HVHZ requirements, risking an illegal or sub-standard installation.",
  glass_package_unverifiable:
    "Vague glass details allow contractors to swap high-performance materials for cheaper, less efficient alternatives without your knowledge.",
  wall_repair_missing:
    "Window replacement often causes wall damage; if excluded from the scope, you'll face additional masonry or painting costs after the crew leaves.",
  completion_timeline_missing:
    "Without a 'Start' and 'Finish' date, you have no legal leverage to stop delays or prevent your home from being a permanent construction zone.",
  opening_schedule_missing:
    "A missing schedule of sizes allows for 'unexpected size' claims later, leading to expensive and unnecessary change orders.",
  waterproofing_missing:
    "Water intrusion is the leading cause of mold; without specified flashing or caulking methods, there is no guarantee of industry-standard leak prevention.",
  change_order_language:
    "Open-ended change order clauses give the contractor a blank check to increase costs unilaterally after the contract is signed.",
  payment_schedule_missing:
    "Without a defined payment schedule, you lose leverage to withhold final payment for incomplete or defective work.",
  debris_removal_missing:
    "If debris removal isn't specified, you may be left with old windows, packaging, and construction waste on your property at your expense.",
  anchor_method_missing:
    "Without specified anchoring methods (tapcons, structural screws, etc.), there is no guarantee the windows will be properly secured to the wall structure.",
};

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
  ["jurisdiction", "state_jurisdiction_mismatch"],
  ["glass", "glass_package_unverifiable"],
  ["wall repair", "wall_repair_missing"],
  ["timeline", "completion_timeline_missing"],
  ["completion", "completion_timeline_missing"],
  ["opening schedule", "opening_schedule_missing"],
  ["schedule of sizes", "opening_schedule_missing"],
  ["waterproof", "waterproofing_missing"],
  ["flashing", "waterproofing_missing"],
  ["change order", "change_order_language"],
  ["payment", "payment_schedule_missing"],
  ["debris", "debris_removal_missing"],
  ["anchor", "anchor_method_missing"],
];

/** Returns expert reasoning for a flag label, or null if no match. */
export function getFlagReasoning(label: string): string | null {
  const lower = label.toLowerCase();
  for (const [keyword, key] of LABEL_KEYWORDS) {
    if (lower.includes(keyword)) return REASONING_MAP[key] ?? null;
  }
  return null;
}
