/**
 * trackConversion.ts — Canonical Business Event Emitter (dataLayer)
 *
 * This is the ONLY lane for business / conversion events on the canonical
 * scanner → OTP → report reveal path. Every business event pushed here
 * lands in `window.dataLayer` for GTM to consume.
 *
 * OWNERSHIP:
 *   This file owns event emission format and dataLayer push mechanics.
 *   Individual call-site owners decide WHEN to fire each event.
 *
 * SEPARATION FROM trackEvent.ts:
 *   trackEvent.ts is operational telemetry (event_logs table).
 *   trackConversion.ts is business / conversion signaling (dataLayer).
 *   They serve different consumers and must not be conflated.
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
 * GTM SETUP:
 *   GTM triggers match `event` names above, then route to GA4, Meta CAPI,
 *   Google Ads, etc. The codebase never calls vendor SDKs directly.
 *
 * DEFERRED (not yet implemented — future GTM/CAPI rollout):
 *   - event_id generation for cross-platform dedup
 *   - lead_id / UTM enrichment in payload
 *   - CAPI server-side relay
 *   These will be added when trackBusinessEvent.ts is promoted to replace
 *   this file, or when this file is upgraded to use its payload contract.
 */

export function trackGtmEvent(
  eventName: string,
  payload: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  // Spread payload first so callers cannot accidentally override `event` or `wm_timestamp`
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
