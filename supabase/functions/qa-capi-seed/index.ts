/**
 * qa-capi-seed — Temporary edge function for E2E validation of capi-event
 * Seeds and tears down meta_configurations rows for testing.
 * Protected by a simple action parameter.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { action } = await req.json();

  if (action === "seed") {
    const { data, error } = await supabase
      .from("meta_configurations")
      .insert({
        is_default: true,
        pixel_id: "dummy_pixel_qa",
        access_token: "dummy_token_qa",
        test_event_code: "TEST_QA_RUN",
      })
      .select("id")
      .single();

    return new Response(
      JSON.stringify({ success: !error, id: data?.id, error: error?.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (action === "teardown") {
    const { error: e1 } = await supabase
      .from("meta_configurations")
      .delete()
      .eq("pixel_id", "dummy_pixel_qa");

    const { error: e2 } = await supabase
      .from("capi_signal_logs")
      .delete()
      .eq("pixel_id", "dummy_pixel_qa");

    return new Response(
      JSON.stringify({
        success: !e1 && !e2,
        config_error: e1?.message,
        logs_error: e2?.message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
