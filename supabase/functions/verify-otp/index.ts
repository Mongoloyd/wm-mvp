import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone_e164, code, scan_session_id } = await req.json();

    if (!phone_e164 || !code) {
      return new Response(
        JSON.stringify({ error: "Phone and code are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const verifySid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID")!;

    // Check verification via Twilio Verify
    const twilioRes = await fetch(
      `https://verify.twilio.com/v2/Services/${verifySid}/VerificationCheck`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phone_e164, Code: code }),
      }
    );

    const twilioData = await twilioRes.json();

    if (!twilioRes.ok || twilioData.status !== "approved") {
      console.error("Twilio VerificationCheck:", twilioData);
      return new Response(
        JSON.stringify({ error: "Invalid or expired code.", verified: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update phone_verifications & lead
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date().toISOString();

    // ── 4. Resolve lead_id from scan_sessions (if provided) ──
    let resolvedLeadId: string | null = null;
    if (scan_session_id) {
      const { data: session } = await supabase
        .from("scan_sessions")
        .select("lead_id")
        .eq("id", scan_session_id)
        .maybeSingle();
      resolvedLeadId = session?.lead_id || null;
      console.log("verify-otp: resolved lead_id", { scan_session_id, resolvedLeadId });
    }

    // ── 5. Mark phone_verifications row as verified + bind lead_id ──
    const updatePayload: Record<string, unknown> = {
      status: "verified",
      verified_at: now,
    };
    if (resolvedLeadId) {
      updatePayload.lead_id = resolvedLeadId;
    }

    await supabase
      .from("phone_verifications")
      .update(updatePayload)
      .eq("phone_e164", phone_e164)
      .eq("status", "pending");

    // ── 6. If lead found, also mark lead.phone_verified + update phone ──
    if (resolvedLeadId) {
      await supabase
        .from("leads")
        .update({ phone_verified: true, phone_e164 })
        .eq("id", resolvedLeadId);
    }

    return new Response(
      JSON.stringify({ success: true, verified: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-otp error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
