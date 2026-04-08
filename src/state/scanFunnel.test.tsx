import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { ScanFunnelProvider, useScanFunnel } from "./scanFunnel";

function wrapper({ children }: { children: React.ReactNode }) {
  return <ScanFunnelProvider>{children}</ScanFunnelProvider>;
}

describe("ScanFunnelContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with default state", () => {
    const { result } = renderHook(() => useScanFunnel(), { wrapper });
    expect(result.current.phoneE164).toBeNull();
    expect(result.current.phoneStatus).toBe("none");
    expect(result.current.leadId).toBeNull();
    expect(result.current.sessionId).toBeNull();
    expect(result.current.scanSessionId).toBeNull();
    expect(result.current.quoteFileId).toBeNull();
  });

  it("setPhone updates phone and status", () => {
    const { result } = renderHook(() => useScanFunnel(), { wrapper });
    act(() => result.current.setPhone("+15551234567", "screened_valid"));
    expect(result.current.phoneE164).toBe("+15551234567");
    expect(result.current.phoneStatus).toBe("screened_valid");
  });

  it("setPhoneStatus updates only status", () => {
    const { result } = renderHook(() => useScanFunnel(), { wrapper });
    act(() => result.current.setPhone("+15551234567", "screened_valid"));
    act(() => result.current.setPhoneStatus("otp_sent"));
    expect(result.current.phoneE164).toBe("+15551234567");
    expect(result.current.phoneStatus).toBe("otp_sent");
  });

  it("setLeadId updates leadId", () => {
    const { result } = renderHook(() => useScanFunnel(), { wrapper });
    act(() => result.current.setLeadId("lead-abc"));
    expect(result.current.leadId).toBe("lead-abc");
  });

  it("setSessionId updates sessionId", () => {
    const { result } = renderHook(() => useScanFunnel(), { wrapper });
    act(() => result.current.setSessionId("session-123"));
    expect(result.current.sessionId).toBe("session-123");
  });

  it("setScanSessionId updates scanSessionId", () => {
    const { result } = renderHook(() => useScanFunnel(), { wrapper });
    act(() => result.current.setScanSessionId("scan-456"));
    expect(result.current.scanSessionId).toBe("scan-456");
  });

  it("setQuoteFileId updates quoteFileId", () => {
    const { result } = renderHook(() => useScanFunnel(), { wrapper });
    act(() => result.current.setQuoteFileId("file-789"));
    expect(result.current.quoteFileId).toBe("file-789");
  });

  it("resetFunnel restores default state", () => {
    const { result } = renderHook(() => useScanFunnel(), { wrapper });
    act(() => result.current.setPhone("+15551234567", "verified"));
    act(() => result.current.setLeadId("lead-abc"));
    act(() => result.current.resetFunnel());
    expect(result.current.phoneE164).toBeNull();
    expect(result.current.phoneStatus).toBe("none");
    expect(result.current.leadId).toBeNull();
  });

  it("clearFunnel restores default state and clears localStorage", () => {
    const { result } = renderHook(() => useScanFunnel(), { wrapper });
    act(() => result.current.setPhone("+15551234567", "verified"));
    act(() => result.current.clearFunnel());
    expect(result.current.phoneE164).toBeNull();
    expect(localStorage.getItem("wm_funnel_phoneE164")).toBeNull();
  });

  it("persists phone and sessionId to localStorage", () => {
    const { result } = renderHook(() => useScanFunnel(), { wrapper });
    act(() => result.current.setPhone("+15551234567", "otp_sent"));
    act(() => result.current.setSessionId("session-x"));
    expect(localStorage.getItem("wm_funnel_phoneE164")).toBe("+15551234567");
    expect(localStorage.getItem("wm_funnel_phoneStatus")).toBe("otp_sent");
    expect(localStorage.getItem("wm_funnel_sessionId")).toBe("session-x");
  });

  it("throws when useScanFunnel is used outside provider", () => {
    expect(() => {
      renderHook(() => useScanFunnel());
    }).toThrow("useScanFunnel must be used within a <ScanFunnelProvider>");
  });
});
