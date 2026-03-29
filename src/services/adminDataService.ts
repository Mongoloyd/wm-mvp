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
  | "list_user_roles"
  | "get_role_audit_log";

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
  get_role_audit_log: { limit?: number };
}

/** Response shape types for each action */
export interface AdminActionResponses {
  list_user_roles: {
    users: Array<{
      id: string;
      user_id: string;
      email: string;
      role: AppRole;
      last_sign_in: string | null;
      updated_at: string | null;
    }>;
  };
  get_role_audit_log: {
    entries: Array<{
      id: string;
      target_user_id: string;
      target_email: string;
      changed_by_user_id: string;
      changed_by_email: string;
      old_role: string | null;
      new_role: AppRole;
      action: string;
      created_at: string;
    }>;
  };
}

export interface AdminDataError {
  code: string;
  message: string;
  status: number;
}

/** Type guard: checks if an unknown error is an AdminDataError */
export function isAdminDataError(err: unknown): err is AdminDataError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    "message" in err &&
    "status" in err
  );
}

/** Extract a human-readable message from any caught error */
export function getErrorMessage(err: unknown): string {
  if (isAdminDataError(err)) return err.message;
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "An unexpected error occurred";
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

export const listUserRoles = (): Promise<AdminActionResponses["list_user_roles"]> =>
  invokeAdminData("list_user_roles");

export const manageUserRole = (targetId: string, role: AppRole) =>
  invokeAdminData("manage_user_roles", { target_user_id: targetId, new_role: role });

export const getRoleAuditLog = (limit = 100): Promise<AdminActionResponses["get_role_audit_log"]> =>
  invokeAdminData("get_role_audit_log", { limit });

