/**
 * Global currency & percentage formatting utilities.
 * All financial UI must use these to ensure locale consistency.
 */

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const currencyFormatterCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format a number as USD. Returns "—" for null/undefined/NaN. */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return currencyFormatter.format(value);
}

/** Format a number as USD with cents. Returns "—" for null/undefined/NaN. */
export function formatCurrencyCents(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return currencyFormatterCents.format(value);
}

/** Format a number as a percentage (e.g. 42 → "42%"). Returns "—" for null. */
export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${Math.round(value)}%`;
}
