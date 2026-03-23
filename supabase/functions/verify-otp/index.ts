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
    const { phone_e164: rawPhone, code, scan_session_id } = await req.json();

    // ── 0. Defensive trim & validation ──────────────────────────────────────
    const phone_e164 = typeof rawPhone === "string" ? rawPhone.trim() : "";

    console.log("[verify-otp] invoked", {
      phone_e164_raw: rawPhone,
      phone_e164_trimmed: phone_e164,
      phone_match: rawPhone === phone_e164,
      scan_session_id: scan_session_id || "(not provided)",
    });

    if (!phone_e164 || !code) {
      return new Response(
        JSON.stringify({ error: "Phone and code are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate E.164 format
    if (!/^\+1\d{10}$/.test(phone_e164)) {
      console.error("[verify-otp] phone failed E.164 validation", { phone_e164 });
      return new Response(
        JSON.stringify({ error: "Invalid phone format." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 1. Init Supabase admin client ───────────────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── 2. Select the latest pending phone_verifications row ────────────────
    //    Use the DB-authoritative phone_e164 for the Twilio call to prevent
    //    any frontend drift / encoding mismatch.
    const { data: pendingRow } = await supabase
      .from("phone_verifications")
      .select("id, phone_e164")
      .eq("phone_e164", phone_e164)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // The phone we send to Twilio: prefer DB value, fall back to frontend value
    const twilioPhone = pendingRow?.phone_e164 ?? phone_e164;

    console.log("[verify-otp] pending row lookup", {
      found: !!pendingRow,
      pendingRowId: pendingRow?.id || "(none)",
      dbPhone: pendingRow?.phone_e164 || "(none)",
      twilioPhone,
      phoneMatch: twilioPhone === phone_e164,
    });

    // ── 3. Twilio VerificationCheck ─────────────────────────────────────────
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const verifySid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID")!;

    // URLSearchParams correctly encodes + as %2B for form-urlencoded
    const twilioBody = new URLSearchParams({ To: twilioPhone, Code: code });

    console.log("[verify-otp] calling Twilio VerificationCheck", {
      twilioPhone,
      codeLength: code.length,
      verifySidLast4: verifySid.slice(-4),
      encodedBody: twilioBody.toString(),
    });

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

    console.log("[verify-otp] Twilio response", {
      httpStatus: twilioRes.status,
      verificationStatus: twilioData.status,
      errorCode: twilioData.code || null,
      errorMessage: twilioData.message || null,
    });

    if (!twilioRes.ok || twilioData.status !== "approved") {
      // Provide more specific error messages based on Twilio error code
      let userMsg = "Invalid or expired code.";
      if (twilioData.code === 20404) {
        userMsg = "Verification session expired or not found. Please request a new code.";
        console.error("[verify-otp] Twilio 20404 — no active session", {
          twilioPhone,
          frontendPhone: phone_e164,
          pendingRowFound: !!pendingRow,
        });
      }
      return new Response(
        JSON.stringify({ error: userMsg, verified: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 4. Twilio approved — update DB ──────────────────────────────────────
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
    }

    console.log("[verify-otp] lead resolution", {
      scan_session_id: scan_session_id || "(not provided)",
      resolvedLeadId: resolvedLeadId || "(none)",
    });

    // ── 5. Update the pending row — mark verified + bind lead_id ────────────
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
    } else {
      console.warn("[verify-otp] no pending row found — Twilio approved but DB row missing", {
        phone_e164,
      });
    }

    // ── 6. If lead found, mark lead.phone_verified + update phone ───────────
    if (resolvedLeadId) {
      const { error: leadErr } = await supabase
        .from("leads")
        .update({ phone_verified: true, phone_e164: twilioPhone })
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

    console.log("[verify-otp] complete — returning success", { phone_e164: twilioPhone });

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
