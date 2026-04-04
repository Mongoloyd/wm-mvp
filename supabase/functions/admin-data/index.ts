import { corsHeaders, errorResponse, successResponse, validateAdminRequestWithRole, type AppRole } from "../_shared/adminAuth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * admin-data v2.3
 * Added: fetch_needs_review, rescan_lead, update_lead_manual_entry
 */

type ActionName = 
  | "fetch_leads" | "update_lead_status" | "update_lead_deal_status"
  | "fetch_opportunities" | "fetch_contractors" | "fetch_routes" | "fetch_billable"
  | "route_opportunity" | "mark_dead"
  | "fetch_voice_followups" | "fetch_lead_voice_followups" | "trigger_voice_followup"
  | "manage_user_roles" | "list_user_roles" | "get_role_audit_log"
  | "fetch_lead_events" | "fetch_webhook_deliveries"
  | "fetch_lead_analysis"
  | "fetch_needs_review" | "rescan_lead" | "update_lead_manual_entry";

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
  fetch_lead_voice_followups: ["super_admin", "operator", "viewer"],
  trigger_voice_followup: ["super_admin", "operator"],
  manage_user_roles: ["super_admin"],
  list_user_roles: ["super_admin"],
  get_role_audit_log: ["super_admin"],
  fetch_lead_events: ["super_admin", "operator", "viewer"],
  fetch_webhook_deliveries: ["super_admin", "operator", "viewer"],
  fetch_lead_analysis: ["super_admin", "operator", "viewer"],
  fetch_needs_review: ["super_admin", "operator", "viewer"],
  rescan_lead: ["super_admin", "operator"],
  update_lead_manual_entry: ["super_admin", "operator"],
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

    if (action === "fetch_lead_voice_followups") {
      const { lead_id } = payload;
      if (!lead_id) return errorResponse(400, "missing_param", "lead_id is required");
      const { data, error } = await supabaseAdmin
        .from("voice_followups")
        .select(`
          id, lead_id, call_intent, status,
          call_outcome, failure_reason,
          duration_seconds, recording_url,
          transcript_url, transcript_text,
          summary, booking_intent_detected,
          appointment_booked, scan_session_id,
          phone_e164, queued_at, started_at,
          answered_at, completed_at, created_at
        `)
        .eq("lead_id", lead_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return successResponse({ data: data });
    }

    // ─── NEEDS REVIEW ──────────────────────────────────────────────

    if (action === "fetch_needs_review") {
      // Query A: Leads with no analysis, not manually reviewed
      const { data: noAnalysis } = await supabaseAdmin
        .from("leads")
        .select(`
          id, first_name, last_name, city, created_at,
          latest_analysis_id, latest_scan_session_id,
          grade, flag_count
        `)
        .is("latest_analysis_id", null)
        .or("manually_reviewed.is.null,manually_reviewed.eq.false")
        .order("created_at", { ascending: false });

      const taggedNoAnalysis = (noAnalysis ?? []).map((l: any) => ({
        ...l,
        review_reason: "no_scan",
        analysis_status: null,
        confidence_score: null,
        analysis_error: null,
        full_json: null,
        quote_image_url: null,
      }));

      // Query B: Analyses that failed or have low confidence
      const { data: failedAnalyses } = await supabaseAdmin
        .from("analyses")
        .select("id, analysis_status, confidence_score, full_json, lead_id, scan_session_id")
        .or("analysis_status.eq.invalid_document,analysis_status.eq.needs_better_upload,confidence_score.lt.0.6")
        .not("lead_id", "is", null)
        .order("created_at", { ascending: false });

      const failedLeadIds = (failedAnalyses ?? []).map((a: any) => a.lead_id).filter(Boolean);

      let failedLeads: any[] = [];
      if (failedLeadIds.length > 0) {
        const { data: leads } = await supabaseAdmin
          .from("leads")
          .select(`
            id, first_name, last_name, city, created_at,
            latest_analysis_id, latest_scan_session_id,
            grade, flag_count, manually_reviewed
          `)
          .in("id", failedLeadIds)
          .or("manually_reviewed.is.null,manually_reviewed.eq.false");

        failedLeads = (leads ?? []).map((lead: any) => {
          const analysis = (failedAnalyses ?? []).find((a: any) => a.lead_id === lead.id);
          const isFailed = analysis?.analysis_status === "invalid_document" || analysis?.analysis_status === "needs_better_upload";
          return {
            ...lead,
            review_reason: isFailed ? "parse_failed" : "low_confidence",
            analysis_status: analysis?.analysis_status ?? null,
            confidence_score: analysis?.confidence_score ?? null,
            analysis_error: (analysis?.full_json as any)?.error ?? null,
            full_json: analysis?.full_json ?? null,
            quote_image_url: null,
          };
        });
      }

      // Merge + deduplicate
      const allLeadIds = new Set<string>();
      const merged = [...taggedNoAnalysis, ...failedLeads]
        .filter((lead: any) => {
          if (allLeadIds.has(lead.id)) return false;
          allLeadIds.add(lead.id);
          return true;
        })
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Generate signed URLs for quote images
      // Need a storage client with service role
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const storageClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      // Collect scan_session_ids that need image URLs
      const sessionIds = merged
        .map((l: any) => l.latest_scan_session_id)
        .filter(Boolean);

      if (sessionIds.length > 0) {
        // Fetch scan_sessions to get quote_file_ids
        const { data: sessions } = await supabaseAdmin
          .from("scan_sessions")
          .select("id, quote_file_id")
          .in("id", sessionIds);

        const fileIds = (sessions ?? [])
          .map((s: any) => s.quote_file_id)
          .filter(Boolean);

        let fileMap: Record<string, string> = {};
        if (fileIds.length > 0) {
          const { data: files } = await supabaseAdmin
            .from("quote_files")
            .select("id, storage_path")
            .in("id", fileIds);

          for (const f of files ?? []) {
            fileMap[f.id] = f.storage_path;
          }
        }

        // Build session_id → storage_path map
        const sessionToPath: Record<string, string> = {};
        for (const s of sessions ?? []) {
          if (s.quote_file_id && fileMap[s.quote_file_id]) {
            sessionToPath[s.id] = fileMap[s.quote_file_id];
          }
        }

        // Generate signed URLs
        for (const lead of merged) {
          const path = sessionToPath[lead.latest_scan_session_id];
          if (path) {
            const { data: signedData } = await storageClient.storage
              .from("quotes")
              .createSignedUrl(path, 3600);
            if (signedData?.signedUrl) {
              lead.quote_image_url = signedData.signedUrl;
            }
          }
        }
      }

      return successResponse({ data: merged });
    }

    // ─── RESCAN LEAD ───────────────────────────────────────────────

    if (action === "rescan_lead") {
      const { lead_id } = payload;
      if (!lead_id) return errorResponse(400, "missing_param", "lead_id required");

      // Step 1: Get latest_scan_session_id
      const { data: lead, error: leadErr } = await supabaseAdmin
        .from("leads")
        .select("latest_scan_session_id")
        .eq("id", lead_id)
        .single();

      if (leadErr || !lead?.latest_scan_session_id) {
        return errorResponse(400, "no_session", "No scan session found for this lead");
      }

      const ssId = lead.latest_scan_session_id;

      // Step 2: Reset scan_sessions.status to 'idle' (clears idempotency guard)
      await supabaseAdmin
        .from("scan_sessions")
        .update({ status: "idle" })
        .eq("id", ssId);

      // Step 3: Delete existing analyses for this scan session
      await supabaseAdmin
        .from("analyses")
        .delete()
        .eq("scan_session_id", ssId);

      // Step 4: Re-invoke scan-quote with { scan_session_id }
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      const scanResp = await fetch(`${supabaseUrl}/functions/v1/scan-quote`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scan_session_id: ssId }),
      });

      if (scanResp.ok) {
        return successResponse({ data: { success: true } });
      } else {
        const err = await scanResp.json().catch(() => ({}));
        return errorResponse(500, "rescan_failed", err.error ?? `scan-quote returned ${scanResp.status}`);
      }
    }

    // ─── UPDATE LEAD MANUAL ENTRY ──────────────────────────────────

    if (action === "update_lead_manual_entry") {
      const { lead_id, manual_entry_data } = payload;
      if (!lead_id || !manual_entry_data) {
        return errorResponse(400, "missing_param", "lead_id and manual_entry_data required");
      }

      const { error } = await supabaseAdmin
        .from("leads")
        .update({
          manually_reviewed: true,
          manual_entry_data: manual_entry_data,
          updated_at: now,
        })
        .eq("id", lead_id);

      if (error) throw error;
      return successResponse({ data: { success: true } });
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

    // ─── CRM: FETCH LEAD ANALYSIS ────────────────────────────────────────

    if (action === "fetch_lead_analysis") {
      const { analysis_id } = payload;
      if (!analysis_id) return errorResponse(400, "missing_param", "analysis_id is required");
      const { data, error } = await supabaseAdmin
        .from("analyses")
        .select("grade, dollar_delta, confidence_score, flags, full_json")
        .eq("id", analysis_id)
        .maybeSingle();
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
