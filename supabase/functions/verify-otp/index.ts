import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { normalizePhone } from "../_shared/normalizePhone.ts";
import { persistCanonicalEvent } from "../_shared/tracking/canonicalBridge.ts";

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
    const body = await req.json();
    const phone_e164 = normalizePhone(body.phone_e164);
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const scan_session_id = body.scan_session_id || undefined;

    if (!phone_e164 || !code) {
      return new Response(
        JSON.stringify({ error: "Phone and code are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Strict US E.164 validation after normalization (belt-and-suspenders)
    if (!/^\+1\d{10}$/.test(phone_e164)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone format." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 1. Init Supabase admin client ───────────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── 2. Select the latest pending phone_verifications row ────────────
    const { data: pendingRow } = await supabase
      .from("phone_verifications")
      .select("id, phone_e164")
      .eq("phone_e164", phone_e164)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log("[VERIFY_OTP_FORENSIC]", JSON.stringify({
      phone_masked: "xxx-xxx-" + phone_e164.slice(-4),
      pendingRowFound: !!pendingRow,
      pendingRowId: pendingRow?.id ?? null,
      timestamp: new Date().toISOString(),
    }));

    // The phone we send to Twilio: prefer DB value, fall back to normalized value
    const twilioPhone = pendingRow?.phone_e164 ?? phone_e164;

    // ── 3. Twilio VerificationCheck ─────────────────────────────────────
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const verifySid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID")!;

    const twilioBody = new URLSearchParams({ To: twilioPhone, Code: code });

    const twilioRes = await fetch(
      `https://verify.twilio.com/v2/Services/${verifySid}/VerificationCheck`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: twilioBody,
      }
    );

    const twilioData = await twilioRes.json();

    if (!twilioRes.ok || twilioData.status !== "approved") {
      let userMsg = "Invalid or expired code.";
      if (twilioData.code === 20404) {
        userMsg = "Verification session expired or not found. Please request a new code.";
      }
      return new Response(
        JSON.stringify({ error: userMsg, verified: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 4. Twilio approved — update DB ──────────────────────────────────
    const now = new Date().toISOString();

    // Resolve lead_id from scan_sessions (if provided)
    let resolvedLeadId: string | null = null;
    if (scan_session_id) {
      const { data: session } = await supabase
        .from("scan_sessions")
        .select("lead_id")
        .eq("id", scan_session_id)
        .maybeSingle();
      resolvedLeadId = session?.lead_id || null;

      // ── Defensive integrity guard ──
      // If scan_session_id was provided but has no lead_id, we cannot bind
      // the verification to a lead. Log and fail rather than silently
      // succeeding with an unbindable verification.
      if (!resolvedLeadId) {
        console.error("[VERIFY_OTP_INTEGRITY_GUARD]", JSON.stringify({
          scan_session_id,
          phone_masked: "xxx-xxx-" + phone_e164.slice(-4),
          reason: "scan_session has no lead_id — cannot bind verification",
          timestamp: new Date().toISOString(),
        }));
        return new Response(
          JSON.stringify({
            error: "Verification could not be linked to your session. Please try again.",
            verified: false,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── 5. Update the pending row — mark verified + bind lead_id ────────
    // CRITICAL: If this write fails, the frontend must know so it can
    // prompt the user to resend/retry instead of silently succeeding
    // while get_analysis_full remains unauthorized.
    if (pendingRow) {
      const updatePayload: Record<string, unknown> = {
        status: "verified",
        verified_at: now,
      };
      if (resolvedLeadId) {
        updatePayload.lead_id = resolvedLeadId;
      }

      const { error: updateErr } = await supabase
        .from("phone_verifications")
        .update(updatePayload)
        .eq("id", pendingRow.id);

      if (updateErr) {
        console.error("[verify-otp] CRITICAL: failed to persist verification status:", updateErr);
        return new Response(
          JSON.stringify({
            error: "Verification confirmed but could not be saved. Please request a new code and try again.",
            verified: false,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── 6. If lead found, mark lead.phone_verified + phone + timestamp ──
    // Both phone_verified AND phone_verified_at are required:
    //   - get_analysis_full checks leads.phone_verified = true
    //   - fire_crm_handoff trigger reads leads.phone_verified_at
    if (resolvedLeadId) {
      const { error: leadErr } = await supabase
        .from("leads")
        .update({
          phone_verified: true,
          phone_e164: twilioPhone,
          phone_verified_at: now,
        })
        .eq("id", resolvedLeadId);

      if (leadErr) {
        console.error("[verify-otp] CRITICAL: failed to update lead verification:", leadErr);
        return new Response(
          JSON.stringify({
            error: "Verification confirmed but could not be saved. Please request a new code and try again.",
            verified: false,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (resolvedLeadId && scan_session_id) {
      try {
        await persistCanonicalEvent(supabase, {
          eventId: `wmc_report_revealed_lead-${resolvedLeadId}_scan-${scan_session_id}`,
          eventName: "report_revealed",
          eventTimestamp: now,
          leadId: resolvedLeadId,
          scanSessionId: scan_session_id,
          payload: {
            identity: {
              leadId: resolvedLeadId,
              phone: twilioPhone,
              phoneVerifiedAt: now,
            },
            journey: {
              route: "/verify",
              flow: "public",
              scanSessionId: scan_session_id,
            },
            source: {
              sourceSystem: "edge_function",
            },
            metadata: {
              unlock_moment: "otp_verified",
            },
          },
        });
      } catch (canonicalError) {
        console.error("[verify-otp] report_revealed canonical event failed", canonicalError);
      }
    }

    // Return canonical phone so the frontend can store the server-approved value
    return new Response(
      JSON.stringify({ success: true, verified: true, phone_e164: twilioPhone }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[verify-otp] unhandled exception:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
