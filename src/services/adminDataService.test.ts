/**
 * Tests for adminDataService.ts
 * Covers: isAdminDataError, getErrorMessage, invokeAdminData, listUserRoles, getRoleAuditLog
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isAdminDataError,
  getErrorMessage,
  invokeAdminData,
  listUserRoles,
  getRoleAuditLog,
  type AdminDataError,
} from "./adminDataService";

// ── Mock the supabase client ──────────────────────────────────────────────────
// vi.mock is hoisted to the top of the file, so we must use vi.hoisted() to
// declare variables that the factory function closes over.
const { mockInvoke } = vi.hoisted(() => ({ mockInvoke: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}));

// ── isAdminDataError ──────────────────────────────────────────────────────────
describe("isAdminDataError", () => {
  it("returns true for a valid AdminDataError object", () => {
    const err: AdminDataError = { code: "some_code", message: "oops", status: 403 };
    expect(isAdminDataError(err)).toBe(true);
  });

  it("returns false when 'code' property is missing", () => {
    expect(isAdminDataError({ message: "oops", status: 403 })).toBe(false);
  });

  it("returns false when 'message' property is missing", () => {
    expect(isAdminDataError({ code: "err", status: 403 })).toBe(false);
  });

  it("returns false when 'status' property is missing", () => {
    expect(isAdminDataError({ code: "err", message: "oops" })).toBe(false);
  });

  it("returns false for null", () => {
    expect(isAdminDataError(null)).toBe(false);
  });

  it("returns false for a plain string", () => {
    expect(isAdminDataError("some error string")).toBe(false);
  });

  it("returns false for an Error instance (missing 'code' and 'status')", () => {
    expect(isAdminDataError(new Error("oops"))).toBe(false);
  });

  it("returns false for a number", () => {
    expect(isAdminDataError(42)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isAdminDataError(undefined)).toBe(false);
  });

  it("returns true even when property values are empty or zero", () => {
    expect(isAdminDataError({ code: "", message: "", status: 0 })).toBe(true);
  });
});

// ── getErrorMessage ───────────────────────────────────────────────────────────
describe("getErrorMessage", () => {
  it("returns message from AdminDataError", () => {
    const err: AdminDataError = { code: "forbidden", message: "Access denied", status: 403 };
    expect(getErrorMessage(err)).toBe("Access denied");
  });

  it("returns message from a native Error instance", () => {
    expect(getErrorMessage(new Error("network failure"))).toBe("network failure");
  });

  it("returns the string itself when error is a plain string", () => {
    expect(getErrorMessage("something went wrong")).toBe("something went wrong");
  });

  it("returns fallback message for an unknown object", () => {
    expect(getErrorMessage({ foo: "bar" })).toBe("An unexpected error occurred");
  });

  it("returns fallback message for null", () => {
    expect(getErrorMessage(null)).toBe("An unexpected error occurred");
  });

  it("returns fallback message for undefined", () => {
    expect(getErrorMessage(undefined)).toBe("An unexpected error occurred");
  });

  it("returns fallback message for a number", () => {
    expect(getErrorMessage(42)).toBe("An unexpected error occurred");
  });

  it("prefers AdminDataError message over Error fallback when object qualifies as both", () => {
    // An AdminDataError with all three required fields takes priority
    const hybrid = { code: "err", message: "admin msg", status: 500 };
    expect(getErrorMessage(hybrid)).toBe("admin msg");
  });

  it("returns empty string when AdminDataError message is empty string", () => {
    const err: AdminDataError = { code: "err", message: "", status: 500 };
    expect(getErrorMessage(err)).toBe("");
  });
});

// ── invokeAdminData ───────────────────────────────────────────────────────────
describe("invokeAdminData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls supabase.functions.invoke with correct function name and body", async () => {
    mockInvoke.mockResolvedValueOnce({ data: { data: { users: [] } }, error: null });

    await invokeAdminData("list_user_roles");

    expect(mockInvoke).toHaveBeenCalledOnce();
    expect(mockInvoke).toHaveBeenCalledWith("admin-data", {
      body: { action: "list_user_roles", payload: {} },
    });
  });

  it("passes payload through to the invoke call", async () => {
    mockInvoke.mockResolvedValueOnce({ data: { data: { entries: [] } }, error: null });

    await invokeAdminData("get_role_audit_log", { limit: 50 });

    expect(mockInvoke).toHaveBeenCalledWith("admin-data", {
      body: { action: "get_role_audit_log", payload: { limit: 50 } },
    });
  });

  it("returns data.data from the invoke response", async () => {
    const payload = { users: [{ id: "u1", role: "viewer" }] };
    mockInvoke.mockResolvedValueOnce({ data: { data: payload }, error: null });

    const result = await invokeAdminData("list_user_roles");
    expect(result).toEqual(payload);
  });

  it("throws an AdminDataError when supabase returns an error", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: "Edge function crashed", status: 500 },
    });

    await expect(invokeAdminData("list_user_roles")).rejects.toMatchObject({
      code: "invocation_error",
      message: "Edge function crashed",
      status: 500,
    });
  });

  it("falls back to default status 500 when error has no status field", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: "no status here" },
    });

    await expect(invokeAdminData("list_user_roles")).rejects.toMatchObject({
      code: "invocation_error",
      status: 500,
    });
  });

  it("uses default fallback message when error.message is empty", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: "", status: 503 },
    });

    await expect(invokeAdminData("list_user_roles")).rejects.toMatchObject({
      message: "Failed to contact admin-data",
    });
  });
});

// ── listUserRoles ─────────────────────────────────────────────────────────────
describe("listUserRoles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invokes admin-data with list_user_roles action and empty payload", async () => {
    const mockResponse = {
      users: [
        { id: "u1", user_id: "u1", email: "a@b.com", role: "operator" as const, last_sign_in: null, updated_at: null },
      ],
    };
    mockInvoke.mockResolvedValueOnce({ data: { data: mockResponse }, error: null });

    const result = await listUserRoles();

    expect(mockInvoke).toHaveBeenCalledWith("admin-data", {
      body: { action: "list_user_roles", payload: {} },
    });
    expect(result).toEqual(mockResponse);
  });

  it("propagates errors thrown by invokeAdminData", async () => {
    mockInvoke.mockResolvedValueOnce({ data: null, error: { message: "Unauthorized", status: 403 } });

    await expect(listUserRoles()).rejects.toMatchObject({ status: 403 });
  });
});

// ── getRoleAuditLog ───────────────────────────────────────────────────────────
describe("getRoleAuditLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invokes admin-data with get_role_audit_log and default limit of 100", async () => {
    const mockResponse = { entries: [] };
    mockInvoke.mockResolvedValueOnce({ data: { data: mockResponse }, error: null });

    const result = await getRoleAuditLog();

    expect(mockInvoke).toHaveBeenCalledWith("admin-data", {
      body: { action: "get_role_audit_log", payload: { limit: 100 } },
    });
    expect(result).toEqual(mockResponse);
  });

  it("passes a custom limit to the payload", async () => {
    mockInvoke.mockResolvedValueOnce({ data: { data: { entries: [] } }, error: null });

    await getRoleAuditLog(25);

    expect(mockInvoke).toHaveBeenCalledWith("admin-data", {
      body: { action: "get_role_audit_log", payload: { limit: 25 } },
    });
  });

  it("returns enriched audit log entries from the response", async () => {
    const entry = {
      id: "e1",
      target_user_id: "u1",
      target_email: "target@example.com",
      changed_by_user_id: "u2",
      changed_by_email: "changer@example.com",
      old_role: "operator",
      new_role: "super_admin" as const,
      action: "role_change",
      created_at: "2024-01-01T00:00:00Z",
    };
    mockInvoke.mockResolvedValueOnce({ data: { data: { entries: [entry] } }, error: null });

    const result = await getRoleAuditLog();
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toEqual(entry);
  });

  it("propagates errors thrown by invokeAdminData", async () => {
    mockInvoke.mockResolvedValueOnce({ data: null, error: { message: "Forbidden", status: 403 } });

    await expect(getRoleAuditLog()).rejects.toMatchObject({ status: 403 });
  });

  it("handles limit of 1 as boundary value", async () => {
    mockInvoke.mockResolvedValueOnce({ data: { data: { entries: [] } }, error: null });

    await getRoleAuditLog(1);

    expect(mockInvoke).toHaveBeenCalledWith("admin-data", {
      body: { action: "get_role_audit_log", payload: { limit: 1 } },
    });
  });
});