/**
 * trackGtmEvent — Universal GTM dataLayer push utility.
 *
 * USAGE:
 *   import { trackGtmEvent } from "@/lib/trackConversion";
 *   trackGtmEvent("quote_uploaded", { county: "Miami-Dade", file_type: "pdf" });
 *
 * GTM SETUP:
 *   Your GTM expert creates triggers matching `event` names below,
 *   then maps them to GA4, Meta CAPI, Google Ads, etc. as needed.
 *   The codebase never references platform-specific SDKs.
 *
 * REGISTERED EVENTS (reference for GTM configuration):
 *   - homepage_variant_viewed     → A/B test variant assignment
 *   - quote_uploaded              → User successfully uploaded a quote file
 *   - otp_verified                → User completed SMS phone verification
 *   - report_revealed             → Full Truth Report unlocked post-OTP
 *   - voice_call_triggered        → AI voice call manually triggered from admin
 *   - appointment_booked          → Lead status changed to "appointment"
 *   - contractor_match_requested  → User clicked "Get a Counter-Quote"
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
