import { corsHeaders, errorResponse, successResponse, validateAdminRequestWithRole, type AppRole } from "../_shared/adminAuth.ts";

/**
 * admin-data v2.2 (Final Unified Version)
 * Restores event_logs tracking and all original contractor/voice logic.
 */

type ActionName = 
  | "fetch_leads" | "update_lead_status"
  | "fetch_opportunities" | "fetch_contractors" | "fetch_routes" | "fetch_billable"
  | "route_opportunity" | "mark_dead"
  | "fetch_voice_followups" | "trigger_voice_followup"
  | "manage_user_roles" | "list_user_roles";

const ACTION_ROLES: Record<ActionName, AppRole[]> = {
  fetch_leads: ["super_admin", "operator", "viewer"],
  update_lead_status: ["super_admin", "operator"],
  fetch_opportunities: ["super_admin", "operator", "viewer"],
  fetch_contractors: ["super_admin", "operator", "viewer"],
  fetch_routes: ["super_admin", "operator", "viewer"],
  fetch_billable: ["super_admin", "operator", "viewer"],
  route_opportunity: ["super_admin", "operator"],
  mark_dead: ["super_admin", "operator"],
  fetch_voice_followups: ["super_admin", "operator", "viewer"],
  trigger_voice_followup: ["super_admin", "operator"],
  manage_user_roles: ["super_admin"],
  list_user_roles: ["super_admin"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse(405, "method_not_allowed", "Use POST");

  try {
    const body = await req.json();
    const { action, payload = {} } = body;
    const requiredRoles = ACTION_ROLES[action as ActionName];

    if (!requiredRoles) return errorResponse(400, "invalid_action", `Unknown action: ${action}`);

    // Verify Identity & Role
    const validation = await validateAdminRequestWithRole(req, requiredRoles);
    if (!validation.ok) return validation.response;

    const { userId, supabaseAdmin } = validation;
    const now = new Date().toISOString();

    // ─── READ ACTIONS ──────────────────────────────────────────────

    if (action === "fetch_leads") {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { data, error } = await supabaseAdmin.from("leads").select("*").gte("created_at", today.toISOString()).order("created_at", { ascending: false });
      if (error) throw error;
      return successResponse({ data });
    }

    if (action === "fetch_opportunities") {
      const { data, error } = await supabaseAdmin.from("contractor_opportunities").select("*").order("priority_score", { ascending: false });
      if (error) throw error;
      return successResponse({ data });
    }

    if (action === "fetch_contractors") {
      const { data, error } = await supabaseAdmin.from("contractors").select("*").eq("status", "active");
      if (error) throw error;
      return successResponse({ data });
    }

    if (action === "fetch_routes") {
      const { opportunity_id } = payload;
      let query = supabaseAdmin.from("contractor_opportunity_routes").select("*").order("created_at", { ascending: false });
      if (opportunity_id) query = query.eq("opportunity_id", opportunity_id);
      const { data, error } = await query;
      if (error) throw error;
      return successResponse({ data });
    }

    if (action === "fetch_billable") {
      const { data: intros, error: e1 } = await supabaseAdmin.from("billable_intros").select("*").order("created_at", { ascending: false });
      const { data: outcomes, error: e2 } = await supabaseAdmin.from("contractor_outcomes").select("*");
      if (e1 || e2) throw e1 || e2;
      return successResponse({ intros, outcomes });
    }

    if (action === "fetch_voice_followups") {
      const { data, error } = await supabaseAdmin.from("voice_followups").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return successResponse({ data });
    }

    // ─── WRITE ACTIONS ─────────────────────────────────────────────

    if (action === "update_lead_status") {
      const { lead_id, status } = payload;
      const { error } = await supabaseAdmin.from("leads").update({ status, updated_at: now }).eq("id", lead_id);
      if (error) throw error;
      return successResponse({ success: true });
    }

    if (action === "route_opportunity") {
      const { opportunity_id, contractor_id, scan_session_id } = payload;
      
      const { error: routeErr } = await supabaseAdmin.from("contractor_opportunity_routes").insert({
        opportunity_id, contractor_id, route_status: "sent", sent_at: now, assigned_by: "operator", routing_reason: "manual_assignment",
      });
      if (routeErr) throw routeErr;

      await supabaseAdmin.from("contractor_opportunities").update({ status: "sent_to_contractor", routed_at: now }).eq("id", opportunity_id);

      // Log event for analytics
      await supabaseAdmin.from("event_logs").insert({
        event_name: "contractor_intro_routed",
        session_id: scan_session_id || null,
        route: "/admin",
        metadata: { opportunity_id, contractor_id, timestamp: now },
      });

      return successResponse({ success: true });
    }

    if (action === "mark_dead") {
      const { opportunity_id, scan_session_id } = payload;
      await supabaseAdmin.from("contractor_opportunities").update({ status: "dead" }).eq("id", opportunity_id);

      // Log event for analytics
      await supabaseAdmin.from("event_logs").insert({
        event_name: "contractor_opportunity_marked_dead",
        session_id: scan_session_id || null,
        route: "/admin",
        metadata: { opportunity_id },
      });

      return successResponse({ success: true });
    }

    if (action === "trigger_voice_followup") {
      const { scan_session_id, phone_e164, opportunity_id } = payload;
      const { data, error } = await supabaseAdmin.functions.invoke("voice-followup", {
        body: { scan_session_id, phone_e164, opportunity_id, call_intent: "manual_admin_trigger" },
      });
      if (error) throw error;
      return successResponse({ success: true, data });
    }

    if (action === "manage_user_roles") {
      const { target_user_id, new_role } = payload;
      if (target_user_id === userId && new_role !== "super_admin") throw new Error("Self-demotion blocked.");
      const { error } = await supabaseAdmin.from("user_roles").upsert({ id: target_user_id, role: new_role, updated_at: now });
      if (error) throw error;
      await supabaseAdmin.from("user_role_audit_log").insert({ target_user_id, changed_by_user_id: userId, new_role, action: "change" });
      return successResponse({ success: true });
    }

    if (action === "list_user_roles") {
      const { data: roles, error } = await supabaseAdmin.from("user_roles").select("*");
      if (error) throw error;
      return successResponse({ users: roles });
    }

    return errorResponse(400, "unhandled_action", `Action ${action} not implemented`);
  } catch (error) {
    console.error(`[admin-data] Error:`, error.message);
    return errorResponse(500, "server_error", error.message);
  }
});
