import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { ScanFunnelProvider, useScanFunnel } from "./scanFunnel";

// Mirror the private LS key names from scanFunnel.tsx
const LS_KEYS = {
  phoneE164: "wm_funnel_phoneE164",
  phoneStatus: "wm_funnel_phoneStatus",
  sessionId: "wm_funnel_sessionId",
  scanSessionId: "wm_funnel_scanSessionId",
  timestamp: "wm_funnel_ts",
} as const;

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function wrapper({ children }: { children: React.ReactNode }) {
  return <ScanFunnelProvider>{children}</ScanFunnelProvider>;
}

function renderFunnel() {
  return renderHook(() => useScanFunnel(), { wrapper });
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

// ── readPersistedState (exercised via Provider initialisation) ────────────────

describe("readPersistedState via ScanFunnelProvider initialisation", () => {
  it("initialises with default state and removes all LS keys when timestamp > 24 h", () => {
    // Pin the clock so the expiry arithmetic is fully deterministic
    vi.setSystemTime(new Date("2024-06-01T12:00:00.000Z"));
    const expiredTs = Date.now() - (TWENTY_FOUR_HOURS_MS + 1);
    localStorage.setItem(LS_KEYS.timestamp, String(expiredTs));
    localStorage.setItem(LS_KEYS.phoneE164, "+13055551234");
    localStorage.setItem(LS_KEYS.phoneStatus, "otp_sent");
    localStorage.setItem(LS_KEYS.scanSessionId, "session-stale");

    const { result } = renderFunnel();

    // State must be defaults — the expired data is discarded
    expect(result.current.phoneE164).toBeNull();
    expect(result.current.phoneStatus).toBe("none");
    expect(result.current.scanSessionId).toBeNull();

    // Every LS key must have been purged
    for (const key of Object.values(LS_KEYS)) {
      expect(localStorage.getItem(key)).toBeNull();
    }
  });

  it("restores partial state from non-expired LS data", () => {
    // Pin the clock and seed a timestamp that is 1 minute old (well within 24 h)
    vi.setSystemTime(new Date("2024-06-01T12:00:00.000Z"));
    const freshTs = Date.now() - 60_000;
    localStorage.setItem(LS_KEYS.timestamp, String(freshTs));
    localStorage.setItem(LS_KEYS.phoneE164, "+13055551234");
    localStorage.setItem(LS_KEYS.phoneStatus, "otp_sent");
    localStorage.setItem(LS_KEYS.scanSessionId, "session-current");

    const { result } = renderFunnel();

    expect(result.current.phoneE164).toBe("+13055551234");
    expect(result.current.phoneStatus).toBe("otp_sent");
    expect(result.current.scanSessionId).toBe("session-current");
  });
});

// ── persistFields behaviour (exercised via Provider action side-effects) ──────

describe("persistFields behaviour via ScanFunnelProvider actions", () => {
  it("removes the phoneE164 LS key when the funnel is cleared (null phoneE164 path)", async () => {
    const { result } = renderFunnel();

    // Write a phone number into LS via setPhone
    await act(async () => {
      result.current.setPhone("+13055551234", "screened_valid");
    });
    expect(localStorage.getItem(LS_KEYS.phoneE164)).toBe("+13055551234");

    // clearFunnel removes all persisted keys including phoneE164
    await act(async () => {
      result.current.clearFunnel();
    });

    expect(localStorage.getItem(LS_KEYS.phoneE164)).toBeNull();
  });

  it("removes the scanSessionId LS key when the funnel is cleared (null scanSessionId path)", async () => {
    const { result } = renderFunnel();

    await act(async () => {
      result.current.setScanSessionId("session-123");
    });
    expect(localStorage.getItem(LS_KEYS.scanSessionId)).toBe("session-123");

    await act(async () => {
      result.current.clearFunnel();
    });

    expect(localStorage.getItem(LS_KEYS.scanSessionId)).toBeNull();
  });
});

// ── ScanFunnelProvider integration ────────────────────────────────────────────

describe("ScanFunnelProvider", () => {
  it("setPhoneStatus updates React state and writes phoneStatus to localStorage", async () => {
    const { result } = renderFunnel();

    await act(async () => {
      result.current.setPhoneStatus("otp_sent");
    });

    expect(result.current.phoneStatus).toBe("otp_sent");
    expect(localStorage.getItem(LS_KEYS.phoneStatus)).toBe("otp_sent");
    // The timestamp entry must be refreshed on every write
    expect(localStorage.getItem(LS_KEYS.timestamp)).not.toBeNull();
  });

  it("clearFunnel resets React state to defaults and removes all LS keys", async () => {
    const { result } = renderFunnel();

    // Populate state (and LS) with non-default values
    await act(async () => {
      result.current.setPhone("+13055551234", "otp_sent");
      result.current.setScanSessionId("session-abc");
    });

    expect(localStorage.getItem(LS_KEYS.phoneE164)).toBe("+13055551234");
    expect(localStorage.getItem(LS_KEYS.scanSessionId)).toBe("session-abc");

    await act(async () => {
      result.current.clearFunnel();
    });

    // React state back to defaults
    expect(result.current.phoneE164).toBeNull();
    expect(result.current.phoneStatus).toBe("none");
    expect(result.current.scanSessionId).toBeNull();

    // Every LS key must be gone
    for (const key of Object.values(LS_KEYS)) {
      expect(localStorage.getItem(key)).toBeNull();
    }
  });
});
