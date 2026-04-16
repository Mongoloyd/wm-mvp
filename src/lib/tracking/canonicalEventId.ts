/**
 * canonicalEventId.ts — Deterministic Event ID generation (browser/server parity)
 *
 * Mirrors the algorithm used by `defaultCreateId` in
 * `src/lib/tracking/canonical/createCanonicalEvent.ts` so that the browser and
 * the server can independently produce the SAME `event_id` for a single
 * business moment. This is what makes browser dataLayer fires dedup-safe with
 * server-side canonical persistence + downstream platform dispatch.
 *
 * The format mirrors the server EXACTLY:
 *   wmc_{sanitized_eventName}_{leadId-{sanitizedValue}__scanSessionId-{sanitizedValue}__analysisId-{sanitizedValue}}_{sanitized_minute_bucket}
 *
 * Note: only event-name, value-portions, and bucket are sanitized. The
 * camelCase key prefixes (leadId, scanSessionId, analysisId) are preserved
 * verbatim — exactly as `defaultCreateId` composes them.
 *
 * Keep this in lockstep with createCanonicalEvent.ts. Do NOT diverge.
 */

function sanitize(value: unknown): string {
  if (value === null || value === undefined) return "unknown";
  return (
    String(value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "unknown"
  );
}

function bucketTimestamp(now: Date = new Date()): string {
  return new Date(Math.floor(now.getTime() / 60000) * 60000).toISOString();
}

export interface CanonicalEventIdInput {
  eventName: string;
  leadId?: string | null;
  scanSessionId?: string | null;
  analysisId?: string | null;
  /** Override timestamp (mainly for tests). Defaults to `new Date()`. */
  now?: Date;
}

/**
 * Build a deterministic event_id that matches the server-side
 * `defaultCreateId` algorithm. Browser and server produce the same ID
 * for the same business moment when both fires land in the same 1-minute
 * timestamp bucket.
 */
export function buildCanonicalEventId(input: CanonicalEventIdInput): string {
  const eventName = sanitize(input.eventName);
  const segments: string[] = [];
  if (input.leadId) segments.push(`leadId-${sanitize(input.leadId)}`);
  if (input.scanSessionId) segments.push(`scanSessionId-${sanitize(input.scanSessionId)}`);
  if (input.analysisId) segments.push(`analysisId-${sanitize(input.analysisId)}`);
  const entityPart = segments.length > 0 ? segments.join("__") : "no-entity";
  const bucket = sanitize(bucketTimestamp(input.now));
  return `wmc_${eventName}_${entityPart}_${bucket}`;
}
