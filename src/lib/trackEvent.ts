/**
 * trackEvent — Operational Telemetry Writer (event_logs table)
 *
 * Fires-and-forgets an INSERT into the `event_logs` table for internal
 * diagnostics, funnel instrumentation, and support visibility.
 *
 * SEPARATION FROM trackConversion.ts:
 *   trackConversion.ts (trackGtmEvent) is the canonical business-event lane.
 *   It pushes to window.dataLayer for GTM → GA4 / Meta / Google Ads.
 *
 *   THIS FILE is operational telemetry only. It writes to the Supabase
 *   event_logs table for internal dashboards, debugging, and support.
 *   It must NOT be treated as the source of truth for conversion metrics.
 *
 * NAMING:
 *   Telemetry event names intentionally differ from business event names
 *   to prevent confusion. Example:
 *     Business: "phone_verified" (dataLayer)
 *     Telemetry: "otp_verify_success" (event_logs)
 */

import { supabase } from "@/integrations/supabase/client";

interface TrackEventOptions {
  /** Required event name (snake_case) */
  event_name: string;
  /** scan_session_id or session_id — whichever is relevant */
  session_id?: string | null;
  /** Current route */
  route?: string;
  /** Arbitrary metadata object */
  metadata?: Record<string, unknown>;
}

export function trackEvent({
  event_name,
  session_id,
  route,
  metadata = {},
}: TrackEventOptions): void {
  const payload = {
    event_name,
    session_id: session_id ?? null,
    route: route || (typeof window !== "undefined" ? window.location.pathname : "/"),
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
    },
  };

  // Fire-and-forget — don't block the UI
  supabase
    .from("event_logs")
    .insert(payload)
    .then(({ error }) => {
      if (error) console.warn(`[trackEvent] ${event_name} insert failed:`, error);
    });
}
