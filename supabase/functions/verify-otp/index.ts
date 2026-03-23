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

    console.log("[verify-otp] invoked", {
      phone_e164,
      scan_session_id: scan_session_id || "(not provided)",
    });

    if (!phone_e164 || !code) {
      return new Response(
        JSON.stringify({ error: "Phone and code are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 1. Twilio VerificationCheck ──────────────────────────────────────────
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const verifySid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID")!;

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

    console.log("[verify-otp] Twilio response", {
      httpStatus: twilioRes.status,
      verificationStatus: twilioData.status,
      errorCode: twilioData.code || null,
      errorMessage: twilioData.message || null,
    });

    if (!twilioRes.ok || twilioData.status !== "approved") {
      return new Response(
        JSON.stringify({ error: "Invalid or expired code.", verified: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. Init Supabase admin client ────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date().toISOString();

    // ── 3. Resolve lead_id from scan_sessions (if provided) ─────────────────
    let resolvedLeadId: string | null = null;
    if (scan_session_id) {
      const { data: session } = await supabase
        .from("scan_sessions")
        .select("lead_id")
        .eq("id", scan_session_id)
        .maybeSingle();
      resolvedLeadId = session?.lead_id || null;
    }

    console.log("[verify-otp] lead resolution", {
      scan_session_id: scan_session_id || "(not provided)",
      resolvedLeadId: resolvedLeadId || "(none)",
    });

    // ── 4. Select the latest pending phone_verifications row ────────────────
    const { data: pendingRow } = await supabase
      .from("phone_verifications")
      .select("id")
      .eq("phone_e164", phone_e164)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!pendingRow) {
      console.warn("[verify-otp] no pending phone_verifications row found", {
        phone_e164,
      });
      // Twilio approved but no pending DB row — still return success
      // (the verification itself is valid, the DB row may have been
      //  already updated by a prior attempt or race condition)
      return new Response(
        JSON.stringify({ success: true, verified: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[verify-otp] selected pending row", {
      phoneVerificationId: pendingRow.id,
      phone_e164,
    });

    // ── 5. Update ONLY that single row — mark verified + bind lead_id ───────
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
      console.error("[verify-otp] failed to update phone_verifications row", {
        phoneVerificationId: pendingRow.id,
        error: updateErr,
      });
    } else {
      console.log("[verify-otp] phone_verifications row updated", {
        phoneVerificationId: pendingRow.id,
        lead_id: resolvedLeadId || "(not set)",
      });
    }

    // ── 6. If lead found, mark lead.phone_verified + update phone ───────────
    if (resolvedLeadId) {
      const { error: leadErr } = await supabase
        .from("leads")
        .update({ phone_verified: true, phone_e164 })
        .eq("id", resolvedLeadId);

      if (leadErr) {
        console.error("[verify-otp] failed to update lead", {
          lead_id: resolvedLeadId,
          error: leadErr,
        });
      } else {
        console.log("[verify-otp] lead updated", {
          lead_id: resolvedLeadId,
          phone_verified: true,
        });
      }
    }

    console.log("[verify-otp] complete — returning success", { phone_e164 });

    return new Response(
      JSON.stringify({ success: true, verified: true }),
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
