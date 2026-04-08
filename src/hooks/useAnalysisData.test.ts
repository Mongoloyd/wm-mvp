import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAnalysisData } from "./useAnalysisData";

// ── Supabase mock ─────────────────────────────────────────────────────────────

const { mockRpc, mockFrom, mockFunctionsInvoke } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockFrom: vi.fn().mockReturnValue({
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
  mockFunctionsInvoke: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: mockRpc,
    from: mockFrom,
    functions: { invoke: mockFunctionsInvoke },
  },
}));

vi.mock("@/lib/trackEvent", () => ({ trackEvent: vi.fn() }));

vi.mock("@/lib/verifiedAccess", () => ({
  getVerifiedAccess: vi.fn().mockReturnValue(null),
  saveVerifiedAccess: vi.fn(),
  clearVerifiedAccess: vi.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns a minimal valid row for get_analysis_full with the given raw flags. */
function makeFullRow(flags: unknown[] = []) {
  return {
    grade: "C",
    flags,
    confidence_score: 0.8,
    document_type: "quote",
    proof_of_read: {},
    preview_json: {},
    full_json: {},
  };
}

/**
 * Render the hook with enabled=false (no preview fetch), mock both the normal
 * RPC path and the dev-bypass path to return one flag with the given
 * rawSeverity, call fetchFull, and return the first processed AnalysisFlag.
 *
 * Both paths are mocked because the .env has VITE_DEV_BYPASS_SECRET set,
 * making devBypassEnabled=true in the test environment.  The dev-bypass path
 * calls supabase.functions.invoke and receives the row directly (not in an
 * array); the normal path calls supabase.rpc and receives it inside an array.
 */
async function fetchedFlag(rawSeverity: string | null) {
  const row = makeFullRow([
    { flag: "test_issue", severity: rawSeverity, detail: "detail text", pillar: "safety_code" },
  ]);

  // Normal production path (used when devBypassEnabled=false)
  mockRpc.mockResolvedValue({ data: [row], error: null });
  // Dev-bypass path (used when VITE_DEV_BYPASS_SECRET is set in .env)
  mockFunctionsInvoke.mockResolvedValue({ data: row, error: null });

  const { result } = renderHook(() => useAnalysisData("session-test", false));

  await act(async () => {
    await result.current.fetchFull("+13055551234");
  });

  return result.current.data?.flags[0];
}

// ── Test setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

// ── mapSeverity via fetchFull flag processing ─────────────────────────────────
//
// mapSeverity is a private helper inside useAnalysisData.ts.  We verify its
// behaviour by inspecting the severity on flags returned from fetchFull, which
// runs every raw flag through mapSeverity before storing it in state.

describe("mapSeverity via fetchFull flag processing", () => {
  it('maps "critical" → red', async () => {
    expect((await fetchedFlag("critical"))?.severity).toBe("red");
  });

  it('maps "high" → red', async () => {
    expect((await fetchedFlag("high"))?.severity).toBe("red");
  });

  it('maps "medium" → amber', async () => {
    expect((await fetchedFlag("medium"))?.severity).toBe("amber");
  });

  it('maps "low" → green (known-positive severity)', async () => {
    expect((await fetchedFlag("low"))?.severity).toBe("green");
  });

  it('maps "info" → green (known-positive severity)', async () => {
    expect((await fetchedFlag("info"))?.severity).toBe("green");
  });

  it('maps "pass" → green (known-positive severity)', async () => {
    expect((await fetchedFlag("pass"))?.severity).toBe("green");
  });

  it('maps "confirmed" → green (known-positive severity)', async () => {
    expect((await fetchedFlag("confirmed"))?.severity).toBe("green");
  });

  it('maps "green" → green', async () => {
    expect((await fetchedFlag("green"))?.severity).toBe("green");
  });

  it('maps "ok" → green', async () => {
    expect((await fetchedFlag("ok"))?.severity).toBe("green");
  });

  it('maps "good" → green', async () => {
    expect((await fetchedFlag("good"))?.severity).toBe("green");
  });

  it("maps unknown severity → amber (never silently becomes green/confirmed)", async () => {
    expect((await fetchedFlag("TOTALLY_UNKNOWN_SEVERITY"))?.severity).toBe("amber");
  });

  it("maps null severity → amber (never silently becomes green/confirmed)", async () => {
    expect((await fetchedFlag(null))?.severity).toBe("amber");
  });
});

// ── scanSessionId reset effect ────────────────────────────────────────────────

describe("scanSessionId reset effect", () => {
  it("clears data and isFullLoaded when scanSessionId changes", async () => {
    const row = makeFullRow();
    mockRpc.mockResolvedValue({ data: [row], error: null });
    mockFunctionsInvoke.mockResolvedValue({ data: row, error: null });

    const { result, rerender } = renderHook(
      ({ id, en }: { id: string | null; en: boolean }) => useAnalysisData(id, en),
      { initialProps: { id: "session-a", en: false } },
    );

    // Populate state via fetchFull
    await act(async () => {
      await result.current.fetchFull("+13055551234");
    });

    expect(result.current.data).not.toBeNull();
    expect(result.current.isFullLoaded).toBe(true);

    // Changing scanSessionId must fire the reset effect
    act(() => {
      rerender({ id: "session-b", en: false });
    });

    expect(result.current.data).toBeNull();
    expect(result.current.isFullLoaded).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("clears fullFetchError when scanSessionId changes", async () => {
    // Return __UNAUTHORIZED__ through both paths to trigger fullFetchError
    const unauthorizedRow = { grade: "__UNAUTHORIZED__" };
    mockRpc.mockResolvedValue({ data: [unauthorizedRow], error: null });
    mockFunctionsInvoke.mockResolvedValue({ data: unauthorizedRow, error: null });

    const { result, rerender } = renderHook(
      ({ id, en }: { id: string | null; en: boolean }) => useAnalysisData(id, en),
      { initialProps: { id: "session-a", en: false } },
    );

    await act(async () => {
      await result.current.fetchFull("+13055551234");
    });

    expect(result.current.fullFetchError).not.toBeNull();

    // Changing scanSessionId must clear fullFetchError too
    act(() => {
      rerender({ id: "session-b", en: false });
    });

    expect(result.current.fullFetchError).toBeNull();
  });
});
