/**
 * verifiedAccess — 24-hour resume record for returning verified users.
 *
 * After a successful OTP verify + full report fetch, we store a record
 * so the same browser can re-open the same report without re-verifying.
 *
 * Record is scoped to a single scan_session_id. Different reports
 * require separate verification. Expires after 24 hours.
 */

const LS_KEY = "wm_verified_access";
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface VerifiedAccessRecord {
  scan_session_id: string;
  phone_e164: string;
  verified_at: string;   // ISO timestamp
  expires_at: string;    // ISO timestamp
}

/** Save a resume record after successful unlock. */
export function saveVerifiedAccess(scanSessionId: string, phoneE164: string): void {
  try {
    const now = new Date();
    const record: VerifiedAccessRecord = {
      scan_session_id: scanSessionId,
      phone_e164: phoneE164,
      verified_at: now.toISOString(),
      expires_at: new Date(now.getTime() + EXPIRY_MS).toISOString(),
    };
    localStorage.setItem(LS_KEY, JSON.stringify(record));
  } catch {
    // localStorage unavailable — silent fail
  }
}

/**
 * Read the resume record if it exists, is not expired, and matches
 * the given scanSessionId (if provided).
 *
 * If scanSessionId is null/undefined, returns any valid non-expired record
 * (used for initial page-load recovery).
 */
export function getVerifiedAccess(
  scanSessionId?: string | null
): VerifiedAccessRecord | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;

    const record: VerifiedAccessRecord = JSON.parse(raw);

    // Validate shape
    if (!record.scan_session_id || !record.phone_e164 || !record.expires_at) {
      clearVerifiedAccess();
      return null;
    }

    // Check expiry
    if (new Date(record.expires_at).getTime() < Date.now()) {
      clearVerifiedAccess();
      return null;
    }

    // If caller provided a scanSessionId, enforce match
    if (scanSessionId && record.scan_session_id !== scanSessionId) {
      return null;
    }

    return record;
  } catch {
    clearVerifiedAccess();
    return null;
  }
}

/** Clear the resume record. */
export function clearVerifiedAccess(): void {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    // silent
  }
}
