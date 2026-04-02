/**
 * resolveEffectiveSeverity — Pure function that corrects backend severity
 * when a flag's text implies a missing or absent consumer protection.
 *
 * Algorithm:
 *   1. Build raw string from label + detail, lowercase.
 *   2. Replace punctuation with spaces (no regex).
 *   3. Normalize whitespace.
 *   4. Build tokens array.
 *   5. Apply red/amber override rules using token + phrase matching.
 *   6. Otherwise return the backend severity unchanged.
 *
 * Green is strictly reserved for a positively confirmed protection.
 */

import type { AnalysisFlag } from "@/hooks/useAnalysisData";

type EffectiveSeverity = "red" | "amber" | "green";

const PUNCTUATION = [
  ".", ",", ";", ":", "!", "?", "'", '"',
  "(", ")", "[", "]", "{", "}", "/", "\\",
  "-", "_", "&", "#", "@", "+", "=", "|",
  "<", ">", "~", "`", "^", "%", "$",
];

const NEGATIVE_TRIGGERS = [
  "missing",
  "not found",
  "not included",
  "not specified",
  "not provided",
  "not mentioned",
  "not listed",
  "not stated",
  "not addressed",
  "not covered",
  "not present",
  "no mention",
  "no evidence",
  "no record",
  "no reference",
  "no documentation",
  "none found",
  "none listed",
  "none provided",
  "absent",
  "omitted",
  "unclear",
  "unspecified",
  "undisclosed",
  "excluded",
  "lacks",
  "lacking",
];

function normalize(raw: string): { normalized: string; tokens: string[] } {
  let cleaned = raw.toLowerCase();
  for (const ch of PUNCTUATION) {
    cleaned = cleaned.replaceAll(ch, " ");
  }
  // collapse whitespace
  const parts = cleaned.split(" ").filter((t) => t.length > 0);
  return {
    normalized: parts.join(" "),
    tokens: parts,
  };
}

export function resolveEffectiveSeverity(flag: AnalysisFlag): EffectiveSeverity {
  const raw = `${flag.label} ${flag.detail}`;
  const { normalized, tokens } = normalize(raw);

  const hasToken = (token: string): boolean => tokens.includes(token);
  const hasPhrase = (phrase: string): boolean => normalized.includes(phrase);

  // Check if any negative trigger is present
  const hasNegativeTrigger = NEGATIVE_TRIGGERS.some((trigger) => {
    // Single-word triggers use token matching; multi-word use phrase matching
    return trigger.includes(" ") ? hasPhrase(trigger) : hasToken(trigger);
  });

  if (!hasNegativeTrigger) {
    return flag.severity;
  }

  // ── Red overrides: critical consumer protections ──
  // In Florida impact window domain, missing permits, unspecified products,
  // missing deposit terms, and unclear timelines are all critical — not just
  // "important". A missing protection is always a red flag.
  const redTopics = [
    () => hasToken("cancellation"),
    () => hasToken("license") || hasToken("licensing") || hasToken("licensed"),
    () => hasToken("warranty") || hasPhrase("labor warranty") || hasPhrase("manufacturer warranty"),
    () => hasToken("insurance") || hasPhrase("proof of insurance"),
    () => hasToken("permit") || hasToken("permits") || hasToken("permitting"),
    () => hasToken("timeline") || hasPhrase("start date") || hasPhrase("completion date"),
    () => hasToken("deposit") || hasPhrase("payment schedule"),
    () => hasToken("scope") || hasToken("brand") || hasToken("noa") || hasPhrase("dp rating"),
    () => hasToken("payment") || hasPhrase("payment terms"),
  ];

  for (const check of redTopics) {
    if (check()) return "red";
  }

  // ── Catch-all: any negative trigger escalates to red ──
  // A missing consumer protection with no specific topic match is still
  // critical. Green is strictly reserved for positive confirmations.
  return "red";
}
