/**
 * trackBusinessEvent.ts — Canonical Business Event Emitter
 *
 * Pushes vendor-agnostic business events into window.dataLayer.
 * GTM picks them up and routes to Meta Pixel, GA4, Google Ads, etc.
 *
 * Every event includes:
 *   - event_id   → for cross-platform deduplication
 *   - lead_id    → persistent visitor identity
 *   - utm        → attribution snapshot
 *   - route      → current page path
 *   - wm_timestamp → ISO timestamp
 *
 * Usage:
 *   import { trackBusinessEvent } from "@/lib/tracking";
 *   trackBusinessEvent("quote_uploaded", { scan_session_id: "abc", county: "Miami-Dade" });
 */

import { getLeadId } from "@/lib/useLeadId";
import { getUtmPayload } from "@/lib/useUtmCapture";
import type { BusinessEventName, BusinessEventPayload } from "./events";

// ── Event ID generation ─────────────────────────────────────────────────────

/**
 * Generate a unique, human-debuggable event ID.
 * Format: wm_{unix_ms}_{8-char random}
 *
 * Used by GTM to populate Meta's `eventID` parameter and GA4's
 * `transaction_id` for server/browser deduplication.
 */
export function generateEventId(): string {
  const random = crypto.randomUUID().slice(0, 8);
  return `wm_${Date.now()}_${random}`;
}

// ── Core emitter ────────────────────────────────────────────────────────────

/**
 * Push a canonical business event to window.dataLayer.
 *
 * @param eventName - One of the canonical BUSINESS_EVENTS values
 * @param metadata  - Additional key/value pairs (scan_session_id, grade, etc.)
 * @returns The generated event_id (caller may forward to CAPI relay later)
 */
export function trackBusinessEvent(
  eventName: BusinessEventName,
  metadata: Record<string, unknown> = {}
): string {
  if (typeof window === "undefined") return "";

  const eventId = generateEventId();
  const leadId = getLeadId();
  const utm = getUtmPayload();
  const route =
    typeof window !== "undefined" ? window.location.pathname : "/";

  const payload: BusinessEventPayload = {
    ...metadata,
    event: eventName,
    event_id: eventId,
    lead_id: leadId,
    route,
    utm,
    wm_timestamp: new Date().toISOString(),
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);

  if (import.meta.env.DEV) {
    console.debug(
      `%c[biz-event] ${eventName}`,
      "color: #059669; font-weight: bold;",
      { event_id: eventId, lead_id: leadId, ...metadata }
    );
  }

  return eventId;
}
