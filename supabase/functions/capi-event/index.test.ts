import "https://deno.land/std@0.224.0/dotenv/load.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { assert } from "https://deno.land/std@0.224.0/assert/assert.ts";

const admin = createClient(SUPABASE_URL, SERVICE_KEY);
const FUNC_URL = `${SUPABASE_URL}/functions/v1/capi-event`;

Deno.test("capi-event: DB default row takes priority over env fallback", async () => {
  let seedId: string | null = null;

  try {
    // ── SEED ──
    const { data: row, error: seedErr } = await admin
      .from("meta_configurations")
      .insert({
        is_default: true,
        pixel_id: "dummy_pixel_qa",
        access_token: "dummy_token_qa",
        test_event_code: "TEST_QA_RUN",
      })
      .select("id")
      .single();

    assertEquals(seedErr, null, `Seed failed: ${seedErr?.message}`);
    assert(row?.id, "No row ID returned");
    seedId = row.id;
    console.log(`✅ Seeded meta_configuration id=${seedId}`);

    // ── DELAY ──
    await new Promise((r) => setTimeout(r, 2000));

    // ── FIRE ──
    const res = await fetch(FUNC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({
        event_name: "PageView",
        event_id: `qa-db-priority-${Date.now()}`,
        event_source_url: "https://windowman.pro/qa-e2e",
        action_source: "website",
        user_data: { em: "e2e@test.com" },
      }),
    });

    const body = await res.json();
    console.log(`HTTP ${res.status}`, JSON.stringify(body));

    // Function should return 200 (Meta rejects dummy token, but function processed it)
    assertEquals(res.status, 200, `Expected 200, got ${res.status}`);

    // ── VERIFY SIGNAL LOG ──
    const { data: logs } = await admin
      .from("capi_signal_logs")
      .select("pixel_id, status_code")
      .eq("pixel_id", "dummy_pixel_qa")
      .order("fired_at", { ascending: false })
      .limit(1);

    assert(logs && logs.length > 0, "No signal log entry found for dummy_pixel_qa");
    assertEquals(logs[0].pixel_id, "dummy_pixel_qa", "Signal log pixel_id mismatch");
    console.log(`✅ Signal log confirms pixel_id=dummy_pixel_qa, status=${logs[0].status_code}`);

  } finally {
    // ── GUARANTEED TEARDOWN ──
    if (seedId) {
      await admin.from("meta_configurations").delete().eq("id", seedId);
      console.log(`🧹 Deleted meta_configuration ${seedId}`);
    }
    await admin.from("capi_signal_logs").delete().eq("pixel_id", "dummy_pixel_qa");
    console.log("🧹 Cleaned capi_signal_logs");
  }
});

Deno.test("capi-event: graceful 202 when no config exists", async () => {
  const res = await fetch(FUNC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({
      event_name: "PageView",
      event_id: `qa-fallback-${Date.now()}`,
      event_source_url: "https://windowman.pro/qa-fallback",
      action_source: "website",
      user_data: { em: "fallback@test.com" },
    }),
  });

  const body = await res.json();
  console.log(`HTTP ${res.status}`, JSON.stringify(body));

  // Should be 202 degraded (no DB row, no env secrets) OR 200 if env secrets exist
  assert(
    res.status === 202 || res.status === 200,
    `Expected 202 or 200, got ${res.status}`
  );

  if (res.status === 202) {
    assertEquals(body.degraded, true, "Expected degraded=true on 202");
    console.log("✅ Fallback: 202 degraded confirmed");
  } else {
    console.log("ℹ️  Fallback: 200 — env secrets are configured as fallback");
  }

  await res.body?.cancel();
});
