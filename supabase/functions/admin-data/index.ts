import { corsHeaders, errorResponse, successResponse, validateAdminRequestWithRole, type AppRole } from "../_shared/adminAuth.ts";

/**
 * admin-data v2.2 (Final Unified Version)
 * Restores event_logs tracking and all original contractor/voice logic.
 */

type ActionName = 
  | "fetch_leads" | "update_lead_status" | "update_lead_deal_status"
  | "fetch_opportunities" | "fetch_contractors" | "fetch_routes" | "fetch_billable"
  | "route_opportunity" | "mark_dead"
  | "fetch_voice_followups" | "trigger_voice_followup"
  | "manage_user_roles" | "list_user_roles" | "get_role_audit_log"
  | "fetch_lead_events" | "fetch_webhook_deliveries"
  | "fetch_lead_analysis";

const ACTION_ROLES: Record<ActionName, AppRole[]> = {
  fetch_leads: ["super_admin", "operator", "viewer"],
  update_lead_status: ["super_admin", "operator"],
  update_lead_deal_status: ["super_admin", "operator"],
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
  get_role_audit_log: ["super_admin"],
  fetch_lead_events: ["super_admin", "operator", "viewer"],
  fetch_webhook_deliveries: ["super_admin", "operator", "viewer"],
  fetch_lead_analysis: ["super_admin", "operator", "viewer"],
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
      const { data, error } = await supabaseAdmin
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return successResponse({ data: data });
    }

    if (action === "fetch_opportunities") {
      const { data, error } = await supabaseAdmin.from("contractor_opportunities").select("*").order("priority_score", { ascending: false });
      if (error) throw error;
      return successResponse({ data: data });
    }

    if (action === "fetch_contractors") {
      const { data, error } = await supabaseAdmin.from("contractors").select("*").eq("status", "active");
      if (error) throw error;
      return successResponse({ data: data });
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
      return successResponse({ intros, outcomes, data: { intros, outcomes } });
    }

    if (action === "fetch_voice_followups") {
      const { data, error } = await supabaseAdmin.from("voice_followups").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return successResponse({ data: data });
    }

    // ─── WRITE ACTIONS ─────────────────────────────────────────────

    if (action === "update_lead_status") {
      const { lead_id, status } = payload;
      const { error } = await supabaseAdmin.from("leads").update({ status, updated_at: now }).eq("id", lead_id);
      if (error) throw error;
      return successResponse({ data: { success: true } });
    }

    if (action === "update_lead_deal_status") {
      const { lead_id, deal_status } = payload;
      if (!lead_id || !deal_status) return errorResponse(400, "missing_param", "lead_id and deal_status are required");
      const { error } = await supabaseAdmin.from("leads").update({ deal_status, updated_at: now }).eq("id", lead_id);
      if (error) throw error;
      await supabaseAdmin.from("lead_events").insert({
        lead_id, event_name: "deal_status_changed", event_source: "admin_crm",
        metadata: { deal_status, changed_by: userId, timestamp: now },
      });
      return successResponse({ data: { success: true } });
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

      return successResponse({ data: { success: true } });
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

      return successResponse({ data: { success: true } });
    }

    if (action === "trigger_voice_followup") {
      const { scan_session_id, phone_e164, opportunity_id } = payload;
      const { data, error } = await supabaseAdmin.functions.invoke("voice-followup", {
        body: { scan_session_id, phone_e164, opportunity_id, call_intent: "manual_admin_trigger" },
      });
      if (error) throw error;
      return successResponse({ data: { success: true, invokeResult: data } });

    }

    if (action === "manage_user_roles") {
      const { target_user_id, new_role } = payload;
      if (target_user_id === userId && new_role !== "super_admin") throw new Error("Self-demotion blocked.");
      const { error } = await supabaseAdmin.from("user_roles").upsert({ id: target_user_id, role: new_role, updated_at: now });
      if (error) throw error;
      await supabaseAdmin.from("user_role_audit_log").insert({ target_user_id, changed_by_user_id: userId, new_role, action: "change" });
      return successResponse({ data: { success: true } });
    }

    if (action === "list_user_roles") {
      const { data: roles, error } = await supabaseAdmin.from("user_roles").select("*");
      if (error) throw error;

      // Fetch auth user data for only the IDs present in user_roles (avoids pagination limits)
      const roleRows = roles ?? [];
      const userIds: string[] = roleRows.map((r: { id: string }) => r.id);

      const authInfoMap = new Map<string, { email: string; last_sign_in: string | null }>();
      await Promise.all(
        userIds.map(async (uid) => {
          const { data: authData, error: uidErr } = await supabaseAdmin.auth.admin.getUserById(uid);
          if (!uidErr && authData?.user) {
            authInfoMap.set(uid, {
              email: authData.user.email ?? "",
              last_sign_in: authData.user.last_sign_in_at ?? null,
            });
          }
        })
      );

      const enriched = roleRows.map((r: { id: string; role: string; updated_at?: string }) => ({
        id: r.id,
        user_id: r.id,
        role: r.role,
        updated_at: r.updated_at ?? null,
        email: authInfoMap.get(r.id)?.email ?? "",
        last_sign_in: authInfoMap.get(r.id)?.last_sign_in ?? null,
      }));

      return successResponse({ data: { users: enriched } });
    }

    if (action === "get_role_audit_log") {
      // Clamp limit to a safe range: min 1, max 500, default 100
      const rawLimit = payload?.limit;
      const limit = Math.min(500, Math.max(1, Number.isInteger(rawLimit) ? rawLimit : 100));

      const { data: entries, error } = await supabaseAdmin
        .from("user_role_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;

      const auditRows = entries ?? [];

      // Collect all unique user IDs referenced in the audit log
      const involvedIds = new Set<string>();
      for (const e of auditRows) {
        involvedIds.add(e.target_user_id);
        involvedIds.add(e.changed_by_user_id);
      }

      // Fetch email for each involved user ID individually (avoids listUsers pagination cap)
      const emailMap = new Map<string, string>();
      await Promise.all(
        Array.from(involvedIds).map(async (uid) => {
          const { data: authData, error: uidErr } = await supabaseAdmin.auth.admin.getUserById(uid);
          if (!uidErr && authData?.user?.email) {
            emailMap.set(uid, authData.user.email);
          }
        })
      );

      const enriched = auditRows.map((e: {
        id: string;
        target_user_id: string;
        changed_by_user_id: string;
        old_role?: string | null;
        new_role: string;
        action: string;
        created_at: string;
      }) => ({
        ...e,
        target_email: emailMap.get(e.target_user_id) ?? e.target_user_id,
        changed_by_email: emailMap.get(e.changed_by_user_id) ?? e.changed_by_user_id,
      }));

      return successResponse({ data: { entries: enriched } });
    }

    // ─── CRM: LEAD EVENTS ─────────────────────────────────────────────

    if (action === "fetch_lead_events") {
      const { lead_id, limit: rawLimit } = payload;
      if (!lead_id) return errorResponse(400, "missing_param", "lead_id is required");
      const limit = Math.min(200, Math.max(1, Number.isInteger(rawLimit) ? rawLimit : 50));
      const { data, error } = await supabaseAdmin
        .from("lead_events")
        .select("*")
        .eq("lead_id", lead_id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return successResponse({ data: data });
    }

    // ─── CRM: WEBHOOK DELIVERIES ───────────────────────────────────────

    if (action === "fetch_webhook_deliveries") {
      const { status: filterStatus, limit: rawLimit } = payload;
      const limit = Math.min(500, Math.max(1, Number.isInteger(rawLimit) ? rawLimit : 200));
      let query = supabaseAdmin
        .from("webhook_deliveries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (filterStatus) query = query.eq("status", filterStatus);
      const { data, error } = await query;
      if (error) throw error;
      return successResponse({ data: data });
    }

    return errorResponse(400, "unhandled_action", `Action ${action} not implemented`);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[admin-data] Error:`, errMsg);
    return errorResponse(500, "server_error", errMsg);
  }
});
