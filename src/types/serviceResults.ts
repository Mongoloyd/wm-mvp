/**
 * Shared service-level result types.
 *
 * These decouple hooks from raw Supabase response shapes so the
 * transport layer can change without touching UI state logic.
 */

// ── Generic envelope ────────────────────────────────────────────────────────

export interface ServiceOk<T> {
  ok: true;
  data: T;
}

export interface ServiceErr {
  ok: false;
  code: string;
  message: string;
}

export type ServiceResult<T> = ServiceOk<T> | ServiceErr;

// ── Report service ──────────────────────────────────────────────────────────

export interface RawPreviewRow {
  grade: string;
  flag_count: number;
  flag_red_count: number;
  flag_amber_count: number;
  proof_of_read: Record<string, unknown> | null;
  preview_json: Record<string, unknown> | null;
  confidence_score: number | null;
  document_type: string | null;
  rubric_version: string | null;
}

export interface RawFullRow {
  grade: string;
  flags: unknown;
  full_json: Record<string, unknown> | null;
  proof_of_read: Record<string, unknown> | null;
  preview_json: Record<string, unknown> | null;
  confidence_score: number | null;
  document_type: string | null;
  rubric_version: string | null;
}

export interface ScanStatusRow {
  id: string;
  status: string;
}

// ── Phone verification service ──────────────────────────────────────────────

export interface SendOtpResponse {
  success: boolean;
}

export interface VerifyOtpResponse {
  verified: boolean;
  /** Server-canonical phone in E.164, returned on success */
  phone_e164?: string;
}

export type OtpErrorCode =
  | "rate_limit"
  | "blocked_prefix"
  | "expired_session"
  | "invalid_code"
  | "network"
  | "generic";
