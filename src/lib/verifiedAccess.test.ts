import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveVerifiedAccess, getVerifiedAccess, clearVerifiedAccess } from "./verifiedAccess";

const LS_KEY = "wm_verified_access";

describe("verifiedAccess", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("saveVerifiedAccess", () => {
    it("stores a record with correct shape", () => {
      saveVerifiedAccess("sess-1", "+15551234567");
      const raw = localStorage.getItem(LS_KEY);
      expect(raw).toBeTruthy();
      const record = JSON.parse(raw!);
      expect(record.scan_session_id).toBe("sess-1");
      expect(record.phone_e164).toBe("+15551234567");
      expect(record.verified_at).toBeTruthy();
      expect(record.expires_at).toBeTruthy();
    });

    it("sets expiry ~24 hours in the future", () => {
      const before = Date.now();
      saveVerifiedAccess("sess-1", "+15551234567");
      const record = JSON.parse(localStorage.getItem(LS_KEY)!);
      const expiresAt = new Date(record.expires_at).getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      expect(expiresAt).toBeGreaterThanOrEqual(before + twentyFourHours - 1000);
      expect(expiresAt).toBeLessThanOrEqual(before + twentyFourHours + 1000);
    });
  });

  describe("getVerifiedAccess", () => {
    it("returns null when nothing is stored", () => {
      expect(getVerifiedAccess()).toBeNull();
    });

    it("returns record when valid and no sessionId filter", () => {
      saveVerifiedAccess("sess-1", "+15551234567");
      const record = getVerifiedAccess();
      expect(record).toBeTruthy();
      expect(record!.scan_session_id).toBe("sess-1");
    });

    it("returns record when sessionId matches", () => {
      saveVerifiedAccess("sess-1", "+15551234567");
      expect(getVerifiedAccess("sess-1")).toBeTruthy();
    });

    it("returns null when sessionId does not match", () => {
      saveVerifiedAccess("sess-1", "+15551234567");
      expect(getVerifiedAccess("sess-2")).toBeNull();
    });

    it("returns null and clears when expired", () => {
      saveVerifiedAccess("sess-1", "+15551234567");
      // Manually set expires_at to the past
      const record = JSON.parse(localStorage.getItem(LS_KEY)!);
      record.expires_at = new Date(Date.now() - 1000).toISOString();
      localStorage.setItem(LS_KEY, JSON.stringify(record));
      expect(getVerifiedAccess()).toBeNull();
      expect(localStorage.getItem(LS_KEY)).toBeNull();
    });

    it("returns null and clears on malformed JSON", () => {
      localStorage.setItem(LS_KEY, "not-json");
      expect(getVerifiedAccess()).toBeNull();
      expect(localStorage.getItem(LS_KEY)).toBeNull();
    });

    it("returns null and clears when missing required fields", () => {
      localStorage.setItem(LS_KEY, JSON.stringify({ scan_session_id: "x" }));
      expect(getVerifiedAccess()).toBeNull();
    });
  });

  describe("clearVerifiedAccess", () => {
    it("removes the stored record", () => {
      saveVerifiedAccess("sess-1", "+15551234567");
      clearVerifiedAccess();
      expect(localStorage.getItem(LS_KEY)).toBeNull();
    });
  });
});
