// ═══════════════════════════════════════════════════════════════════════════════
// SCAN-QUOTE HELPERS
// Shared response utilities and defensive DB-write wrappers used by the
// scan-quote edge function.  Extracted into a separate module so they can be
// imported and unit-tested without triggering Deno.serve().
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export type ScanSessionStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "preview_ready"
  | "awaiting_verification"
  | "revealed"
  | "invalid_document"
  | "needs_better_upload";

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export function jsonResponse(
  body: Record<string, unknown>,
  status: number,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Update the `status` column of a single `scan_sessions` row.
 *
 * Returns `{ success: true }` only when the row exists **and** the write
 * succeeds.  Treats a DB error *or* an update that touched 0 rows as a
 * failure so callers can detect both silent deletes and hard errors.
 *
 * The default error body deliberately omits `analysis_status` /
 * `scan_session_status` because we cannot know the true persisted state when
 * the write failed.  Callers that need to surface a specific status should
 * pass their own `failureBody`.
 */
export async function updateScanSessionStatus(
  supabase: ReturnType<typeof createClient>,
  scanSessionId: string,
  status: ScanSessionStatus,
  logMessage: string,
  failureBody?: Record<string, unknown>,
): Promise<{ success: true } | { success: false; response: Response }> {
  const { data, error } = await supabase
    .from("scan_sessions")
    .update({ status })
    .eq("id", scanSessionId)
    .select("id");

  if (error) {
    console.error(logMessage, error);
    return {
      success: false,
      response: jsonResponse(
        failureBody ?? {
          error: "Failed to persist scan session state",
          scan_session_id: scanSessionId,
        },
        500,
      ),
    };
  }

  if (!data || data.length === 0) {
    console.error(
      `${logMessage} — no scan_sessions row updated for id=${scanSessionId}`,
    );
    return {
      success: false,
      response: jsonResponse(
        failureBody ?? {
          error: "Failed to persist scan session state",
          scan_session_id: scanSessionId,
        },
        500,
      ),
    };
  }

  return { success: true };
}

/**
 * Upsert a record into the `analyses` table (conflict key: scan_session_id).
 *
 * Returns `{ success: true }` on success, or a controlled failure response
 * when Supabase returns an error.
 */
export async function upsertAnalysisRecord(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
  logMessage: string,
  failureBody: Record<string, unknown>,
  status = 500,
): Promise<{ success: true } | { success: false; response: Response }> {
  const { error } = await supabase
    .from("analyses")
    .upsert(payload, { onConflict: "scan_session_id" });

  if (error) {
    console.error(logMessage, error);
    return {
      success: false,
      response: jsonResponse(failureBody, status),
    };
  }

  return { success: true };
}
