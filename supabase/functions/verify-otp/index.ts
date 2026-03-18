import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    // Update phone_verifications
    await supabase
      .from("phone_verifications")
      .update({ status: "verified", verified_at: now })
      .eq("phone_e164", phone_e164);

    // Update lead with verified phone if scan_session provided
    if (scan_session_id) {
      const { data: session } = await supabase
        .from("scan_sessions")
        .select("lead_id")
        .eq("id", scan_session_id)
        .maybeSingle();

      if (session?.lead_id) {
        await supabase
          .from("leads")
          .update({ phone_e164 })
          .eq("id", session.lead_id);
      }
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
