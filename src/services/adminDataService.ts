/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ADMIN DATA SERVICE — Frontend invoker for the admin-data Edge Function
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * FIX APPLIED: invokeAdminData now explicitly passes the user's session
 * access_token in the Authorization header. Without this, supabase.functions
 * .invoke() sends the anon key by default (which has no `sub` claim),
 * causing adminAuth.ts to reject every request with a 401.
 *
 * Root cause: supabase.functions.invoke() with verify_jwt: false on the
 * edge function falls back to the anon key as the Bearer token.
 * The backend's adminAuth.ts calls getUser(token) on that anon key,
 * Supabase Auth says "missing sub claim", and returns 403/bad_jwt.
 */

import { supabase } from "@/integrations/supabase/client";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export type AppRole = "super_admin" | "operator" | "viewer";

export interface AdminDataError {
  code: string;
  message: string;
  status: number;
}

/**
 * All actions supported by the admin-data edge function (v2.2).
 * Must stay in sync with ACTION_ROLES in admin-data/index.ts.
 */
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
  | "get_role_audit_log"
  | "fetch_lead_events"
  | "fetch_webhook_deliveries";

/**
 * Payload shapes for each admin action.
 * Extend as new actions are added to the edge function.
 */
export interface AdminActionPayloads {
  fetch_leads: Record<string, never>;
  update_lead_status: { lead_id: string; status: string };
  fetch_opportunities: Record<string, never>;
  fetch_contractors: Record<string, never>;
  fetch_routes: { opportunity_id?: string };
  fetch_billable: Record<string, never>;
  route_opportunity: {
    opportunity_id: string;
    contractor_id: string;
    scan_session_id?: string;
  };
  mark_dead: { opportunity_id: string; scan_session_id?: string };
  fetch_voice_followups: Record<string, never>;
  trigger_voice_followup: {
    scan_session_id: string;
    phone_e164: string;
    opportunity_id?: string;
  };
  manage_user_roles: { target_user_id: string; new_role: AppRole };
  list_user_roles: Record<string, never>;
  get_role_audit_log: { limit?: number };
  fetch_lead_events: { lead_id: string; limit?: number };
  fetch_webhook_deliveries: { status?: string; limit?: number };
}

// ═══════════════════════════════════════════════════════════════════════════
// Response types (from admin-data edge function responses)
// ═══════════════════════════════════════════════════════════════════════════

export interface UserRoleEntry {
  id: string;
  user_id: string;
  email: string;
  role: AppRole;
  last_sign_in: string | null;
  updated_at: string | null;
}

export interface RoleAuditLogEntry {
  id: string;
  target_user_id: string;
  target_email: string;
  changed_by_user_id: string;
  changed_by_email: string;
  old_role?: string | null;
  new_role: AppRole;
  action: string;
  created_at: string;
}

export interface ListUserRolesResponse {
  users: UserRoleEntry[];
}

export interface RoleAuditLogResponse {
  entries: RoleAuditLogEntry[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Error Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Type guard: checks if an unknown value is an AdminDataError.
 */
export function isAdminDataError(error: unknown): error is AdminDataError {
  if (error === null || error === undefined || typeof error !== "object") {
    return false;
  }
  const obj = error as Record<string, unknown>;
  return "code" in obj && "message" in obj && "status" in obj;
}

/**
 * Extract a human-readable message from any error shape.
 */
export function getErrorMessage(error: unknown): string {
  if (isAdminDataError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}

// ═══════════════════════════════════════════════════════════════════════════
// Core Invoker
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Core invoker for the admin-data Edge Function.
 *
 * ⚠️  AUTH FIX: Explicitly passes session.access_token in the
 *     Authorization header. Without this override, supabase.functions
 *     .invoke() sends the anon key (which has no `sub` claim) and
 *     adminAuth.ts rejects it as bad_jwt / missing sub claim.
 */
export async function invokeAdminData<T extends AdminAction>(
  action: T,
  payload: AdminActionPayloads[T] = {} as AdminActionPayloads[T],
): Promise<any> {
  // 1. Grab the current user's session token
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  // 2. If there's no session, throw a 401 early before hitting the backend
  if (sessionError || !session?.access_token) {
    const authError: AdminDataError = {
      code: "auth_error",
      message: "User is not authenticated or session has expired.",
      status: 401,
    };
    console.error(`[adminDataService] ${action} failed: No active session.`, authError);
    throw authError;
  }

  // 3. Explicitly attach the session token to the request headers
  const { data, error } = await supabase.functions.invoke("admin-data", {
    body: { action, payload },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    const adminError: AdminDataError = {
      code: "invocation_error",
      message: error.message || "Failed to contact admin-data",
      status: (error as any).status || 500,
    };
    console.error(`[adminDataService] ${action} failed:`, adminError);
    throw adminError;
  }

  // Backend v2.2 returns data wrapped in a { data: ... } object
  return data.data;
}

// ═══════════════════════════════════════════════════════════════════════════
// Convenience Wrappers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * List all user roles (super_admin only).
 */
export async function listUserRoles(): Promise<ListUserRolesResponse> {
  return invokeAdminData("list_user_roles");
}

/**
 * Assign or change a user's role (super_admin only).
 * This is the function AdminSettings.tsx imports as `manageUserRole`.
 */
export async function manageUserRole(targetUserId: string, newRole: AppRole): Promise<{ success: boolean }> {
  return invokeAdminData("manage_user_roles", {
    target_user_id: targetUserId,
    new_role: newRole,
  });
}

/**
 * Get the role audit log with optional limit (super_admin only).
 */
export async function getRoleAuditLog(limit: number = 100): Promise<RoleAuditLogResponse> {
  return invokeAdminData("get_role_audit_log", { limit });
}

/**
 * Update lead status (operator+).
 */
export async function updateLeadStatus(leadId: string, status: string): Promise<{ success: boolean }> {
  return invokeAdminData("update_lead_status", { lead_id: leadId, status });
}

/**
 * Fetch lead events for a specific lead (timeline view).
 */
export async function fetchLeadEvents(leadId: string, limit = 50): Promise<any[]> {
  return invokeAdminData("fetch_lead_events", { lead_id: leadId, limit });
}

/**
 * Fetch webhook deliveries, optionally filtered by status.
 */
export async function fetchWebhookDeliveries(status?: string, limit = 200): Promise<any[]> {
  return invokeAdminData("fetch_webhook_deliveries", { status, limit } as any);
}

/**
 * Response type map for admin actions.
 */
export type AdminActionResponses = {
  [K in AdminAction]: any;
};
