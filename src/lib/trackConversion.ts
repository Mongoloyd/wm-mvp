/**
 * trackConversion.ts — Canonical Business Event Emitter (dataLayer)
 *
 * This is the ONLY lane for business / conversion events on the canonical
 * scanner → OTP → report reveal path. Every business event pushed here
 * lands in `window.dataLayer` for GTM to consume.
 *
 * OWNERSHIP:
 *   This file owns event emission format and dataLayer push mechanics.
 *   Individual call-site owners decide WHEN to fire each event AND own the
 *   `event_id` they pass in (so it can mirror the server-side canonical id
 *   for cross-lane deduplication).
 *
 * SEPARATION FROM trackEvent.ts:
 *   trackEvent.ts is operational telemetry (event_logs table).
 *   trackConversion.ts is business / conversion signaling (dataLayer).
 *
 * VENDOR-AGNOSTIC RULE:
 *   This file MUST NOT call vendor SDKs directly (no `fbq()`, no direct
 *   POSTs to `capi-event` from the browser). Routing to Meta Pixel / GA4 /
 *   Google Ads is owned by GTM, which consumes the dataLayer push.
 *
 * CANONICAL BUSINESS EVENTS on the scanner/OTP/report path:
 *   ┌──────────────────────────────┬────────────────────────────────────────────┐
 *   │ Event Name                   │ Canonical Owner                            │
 *   ├──────────────────────────────┼────────────────────────────────────────────┤
 *   │ quote_uploaded               │ UploadZone.tsx (after successful upload)   │
 *   │ phone_verified               │ PostScanReportSwitcher (on OTP success)    │
 *   │ report_revealed              │ PostScanReportSwitcher (on full data load) │
 *   │ contractor_match_requested   │ TruthReportClassic (on CTA click)         │
 *   └──────────────────────────────┴────────────────────────────────────────────┘
 *
 * EVENT_ID PARITY:
 *   Each call-site owner generates the `event_id` via
 *   `buildCanonicalEventId({...})` from `@/lib/tracking/canonicalEventId`,
 *   which mirrors the server's `defaultCreateId` algorithm. The same id
 *   is passed to the corresponding edge function so server-side canonical
 *   persistence + platform dispatch share that id.
 */

export interface TrackGtmEventOptions {
  /**
   * Cross-lane dedup id. Should be generated via `buildCanonicalEventId` so
   * the browser fire and the server canonical event share the same id.
   * Optional only because non-conversion utility events may omit it.
   */
  event_id?: string;
  /** Optimization value (USD). Required for valued conversion events. */
  value?: number;
  /** ISO 4217 currency code. Defaults are not assumed — pass explicitly. */
  currency?: string;
}

export function trackGtmEvent(
  eventName: string,
  payload: (Record<string, unknown> & TrackGtmEventOptions) = {}
): void {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  // Spread payload first so callers cannot accidentally override `event` or `wm_timestamp`.
  // event_id / value / currency live as top-level fields so GTM can map them
  // 1:1 to vendor params (Meta eventID, GA4 transaction_id, value, currency).
  window.dataLayer.push({
    ...payload,
    event: eventName,
    wm_timestamp: new Date().toISOString(),
  });

  if (import.meta.env.DEV) {
    console.log(
      `%c[dataLayer] ${eventName}`,
      "color: #2563EB; font-weight: bold;",
      payload
    );
  }
}
