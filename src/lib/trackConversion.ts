/**
 * trackConversion — Universal GTM dataLayer push utility.
 *
 * USAGE:
 *   import { trackConversion } from "@/lib/trackConversion";
 *   trackConversion("quote_uploaded", { county: "Miami-Dade", file_type: "pdf" });
 *
 * GTM SETUP:
 *   Your GTM expert creates triggers matching `event` names below,
 *   then maps them to GA4, Meta CAPI, Google Ads, etc. as needed.
 *   The codebase never references platform-specific SDKs.
 *
 * REGISTERED EVENTS (reference for GTM configuration):
 *   - homepage_variant_viewed  → A/B test variant assignment
 *   - quote_uploaded           → User successfully uploaded a quote file
 *   - otp_verified             → User completed SMS phone verification
 *   - report_revealed          → Full Truth Report unlocked post-OTP
 *   - voice_call_answered      → AI voice call connected with lead
 *   - appointment_booked       → Lead status changed to "appointment"
 *   - contractor_match_requested → User clicked "Get a Counter-Quote"
 */

export function trackConversion(
  eventName: string,
  payload: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...payload,
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
