/**
 * canonicalEventId.ts — Deterministic Event ID generation (browser/server parity)
 *
 * Mirrors the algorithm used by `defaultCreateId` in
 * `src/lib/tracking/canonical/createCanonicalEvent.ts` so that the browser and
 * the server can independently produce the SAME `event_id` for a single
 * business moment. This is what makes browser dataLayer fires dedup-safe with
 * server-side canonical persistence + downstream platform dispatch.
 *
 * The format is:
 *   wmc_{eventName}_{entityKey-entityValue}__{...}_{minute-bucketed-timestamp}
 *
 * Example:
 *   wmc_quote_uploaded_leadId-abc__scanSessionId-def_2026-04-16t10-30-00-000z
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
 * `defaultCreateId` algorithm. Browser and server will produce the same ID
 * for the same business moment as long as both fires land in the same
 * 1-minute bucket.
 */
export function buildCanonicalEventId(input: CanonicalEventIdInput): string {
  const eventName = sanitize(input.eventName);
  const segments: string[] = [];
  if (input.leadId) segments.push(`leadid-${sanitize(input.leadId)}`);
  if (input.scanSessionId) segments.push(`scansessionid-${sanitize(input.scanSessionId)}`);
  if (input.analysisId) segments.push(`analysisid-${sanitize(input.analysisId)}`);
  const entityPart = segments.length > 0 ? segments.join("__") : "no-entity";
  const bucket = sanitize(bucketTimestamp(input.now));
  return `wmc_${eventName}_${entityPart}_${bucket}`;
}
