/**
 * Phone formatting utilities for US numbers.
 * Display format: (XXX) XXX-XXXX
 * Storage/webhook format: E.164 (+1XXXXXXXXXX)
 */

/** Strip all non-digit characters */
export const stripNonDigits = (value: string): string => value.replace(/\D/g, "");

/** Format raw digits into (XXX) XXX-XXXX display format. Caps at 10 digits. */
export const formatPhoneDisplay = (raw: string): string => {
  const digits = stripNonDigits(raw).slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

/** Convert any phone string to E.164 format (+1XXXXXXXXXX). Returns null if not 10 digits. */
export const toE164 = (value: string): string | null => {
  const digits = stripNonDigits(value);
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  return null;
};

/** Check if a phone string has exactly 10 digits (valid US number length) */
export const isValidUSPhone = (value: string): boolean => {
  const digits = stripNonDigits(value);
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
};

/** Mask an E.164 phone for display: +15551234567 → (•••) •••-4567 */
export const maskPhone = (e164: string): string => {
  const digits = stripNonDigits(e164);
  const last4 = digits.slice(-4);
  return `(•••) •••-${last4}`;
};

/** Basic email validation */
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

/** Basic name validation — at least 2 chars, no script tags */
export const isValidName = (name: string): boolean => {
  const cleaned = name.trim();
  return cleaned.length >= 2 && cleaned.length <= 100 && !/<[^>]*>/g.test(cleaned);
};
