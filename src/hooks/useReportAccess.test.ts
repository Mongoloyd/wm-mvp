/**
 * Tests for useReportAccess — Identity Ladder access level logic.
 *
 * SECURITY INVARIANT: "full" access is only granted when the backend has
 * confirmed verification by loading gated data (isFullLoaded=true).
 * Phone presence alone, OTP status alone, and client-side state alone
 * must never elevate access to "full".
 */

import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useReportAccess } from "./useReportAccess";

describe("useReportAccess — Identity Ladder access levels", () => {
  // ── Level 0 / Level 1: unverified users always see preview ───────────

  it("returns 'preview' by default with no options", () => {
    const { result } = renderHook(() => useReportAccess());
    expect(result.current).toBe("preview");
  });

  it("returns 'preview' when isFullLoaded is false", () => {
    const { result } = renderHook(() =>
      useReportAccess({ isFullLoaded: false })
    );
    expect(result.current).toBe("preview");
  });

  it("returns 'preview' when isFullLoaded is undefined", () => {
    const { result } = renderHook(() =>
      useReportAccess({ isFullLoaded: undefined })
    );
    expect(result.current).toBe("preview");
  });

  // ── Level 2: backend-confirmed verification unlocks full report ───────

  it("returns 'full' only when isFullLoaded is true (backend confirmed)", () => {
    const { result } = renderHook(() =>
      useReportAccess({ isFullLoaded: true })
    );
    expect(result.current).toBe("full");
  });

  // ── Identity Ladder security: phone/OTP state alone is insufficient ───

  it("never elevates to 'full' based on phone presence alone — isFullLoaded must be true", () => {
    // Simulates a user who has a phone in the funnel but the backend
    // has not yet confirmed verification (isFullLoaded still false).
    const { result } = renderHook(() =>
      useReportAccess({ isFullLoaded: false })
    );
    expect(result.current).toBe("preview");
    expect(result.current).not.toBe("full");
  });

  it("never returns 'full' when isFullLoaded transitions from false to false", () => {
    const { result, rerender } = renderHook(
      ({ loaded }: { loaded: boolean }) =>
        useReportAccess({ isFullLoaded: loaded }),
      { initialProps: { loaded: false } }
    );
    expect(result.current).toBe("preview");
    rerender({ loaded: false });
    expect(result.current).toBe("preview");
  });

  it("elevates to 'full' when isFullLoaded transitions from false to true", () => {
    const { result, rerender } = renderHook(
      ({ loaded }: { loaded: boolean }) =>
        useReportAccess({ isFullLoaded: loaded }),
      { initialProps: { loaded: false } }
    );
    expect(result.current).toBe("preview");
    rerender({ loaded: true });
    expect(result.current).toBe("full");
  });

  it("returns to 'preview' when isFullLoaded transitions back to false", () => {
    const { result, rerender } = renderHook(
      ({ loaded }: { loaded: boolean }) =>
        useReportAccess({ isFullLoaded: loaded }),
      { initialProps: { loaded: true } }
    );
    expect(result.current).toBe("full");
    rerender({ loaded: false });
    expect(result.current).toBe("preview");
  });

  // ── forceLevel override (dev / testing only) ─────────────────────────

  it("forceLevel='full' overrides isFullLoaded=false (dev fixture only)", () => {
    const { result } = renderHook(() =>
      useReportAccess({ isFullLoaded: false, forceLevel: "full" })
    );
    expect(result.current).toBe("full");
  });

  it("forceLevel='preview' overrides isFullLoaded=true", () => {
    const { result } = renderHook(() =>
      useReportAccess({ isFullLoaded: true, forceLevel: "preview" })
    );
    expect(result.current).toBe("preview");
  });

  it("forceLevel='full' with no other options returns 'full'", () => {
    const { result } = renderHook(() =>
      useReportAccess({ forceLevel: "full" })
    );
    expect(result.current).toBe("full");
  });
});
