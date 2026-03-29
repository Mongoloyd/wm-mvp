/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Admin Data Service — Frontend SDK for admin-data Edge Function
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "operator" | "viewer";

export type AdminAction =
  | "fetch_leads"
  | "update_lead_status"
  | "fetch_opportunities"
  | "fetch_contractors"
  | "fetch_routes"
  | "fetch_billable"
  | "route_opportunity"
  | "mark_dead"
  | "fetch_voice_followups"
  | "trigger_voice_followup"
  | "manage_user_roles"
  | "list_user_roles";

/** Payload types synchronized with Backend v2.2 */
export interface AdminActionPayloads {
  fetch_leads: Record<string, never>;
  update_lead_status: { lead_id: string; status: string };
  fetch_opportunities: Record<string, never>;
  fetch_contractors: Record<string, never>;
  fetch_routes: { opportunity_id?: string };
  fetch_billable: Record<string, never>;
  route_opportunity: { opportunity_id: string; contractor_id: string; scan_session_id?: string };
  mark_dead: { opportunity_id: string; scan_session_id?: string };
  fetch_voice_followups: Record<string, never>;
  trigger_voice_followup: { scan_session_id: string; phone_e164: string; opportunity_id?: string };
  manage_user_roles: { target_user_id: string; new_role: AppRole };
  list_user_roles: Record<string, never>;
}

export interface AdminDataError {
  code: string;
  message: string;
  status: number;
}

/**
 * Core invoker for the admin-data Edge Function.
 */
export async function invokeAdminData<T extends AdminAction>(
  action: T,
  payload: AdminActionPayloads[T] = {} as AdminActionPayloads[T]
): Promise<any> {
  const { data, error } = await supabase.functions.invoke("admin-data", {
    body: { action, payload },
  });

  if (error) {
    const adminError: AdminDataError = {
      code: "invocation_error",
      message: error.message || "Failed to contact admin-data",
      status: error.status || 500,
    };
    console.error(`[adminDataService] ${action} failed:`, adminError);
    throw adminError;
  }

  // Backend v2.2 returns data wrapped in a { data: ... } object
  return data.data;
}

// ═══════════════════════════════════════════════════════════════════════════
// Convenience Wrappers (The "Buttons")
// ═══════════════════════════════════════════════════════════════════════════

export const fetchLeads = () => invokeAdminData("fetch_leads");

export const updateLeadStatus = (leadId: string, status: string) =>
  invokeAdminData("update_lead_status", { lead_id: leadId, status });

export const routeOpportunity = (oppId: string, contId: string, sessId?: string) =>
  invokeAdminData("route_opportunity", { 
    opportunity_id: oppId, 
    contractor_id: contId, 
    scan_session_id: sessId 
  });

export const markOpportunityDead = (oppId: string, sessId?: string) =>
  invokeAdminData("mark_dead", { opportunity_id: oppId, scan_session_id: sessId });

export const triggerVoiceAI = (sessId: string, phone: string, oppId?: string) =>
  invokeAdminData("trigger_voice_followup", { 
    scan_session_id: sessId, 
    phone_e164: phone, 
    opportunity_id: oppId 
  });

export const listUserRoles = () => invokeAdminData("list_user_roles");

export const manageUserRole = (targetId: string, role: AppRole) =>
  invokeAdminData("manage_user_roles", { target_user_id: targetId, new_role: role });
