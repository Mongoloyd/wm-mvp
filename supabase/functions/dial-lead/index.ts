/**
 * dial-lead — P3 Outbound Calling: one-click autodial from CRM Desk.
 *
 * Admin-auth gated (operator / super_admin).
 * Input:  { lead_id, call_intent? }
 * Output: { success, followup_id, webhook_status }
 *
 * - Looks up lead metadata (phone, name, county, grade, flags)
 * - Inserts a voice_followups row (status: queued)
 * - Fires PHONECALL_BOT_WEBHOOK_URL (graceful skip if unset)
 * - Bumps lead.deal_status → "attempted" when currently new/null
 * - Logs voice_followup_queued to lead_events
 */

import { corsHeaders, validateAdminRequestWithRole } from "../_shared/adminAuth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const validation = await validateAdminRequestWithRole(req, ["super_admin", "operator"]);
    if (!validation.ok) return validation.response;

    const { supabaseAdmin: supabase } = validation;

    const body = await req.json();
    const lead_id: string | undefined = body.lead_id;
    const call_intent: string = body.call_intent || "operator_outbound";

    if (!lead_id) {
      return new Response(
        JSON.stringify({ error: "lead_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 1. Look up lead ──────────────────────────────────────────────────
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("id, phone_e164, first_name, county, grade, flag_count, latest_scan_session_id, deal_status")
      .eq("id", lead_id)
      .maybeSingle();

    if (leadErr || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!lead.phone_e164) {
      return new Response(
        JSON.stringify({ error: "Lead has no phone number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const now = new Date().toISOString();

    // ── 2. Insert voice_followups row ────────────────────────────────────
    const { data: followup, error: insertErr } = await supabase
      .from("voice_followups")
      .insert({
        lead_id: lead.id,
        phone_e164: lead.phone_e164,
        call_intent,
        status: "queued",
        provider: "phonecall_bot",
        scan_session_id: lead.latest_scan_session_id || null,
        cta_source: "crm_autodial",
        payload_json: {
          to: lead.phone_e164,
          info: {
            lead_id: lead.id,
            first_name: lead.first_name || null,
            county: lead.county || null,
            grade: lead.grade || null,
            flag_count: lead.flag_count || 0,
            call_intent,
          },
        },
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("[dial-lead] Failed to insert voice_followups:", insertErr.message);
      return new Response(
        JSON.stringify({ error: "Failed to queue call" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 3. Fire webhook ──────────────────────────────────────────────────
    const webhookUrl = Deno.env.get("PHONECALL_BOT_WEBHOOK_URL");
    let webhookStatus = "queued";

    if (webhookUrl) {
      try {
        const payload = (followup as any)?.payload_json ?? {
          to: lead.phone_e164,
          info: { lead_id: lead.id, call_intent },
        };

        // Re-read the payload we just inserted (it's in the insert above)
        const resp = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: lead.phone_e164,
            info: {
              lead_id: lead.id,
              first_name: lead.first_name || null,
              county: lead.county || null,
              grade: lead.grade || null,
              flag_count: lead.flag_count || 0,
              call_intent,
              cta_source: "crm_autodial",
            },
          }),
        });

        webhookStatus = resp.ok ? "sent" : "failed";
        if (!resp.ok) {
          console.error("[dial-lead] webhook failed:", resp.status);
        }
      } catch (err) {
        webhookStatus = "failed";
        console.error("[dial-lead] webhook error:", err instanceof Error ? err.message : err);
      }

      // Update followup status
      await supabase
        .from("voice_followups")
        .update({ status: webhookStatus === "sent" ? "in_progress" : "failed" })
        .eq("id", followup.id);
    } else {
      console.log("[dial-lead] PHONECALL_BOT_WEBHOOK_URL not set — skipping");
    }

    // ── 4. Bump deal_status if new/null ──────────────────────────────────
    if (!lead.deal_status || lead.deal_status === "new") {
      await supabase
        .from("leads")
        .update({ deal_status: "attempted" })
        .eq("id", lead.id);
    }

    // ── 5. Log event ─────────────────────────────────────────────────────
    await supabase.from("lead_events").insert({
      lead_id: lead.id,
      event_name: "voice_followup_queued",
      event_source: "dial-lead",
      voice_followup_id: followup.id,
      metadata: {
        call_intent,
        webhook_status: webhookStatus,
        cta_source: "crm_autodial",
        timestamp: now,
      },
    });

    console.log("[dial-lead] success", {
      lead_id: lead.id,
      followup_id: followup.id,
      webhook_status: webhookStatus,
    });

    return new Response(
      JSON.stringify({
        success: true,
        followup_id: followup.id,
        webhook_status: webhookStatus,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[dial-lead] unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
