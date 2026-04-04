import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DEV_BYPASS_SECRET = Deno.env.get("VITE_DEV_BYPASS_SECRET")!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/scan-quote`;

function serviceRoleClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

Deno.test("lead snapshot sync fires on completed scan with lead_id", async () => {
  const supabase = serviceRoleClient();
  const leadId = crypto.randomUUID();
  const scanSessionId = crypto.randomUUID();
  const sessionId = `test-session-${Date.now()}`;

  // Create a lead
  const { error: leadErr } = await supabase.from("leads").insert({
    id: leadId,
    session_id: sessionId,
    first_name: "Test",
    email: "test-lead-sync@example.com",
    county: "Palm Beach",
  });
  if (leadErr) throw new Error(`Lead insert failed: ${leadErr.message}`);

  // Create scan session linked to lead
  const { error: ssErr } = await supabase.from("scan_sessions").insert({
    id: scanSessionId,
    status: "uploading",
    lead_id: leadId,
  });
  if (ssErr) throw new Error(`Scan session insert failed: ${ssErr.message}`);

  // Dev bypass extraction override with a valid window quote
  const devOverride = {
    document_type: "impact_window_quote",
    is_window_door_related: true,
    confidence: 0.92,
    contractor_name: "Test Windows LLC",
    opening_count: 5,
    total_quoted_price: 15000,
    hvhz_zone: true,
    cancellation_policy: "3-day right of rescission",
    line_items: [
      { description: "PGT WinGuard Impact Window", quantity: 5, unit_price: 1200, total_price: 6000, brand: "PGT", series: "WinGuard", dp_rating: "+50/-60", noa_number: "NOA 17-0501.09" },
    ],
    warranty: { labor_years: 10, manufacturer_years: 99, transferable: true, details: "Lifetime manufacturer warranty" },
    permits: { included: true, responsible_party: "contractor", details: "All permits included" },
    installation: { scope_detail: "Full removal and installation", disposal_included: true, accessories_mentioned: true },
  };

  // Invoke scan-quote with dev bypass
  const resp = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      scan_session_id: scanSessionId,
      dev_extraction_override: devOverride,
      dev_secret: DEV_BYPASS_SECRET,
    }),
  });
  const body = await resp.json();
  console.log("Scan response:", JSON.stringify(body));
  assertEquals(resp.status, 200);
  assertEquals(body.analysis_status, "complete");

  // Verify lead snapshot was updated
  const { data: lead, error: leadFetchErr } = await supabase
    .from("leads")
    .select("latest_analysis_id, grade, flag_count, critical_flag_count, red_flag_count, amber_flag_count, funnel_stage, latest_scan_session_id")
    .eq("id", leadId)
    .single();

  if (leadFetchErr) throw new Error(`Lead fetch failed: ${leadFetchErr.message}`);
  console.log("Lead after sync:", JSON.stringify(lead));

  assertExists(lead.latest_analysis_id, "latest_analysis_id should be set");
  assertExists(lead.grade, "grade should be set");
  assertEquals(lead.funnel_stage, "scanned");
  assertEquals(lead.latest_scan_session_id, scanSessionId);
  assertEquals(typeof lead.flag_count, "number");

  // Verify lead_events entry
  const { data: events, error: eventsErr } = await supabase
    .from("lead_events")
    .select("event_name, event_source, analysis_id, scan_session_id, metadata")
    .eq("lead_id", leadId)
    .eq("event_name", "wm_scan_completed");

  if (eventsErr) throw new Error(`Lead events fetch failed: ${eventsErr.message}`);
  console.log("Lead events:", JSON.stringify(events));

  assertEquals(events.length, 1, "Should have exactly one wm_scan_completed event");
  assertEquals(events[0].event_source, "backend");
  assertEquals(events[0].scan_session_id, scanSessionId);
  assertEquals(events[0].analysis_id, lead.latest_analysis_id);

  // Cleanup
  await supabase.from("lead_events").delete().eq("lead_id", leadId);
  await supabase.from("analyses").delete().eq("scan_session_id", scanSessionId);
  await supabase.from("scan_sessions").delete().eq("id", scanSessionId);
  await supabase.from("leads").delete().eq("id", leadId);

  console.log("✅ Lead snapshot sync test PASSED");
});
