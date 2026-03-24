/**
 * trackEvent — Centralized event_logs writer.
 *
 * Fires-and-forgets an INSERT into event_logs with a consistent payload shape.
 * All conversion, recovery, and monetization events funnel through here.
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
