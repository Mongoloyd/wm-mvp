/**
 * admin-data — Server-side proxy for AdminDashboard reads and writes.
 *
 * All queries run with service_role to bypass RLS on locked operator tables.
 * The dashboard's client-side password gate provides access control.
 *
 * Actions:
 *   fetch_leads             — today's leads
 *   fetch_opportunities     — all contractor_opportunities
 *   fetch_contractors       — active contractors
 *   fetch_routes            — routes (optionally filtered by opportunity_id)
 *   fetch_billable          — billable_intros + contractor_outcomes
 *   route_opportunity       — insert route + update opportunity status
 *   mark_dead               — set opportunity status to dead
 *   update_lead_status      — update lead status field
 *   fetch_voice_followups   — recent automated voice AI call logs
 *   trigger_voice_followup  — manually trigger a voice AI call for a specific lead
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date().toISOString();

    // ═══════════════════════════════════════════════════════════════
    // READS
    // ═══════════════════════════════════════════════════════════════

    if (action === "fetch_leads") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ data });
    }

    if (action === "fetch_opportunities") {
      const { data, error } = await supabase
        .from("contractor_opportunities")
        .select("*")
        .order("priority_score", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ data });
    }

    if (action === "fetch_contractors") {
      const { data, error } = await supabase
        .from("contractors")
        .select("*")
        .eq("status", "active");
      if (error) return json({ error: error.message }, 500);
      return json({ data });
    }

    if (action === "fetch_routes") {
      const { opportunity_id } = body;
      let query = supabase
        .from("contractor_opportunity_routes")
        .select("*")
        .order("created_at", { ascending: false });
      if (opportunity_id) {
        query = query.eq("opportunity_id", opportunity_id);
      }
      const { data, error } = await query;
      if (error) return json({ error: error.message }, 500);
      return json({ data });
    }

    if (action === "fetch_billable") {
      const { data: intros, error: e1 } = await supabase
        .from("billable_intros")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: outcomes, error: e2 } = await supabase
        .from("contractor_outcomes")
        .select("*");
      if (e1 || e2) return json({ error: (e1 || e2)!.message }, 500);
      return json({ intros, outcomes });
    }

    // ═══════════════════════════════════════════════════════════════
    // WRITES
    // ═══════════════════════════════════════════════════════════════

    if (action === "route_opportunity") {
      const { opportunity_id, contractor_id, scan_session_id } = body;
      if (!opportunity_id || !contractor_id) {
        return json({ error: "opportunity_id and contractor_id required" }, 400);
      }

      // Insert route
      const { error: routeErr } = await supabase
        .from("contractor_opportunity_routes")
        .insert({
          opportunity_id,
          contractor_id,
          route_status: "sent",
          sent_at: now,
          assigned_by: "operator",
          routing_reason: "manual_assignment",
        });
      if (routeErr) return json({ error: routeErr.message }, 500);

      // Update opportunity
      await supabase
        .from("contractor_opportunities")
        .update({ status: "sent_to_contractor", routed_at: now })
        .eq("id", opportunity_id);

      // Log event
      await supabase.from("event_logs").insert({
        event_name: "contractor_intro_routed",
        session_id: scan_session_id || null,
        route: "/admin",
        metadata: { opportunity_id, contractor_id, timestamp: now },
      });

      return json({ success: true });
    }

    if (action === "mark_dead") {
      const { opportunity_id, scan_session_id } = body;
      if (!opportunity_id) return json({ error: "opportunity_id required" }, 400);

      await supabase
        .from("contractor_opportunities")
        .update({ status: "dead" })
        .eq("id", opportunity_id);

      await supabase.from("event_logs").insert({
        event_name: "contractor_opportunity_marked_dead",
        session_id: scan_session_id || null,
        route: "/admin",
        metadata: { opportunity_id },
      });

      return json({ success: true });
    }

    if (action === "update_lead_status") {
      const { lead_id, status } = body;
      if (!lead_id || !status) return json({ error: "lead_id and status required" }, 400);

      const { error } = await supabase
        .from("leads")
        .update({ status, updated_at: now })
        .eq("id", lead_id);
      if (error) return json({ error: error.message }, 500);

      return json({ success: true });
    }

    if (action === "fetch_voice_followups") {
      const { data, error } = await supabase
        .from("voice_followups")
        .select(`
          id,
          created_at,
          phone_e164,
          lead_id,
          scan_session_id,
          opportunity_id
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("[admin-data] error fetching voice followups:", error);
        return json({ error: error.message }, 500);
      }

      return json({ data });
    }

    if (action === "trigger_voice_followup") {
      const { lead_id, phone_e164, opportunity_id } = body;

      if (!phone_e164 || !lead_id) {
        return json({ error: "phone_e164 and lead_id are required" }, 400);
      }

      const { data, error } = await supabase.functions.invoke("voice-followup", {
        body: {
          lead_id,
          phone_e164,
          opportunity_id,
          call_intent: "manual_admin_trigger",
        },
      });

      if (error) {
        console.error("[admin-data] trigger call error:", error);
        const status =
          (error as any)?.context?.status && typeof (error as any).context.status === "number"
            ? (error as any).context.status
            : 500;
        return json({ error: "Failed to trigger voice AI" }, status);
      }

      return json({ success: true, data });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (err) {
    console.error("[admin-data] unhandled error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
