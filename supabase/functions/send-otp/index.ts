import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { normalizePhone } from "../_shared/normalizePhone.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ── Rate-limit constants ────────────────────────────────────────────── */
const COOLDOWN_SECONDS = 30;        // min gap between sends for same phone
const WINDOW_MINUTES = 10;          // rolling window
const MAX_SENDS_PER_WINDOW = 5;     // max sends in that window

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const phone_e164 = normalizePhone(body.phone_e164);

    if (!phone_e164) {
      return new Response(
        JSON.stringify({ error: "phone_e164 is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Strict US E.164 validation after normalization (belt-and-suspenders)
    if (!/^\+1\d{10}$/.test(phone_e164)) {
      return new Response(
        JSON.stringify({ error: "Invalid US phone number. Expected format: +1XXXXXXXXXX" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Rate-limit check ────────────────────────────────────────────────
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

    const { data: recentRows, error: rlErr } = await supabase
      .from("phone_verifications")
      .select("created_at")
      .eq("phone_e164", phone_e164)
      .gte("created_at", windowStart)
      .order("created_at", { ascending: false });

    if (rlErr) {
      console.error("[send-otp] rate-limit query failed:", rlErr);
    }

    if (recentRows && recentRows.length > 0) {
      const lastSendAt = new Date(recentRows[0].created_at).getTime();
      const secondsSinceLast = (Date.now() - lastSendAt) / 1000;
      if (secondsSinceLast < COOLDOWN_SECONDS) {
        const waitSec = Math.ceil(COOLDOWN_SECONDS - secondsSinceLast);
        return new Response(
          JSON.stringify({
            error: `Too many code requests. Please wait ${waitSec} seconds before trying again.`,
            success: false,
            retry_after: waitSec,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (recentRows.length >= MAX_SENDS_PER_WINDOW) {
        return new Response(
          JSON.stringify({
            error: `Too many code requests. Please wait a few minutes before trying again.`,
            success: false,
            retry_after: WINDOW_MINUTES * 60,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Twilio Verify: send code ────────────────────────────────────────
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const verifySid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID")!;

    const twilioRes = await fetch(
      `https://verify.twilio.com/v2/Services/${verifySid}/Verifications`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phone_e164, Channel: "sms" }),
      }
    );

    const twilioData = await twilioRes.json();

    if (!twilioRes.ok) {
      console.error("[send-otp] Twilio error:", twilioData);
      return new Response(
        JSON.stringify({ error: "Failed to send verification code.", success: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── DB: expire older pending rows, then insert fresh one ────────────
    const { error: expireErr } = await supabase
      .from("phone_verifications")
      .update({ status: "expired" })
      .eq("phone_e164", phone_e164)
      .eq("status", "pending");
    if (expireErr) {
      console.error("[send-otp] failed to expire old pending rows:", expireErr);
    }

    const { error: insertErr } = await supabase.from("phone_verifications").insert({
      phone_e164,
      status: "pending",
    });
    if (insertErr) {
      console.error("[send-otp] failed to insert pending row:", insertErr);
      return new Response(
        JSON.stringify({ error: "Failed to create verification record.", success: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[send-otp] error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
