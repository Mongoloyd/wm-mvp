// ═══════════════════════════════════════════════════════════════════════════════
// Unit tests for scan-quote helpers
// Uses minimal mock Supabase clients — no live network calls required.
// ═══════════════════════════════════════════════════════════════════════════════

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  jsonResponse,
  updateScanSessionStatus,
  upsertAnalysisRecord,
} from "./helpers.ts";

// ─── Mock helpers ─────────────────────────────────────────────────────────────

/** Returns a mock Supabase client whose `.from(table).update(...).eq(...).select(...)` resolves with the given result. */
function mockScanSessionsUpdate(result: {
  data: Array<{ id: string }> | null;
  error: { message: string } | null;
}) {
  return {
    from: (_table: string) => ({
      update: (_row: unknown) => ({
        eq: (_col: string, _val: string) => ({
          select: (_fields: string) => Promise.resolve(result),
        }),
      }),
    }),
  } as unknown as ReturnType<typeof createClient>;
}

/** Returns a mock Supabase client whose `.from(table).upsert(...)` resolves with the given result. */
function mockAnalysesUpsert(result: {
  error: { message: string } | null;
}) {
  return {
    from: (_table: string) => ({
      upsert: (_payload: unknown, _opts: unknown) =>
        Promise.resolve(result),
    }),
  } as unknown as ReturnType<typeof createClient>;
}

// ─── jsonResponse ─────────────────────────────────────────────────────────────

Deno.test("jsonResponse — sets status code and JSON body", async () => {
  const resp = jsonResponse({ foo: "bar" }, 201);
  assertEquals(resp.status, 201);
  const body = await resp.json();
  assertEquals(body, { foo: "bar" });
});

Deno.test("jsonResponse — sets Content-Type header", () => {
  const resp = jsonResponse({}, 200);
  assertEquals(resp.headers.get("Content-Type"), "application/json");
});

// ─── updateScanSessionStatus — DB error path ─────────────────────────────────

Deno.test("updateScanSessionStatus — returns failure on DB error", async () => {
  const supabase = mockScanSessionsUpdate({
    data: null,
    error: { message: "connection timeout" },
  });

  const result = await updateScanSessionStatus(
    supabase,
    "session-123",
    "processing",
    "test update failed",
  );

  assertEquals(result.success, false);
  if (!result.success) {
    assertEquals(result.response.status, 500);
    const body = await result.response.json();
    assertEquals(body.error, "Failed to persist scan session state");
    assertEquals(body.scan_session_id, "session-123");
    // Default failure body must NOT include hard-coded analysis/session status
    assertEquals("analysis_status" in body, false);
    assertEquals("scan_session_status" in body, false);
  }
});

Deno.test("updateScanSessionStatus — uses caller-supplied failureBody on DB error", async () => {
  const supabase = mockScanSessionsUpdate({
    data: null,
    error: { message: "unique violation" },
  });

  const result = await updateScanSessionStatus(
    supabase,
    "session-abc",
    "processing",
    "custom failure",
    { error: "custom error", extra: "data" },
  );

  assertEquals(result.success, false);
  if (!result.success) {
    const body = await result.response.json();
    assertEquals(body.error, "custom error");
    assertEquals(body.extra, "data");
  }
});

// ─── updateScanSessionStatus — zero rows updated ─────────────────────────────

Deno.test("updateScanSessionStatus — returns failure when 0 rows updated", async () => {
  const supabase = mockScanSessionsUpdate({ data: [], error: null });

  const result = await updateScanSessionStatus(
    supabase,
    "session-gone",
    "preview_ready",
    "no-op update",
  );

  assertEquals(result.success, false);
  if (!result.success) {
    assertEquals(result.response.status, 500);
    const body = await result.response.json();
    assertEquals(body.error, "Failed to persist scan session state");
    assertEquals(body.scan_session_id, "session-gone");
    // Default failure body must NOT include hard-coded analysis/session status
    assertEquals("analysis_status" in body, false);
    assertEquals("scan_session_status" in body, false);
  }
});

Deno.test("updateScanSessionStatus — uses caller-supplied failureBody when 0 rows updated", async () => {
  const supabase = mockScanSessionsUpdate({ data: [], error: null });

  const result = await updateScanSessionStatus(
    supabase,
    "session-xyz",
    "preview_ready",
    "no-op update",
    { error: "session not found", scan_session_id: "session-xyz", hint: "deleted" },
  );

  assertEquals(result.success, false);
  if (!result.success) {
    const body = await result.response.json();
    assertEquals(body.hint, "deleted");
  }
});

// ─── updateScanSessionStatus — success path ──────────────────────────────────

Deno.test("updateScanSessionStatus — returns success when row is updated", async () => {
  const supabase = mockScanSessionsUpdate({
    data: [{ id: "session-ok" }],
    error: null,
  });

  const result = await updateScanSessionStatus(
    supabase,
    "session-ok",
    "processing",
    "test update",
  );

  assertEquals(result.success, true);
});

// ─── upsertAnalysisRecord — DB error path ────────────────────────────────────

Deno.test("upsertAnalysisRecord — returns failure on DB error", async () => {
  const supabase = mockAnalysesUpsert({ error: { message: "FK violation" } });

  const result = await upsertAnalysisRecord(
    supabase,
    { scan_session_id: "session-111", analysis_status: "processing" },
    "analyses upsert failed",
    { error: "Failed to persist analysis state", scan_session_id: "session-111" },
  );

  assertEquals(result.success, false);
  if (!result.success) {
    assertEquals(result.response.status, 500);
    const body = await result.response.json();
    assertEquals(body.error, "Failed to persist analysis state");
  }
});

Deno.test("upsertAnalysisRecord — respects caller-supplied HTTP status", async () => {
  const supabase = mockAnalysesUpsert({ error: { message: "timeout" } });

  const result = await upsertAnalysisRecord(
    supabase,
    { scan_session_id: "s" },
    "upsert failed",
    { error: "bad" },
    422,
  );

  assertEquals(result.success, false);
  if (!result.success) {
    assertEquals(result.response.status, 422);
  }
});

// ─── upsertAnalysisRecord — success path ─────────────────────────────────────

Deno.test("upsertAnalysisRecord — returns success when no DB error", async () => {
  const supabase = mockAnalysesUpsert({ error: null });

  const result = await upsertAnalysisRecord(
    supabase,
    { scan_session_id: "session-222", analysis_status: "complete" },
    "analyses upsert ok",
    { error: "should not appear" },
  );

  assertEquals(result.success, true);
});
