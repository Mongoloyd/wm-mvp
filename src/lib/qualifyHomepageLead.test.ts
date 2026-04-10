import { describe, it, expect, vi, beforeEach } from "vitest";
import { qualifyHomepageLead } from "./qualifyHomepageLead";

const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}));

const baseRequest = {
  name: "Jane Homeowner",
  email: "jane@example.com",
  phone: "3055551234",
  source: "arbitrage_engine",
  context: { module: "test" },
};

describe("qualifyHomepageLead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("success path", () => {
    it("returns a qualified response when the function succeeds", async () => {
      mockInvoke.mockResolvedValue({
        data: {
          success: true,
          lead_id: "lead-abc",
          qualified: true,
          can_run_ai: true,
          phone_e164: "+13055551234",
          phone_line_type: "mobile",
          reason: null,
        },
        error: null,
      });

      const result = await qualifyHomepageLead(baseRequest);

      expect(result.success).toBe(true);
      expect(result.lead_id).toBe("lead-abc");
      expect(result.qualified).toBe(true);
      expect(result.can_run_ai).toBe(true);
      expect(result.phone_e164).toBe("+13055551234");
      expect(result.phone_line_type).toBe("mobile");
      expect(result.reason).toBeNull();
    });

    it("returns a disqualified response when qualified=false", async () => {
      mockInvoke.mockResolvedValue({
        data: {
          success: true,
          lead_id: "lead-xyz",
          qualified: false,
          can_run_ai: false,
          phone_e164: "+13055551234",
          phone_line_type: "voip",
          reason: "Phone line type 'voip' is not eligible.",
        },
        error: null,
      });

      const result = await qualifyHomepageLead(baseRequest);

      expect(result.success).toBe(true);
      expect(result.qualified).toBe(false);
      expect(result.can_run_ai).toBe(false);
      expect(result.reason).toBe("Phone line type 'voip' is not eligible.");
    });

    it("sanitizes and lowercases email before invoking", async () => {
      mockInvoke.mockResolvedValue({ data: { success: true, lead_id: null, qualified: false, can_run_ai: false, phone_e164: null, phone_line_type: null, reason: null }, error: null });

      await qualifyHomepageLead({ ...baseRequest, email: "  JANE@EXAMPLE.COM  " });

      expect(mockInvoke).toHaveBeenCalledWith(
        "qualify-homepage-lead",
        expect.objectContaining({
          body: expect.objectContaining({ email: "jane@example.com" }),
        }),
      );
    });

    it("trims name and phone before invoking", async () => {
      mockInvoke.mockResolvedValue({ data: { success: true, lead_id: null, qualified: false, can_run_ai: false, phone_e164: null, phone_line_type: null, reason: null }, error: null });

      await qualifyHomepageLead({ ...baseRequest, name: "  Jane  ", phone: "  3055551234  " });

      expect(mockInvoke).toHaveBeenCalledWith(
        "qualify-homepage-lead",
        expect.objectContaining({
          body: expect.objectContaining({ name: "Jane", phone: "3055551234" }),
        }),
      );
    });

    it("defaults missing context to empty object", async () => {
      mockInvoke.mockResolvedValue({ data: { success: true, lead_id: null, qualified: false, can_run_ai: false, phone_e164: null, phone_line_type: null, reason: null }, error: null });

      await qualifyHomepageLead({ name: "Jane", email: "jane@example.com", phone: "3055551234", source: "test" });

      expect(mockInvoke).toHaveBeenCalledWith(
        "qualify-homepage-lead",
        expect.objectContaining({
          body: expect.objectContaining({ context: {} }),
        }),
      );
    });
  });

  describe("error path", () => {
    it("returns success:false with generic message when invoke throws a plain error", async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: "network failure", context: null },
      });

      const result = await qualifyHomepageLead(baseRequest);

      expect(result.success).toBe(false);
      expect(result.qualified).toBe(false);
      expect(result.can_run_ai).toBe(false);
      expect(result.lead_id).toBeNull();
      expect(result.phone_e164).toBeNull();
      expect(result.phone_line_type).toBeNull();
      expect(result.reason).toBe("Unable to qualify lead at this time.");
    });

    it("extracts reason from error.context.json() when available", async () => {
      const fakeContext = {
        json: vi.fn().mockResolvedValue({ reason: "Phone number could not be verified." }),
      };
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: "edge function error", context: fakeContext },
      });

      const result = await qualifyHomepageLead(baseRequest);

      expect(result.reason).toBe("Phone number could not be verified.");
      expect(fakeContext.json).toHaveBeenCalledOnce();
    });

    it("extracts error field from context body when reason is absent", async () => {
      const fakeContext = {
        json: vi.fn().mockResolvedValue({ error: "Invalid US phone number." }),
      };
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: "edge function error", context: fakeContext },
      });

      const result = await qualifyHomepageLead(baseRequest);

      expect(result.reason).toBe("Invalid US phone number.");
    });

    it("falls back to generic message when context.json() throws", async () => {
      const fakeContext = {
        json: vi.fn().mockRejectedValue(new Error("parse error")),
      };
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: "edge function error", context: fakeContext },
      });

      const result = await qualifyHomepageLead(baseRequest);

      expect(result.reason).toBe("Unable to qualify lead at this time.");
    });
  });
});
