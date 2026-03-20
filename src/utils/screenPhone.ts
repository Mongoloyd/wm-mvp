/**
 * screenPhone — Client-side junk/fake phone screening.
 *
 * Rejects clearly invalid US numbers before they hit the backend.
 * This is NOT a replacement for server-side validation — it's a
 * fast pre-filter to keep garbage out of the CRM.
 */

import { stripNonDigits, toE164 } from "@/utils/formatPhone";

export type ScreenResult =
  | { ok: true; e164: string }
  | { ok: false; reason: string };

/** Well-known test / junk numbers */
const BLOCKED_NUMBERS = new Set([
  "+15551234567",
  "+10000000000",
  "+11111111111",
  "+11234567890",
  "+11234567891",
  "+19999999999",
]);

/** Detect sequential digits like 1234567890 or 0987654321 */
function isSequential(digits: string): boolean {
  const ascending = "0123456789";
  const descending = "9876543210";
  return ascending.includes(digits) || descending.includes(digits);
}

/** Detect repeated digits like 5555555555 */
function isRepeated(digits: string): boolean {
  return digits.length >= 10 && new Set(digits).size === 1;
}

/** Detect toll-free prefixes (800, 888, 877, 866, 855, 844, 833) */
function isTollFree(digits10: string): boolean {
  const prefix = digits10.slice(0, 3);
  return ["800", "888", "877", "866", "855", "844", "833"].includes(prefix);
}

/** Detect 555 test exchange (X55-01XX are reserved, but we block all 555) */
function is555(digits10: string): boolean {
  return digits10.slice(3, 6) === "555";
}

/**
 * Screen a phone number for obvious junk/fake patterns.
 *
 * @param raw — Any string the user typed (formatted or raw)
 * @returns ScreenResult with either { ok, e164 } or { ok, reason }
 */
export function screenPhone(raw: string): ScreenResult {
  const digits = stripNonDigits(raw);

  // Strip leading country code "1" if 11 digits
  const digits10 =
    digits.length === 11 && digits.startsWith("1")
      ? digits.slice(1)
      : digits;

  // Must be exactly 10 digits for US
  if (digits10.length !== 10) {
    return { ok: false, reason: "Enter a valid 10-digit US phone number." };
  }

  // Area code cannot start with 0 or 1
  if (digits10[0] === "0" || digits10[0] === "1") {
    return { ok: false, reason: "That area code isn't valid." };
  }

  // Exchange (digits 4-6) cannot start with 0 or 1
  if (digits10[3] === "0" || digits10[3] === "1") {
    return { ok: false, reason: "That phone number isn't valid." };
  }

  const e164 = toE164(digits10);
  if (!e164) {
    return { ok: false, reason: "Enter a valid 10-digit US phone number." };
  }

  // Blocked list
  if (BLOCKED_NUMBERS.has(e164)) {
    return { ok: false, reason: "Please enter your real phone number." };
  }

  // Pattern checks on the 10-digit form
  if (isSequential(digits10)) {
    return { ok: false, reason: "Please enter your real phone number." };
  }

  if (isRepeated(digits10)) {
    return { ok: false, reason: "Please enter your real phone number." };
  }

  if (is555(digits10)) {
    return { ok: false, reason: "Please enter a real phone number, not a test number." };
  }

  if (isTollFree(digits10)) {
    return { ok: false, reason: "Please enter a personal phone number, not a toll-free number." };
  }

  return { ok: true, e164 };
}
