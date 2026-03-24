/**
 * normalizePhone — Shared US-only E.164 phone normalizer for WindowMan edge functions.
 *
 * This normalizer is intentionally US-only for the current WindowMan market
 * and only accepts numbers that can canonicalize to +1XXXXXXXXXX.
 *
 * It sanitizes all input — even already-valid E.164 — by reconstructing from
 * extracted digits to produce a clean canonical value.
 *
 * Handles:
 *   "+15614685571"           -> "+15614685571"
 *   " +15614685571 "         -> "+15614685571"
 *   "%2B15614685571"         -> "+15614685571"
 *   "(561) 468-5571"         -> "+15614685571"
 *   "561-468-5571"           -> "+15614685571"
 *   "5614685571"             -> "+15614685571"
 *   "15614685571"            -> "+15614685571"
 *   "561.468.5571"           -> "+15614685571"
 *   ""                       -> ""
 *   "abc"                    -> ""
 *   "+44..."                 -> ""
 */
export function normalizePhone(raw: unknown): string {
  if (typeof raw !== "string") return "";

  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    // If decodeURIComponent fails (malformed %), keep the raw value
    value = raw;
  }

  value = value.trim();
  if (!value) return "";

  // Strip all non-digit characters to get pure digits
  const digits = value.replace(/\D/g, "");

  // US 10-digit local number → +1XXXXXXXXXX
  if (/^\d{10}$/.test(digits)) {
    return `+1${digits}`;
  }

  // US 11-digit number starting with 1 → +1XXXXXXXXXX
  if (/^1\d{10}$/.test(digits)) {
    return `+${digits}`;
  }

  // Anything else is invalid (non-US, too short, too long)
  return "";
}
