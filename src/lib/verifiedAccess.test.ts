import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  saveVerifiedAccess,
  getVerifiedAccess,
  clearVerifiedAccess,
} from "./verifiedAccess";

const LS_KEY = "wm_verified_access";
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

// ── saveVerifiedAccess ────────────────────────────────────────────────────────

describe("saveVerifiedAccess", () => {
  it("stores a record with the correct shape and a 24-hour expiry", () => {
    const fixedNow = new Date("2024-03-15T10:00:00.000Z");
    vi.setSystemTime(fixedNow);

    saveVerifiedAccess("session-abc", "+13055551234");

    const raw = localStorage.getItem(LS_KEY);
    expect(raw).not.toBeNull();

    const record = JSON.parse(raw!);
    expect(record.scan_session_id).toBe("session-abc");
    expect(record.phone_e164).toBe("+13055551234");
    expect(record.verified_at).toBe(fixedNow.toISOString());

    const expectedExpiry = new Date(fixedNow.getTime() + TWENTY_FOUR_HOURS_MS);
    expect(record.expires_at).toBe(expectedExpiry.toISOString());
  });
});

// ── getVerifiedAccess ─────────────────────────────────────────────────────────

describe("getVerifiedAccess", () => {
  it("returns a valid record for a matching session before expiry", () => {
    vi.setSystemTime(new Date("2024-03-15T10:00:00.000Z"));
    saveVerifiedAccess("session-abc", "+13055551234");

    const result = getVerifiedAccess("session-abc");

    expect(result).not.toBeNull();
    expect(result!.scan_session_id).toBe("session-abc");
    expect(result!.phone_e164).toBe("+13055551234");
  });

  it("returns null and removes the LS key when the record is expired", () => {
    vi.setSystemTime(new Date("2024-03-15T10:00:00.000Z"));
    saveVerifiedAccess("session-abc", "+13055551234");

    // Advance past the 24-hour expiry window
    vi.advanceTimersByTime(TWENTY_FOUR_HOURS_MS + 1);

    const result = getVerifiedAccess("session-abc");

    expect(result).toBeNull();
    expect(localStorage.getItem(LS_KEY)).toBeNull();
  });

  it("returns null but preserves the LS key when session ID does not match", () => {
    vi.setSystemTime(new Date("2024-03-15T10:00:00.000Z"));
    saveVerifiedAccess("session-abc", "+13055551234");

    const result = getVerifiedAccess("session-xyz");

    expect(result).toBeNull();
    // Record is preserved — a mismatch is not an error, just not this session
    expect(localStorage.getItem(LS_KEY)).not.toBeNull();
  });

  it("returns null and removes the LS key for malformed JSON", () => {
    localStorage.setItem(LS_KEY, "not-valid-json{{{");

    const result = getVerifiedAccess();

    expect(result).toBeNull();
    expect(localStorage.getItem(LS_KEY)).toBeNull();
  });

  it("returns the record when sessionId is null (initial page-load recovery)", () => {
    vi.setSystemTime(new Date("2024-03-15T10:00:00.000Z"));
    saveVerifiedAccess("session-abc", "+13055551234");

    const result = getVerifiedAccess(null);

    expect(result).not.toBeNull();
    expect(result!.scan_session_id).toBe("session-abc");
  });

  it("returns the record when called with no argument (undefined sessionId)", () => {
    vi.setSystemTime(new Date("2024-03-15T10:00:00.000Z"));
    saveVerifiedAccess("session-abc", "+13055551234");

    const result = getVerifiedAccess();

    expect(result).not.toBeNull();
    expect(result!.phone_e164).toBe("+13055551234");
  });

  it("returns null and removes the LS key when required shape fields are missing", () => {
    // Only scan_session_id present — phone_e164 and expires_at are absent
    localStorage.setItem(LS_KEY, JSON.stringify({ scan_session_id: "session-abc" }));

    const result = getVerifiedAccess();

    expect(result).toBeNull();
    expect(localStorage.getItem(LS_KEY)).toBeNull();
  });
});

// ── clearVerifiedAccess ───────────────────────────────────────────────────────

describe("clearVerifiedAccess", () => {
  it("removes the localStorage key", () => {
    vi.setSystemTime(new Date("2024-03-15T10:00:00.000Z"));
    saveVerifiedAccess("session-abc", "+13055551234");
    expect(localStorage.getItem(LS_KEY)).not.toBeNull();

    clearVerifiedAccess();

    expect(localStorage.getItem(LS_KEY)).toBeNull();
  });

  it("is safe to call when the key does not exist (idempotent)", () => {
    expect(localStorage.getItem(LS_KEY)).toBeNull();
    expect(() => clearVerifiedAccess()).not.toThrow();
    expect(localStorage.getItem(LS_KEY)).toBeNull();
  });
});
