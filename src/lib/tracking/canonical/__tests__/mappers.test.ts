import { describe, expect, it } from "vitest";
import { mapToMeta } from "../mapToMeta";
import { mapToGoogle } from "../mapToGoogle";
import type { WMCanonicalEvent } from "../types";

function canonicalFixture(overrides: Partial<WMCanonicalEvent> = {}): WMCanonicalEvent {
  return {
    eventId: "wmc_123",
    eventName: "quote_validation_passed",
    eventTimestamp: "2026-04-14T10:00:00.000Z",
    schemaVersion: "1.0.0",
    dispatchStatus: "pending",
    identityQuality: "high",
    shouldSendMeta: true,
    shouldSendGoogle: true,
    payload: {
      identity: {
        leadId: "lead-1",
        emailHash: "a".repeat(64),
        phoneHash: "b".repeat(64),
        gclid: "gclid-123",
      },
      journey: { route: "/vault", flow: "vault" },
      analytics: {
        ocrConfidence: 0.9,
        completeness: 0.9,
        mathConsistency: 0.9,
        cohortFit: 0.9,
        scopeConsistency: 0.9,
        documentValidity: 0.9,
        identityStrength: 0.9,
        anomalyScore: 0.1,
        trustScore: 0.9,
        anomalyStatus: "safe",
        reasons: [],
      },
      optimization: {
        approvedForAds: true,
        approvedForIndex: true,
        manualReviewRequired: false,
        valueUsd: 500,
        priority: 70,
      },
    },
    ...overrides,
  };
}

describe("canonical mappers", () => {
  it("keeps event_id/transaction_id consistent", () => {
    const canonical = canonicalFixture();
    const meta = mapToMeta(canonical, "https://windowman.example/vault");
    const google = mapToGoogle(canonical);

    expect(meta.suppressed).toBe(false);
    expect(google.suppressed).toBe(false);
    expect(meta.payload?.event_id).toBe(canonical.eventId);
    expect(google.payload?.transaction_id).toBe(canonical.eventId);
  });

  it("suppresses unsafe quote events", () => {
    const canonical = canonicalFixture({
      payload: {
        ...canonicalFixture().payload,
        analytics: {
          ...canonicalFixture().payload.analytics!,
          anomalyStatus: "review",
          trustScore: 0.5,
        },
      },
    });

    expect(mapToMeta(canonical, "https://windowman.example").suppressed).toBe(true);
    expect(mapToGoogle(canonical).suppressed).toBe(true);
  });

  it("suppresses when identity is too weak", () => {
    const canonical = canonicalFixture({
      identityQuality: "low",
      shouldSendMeta: true,
    });

    expect(mapToMeta(canonical, "https://windowman.example").suppressed).toBe(true);
  });

  it("maps quote_uploaded to correct google conversion action", () => {
    const canonical = canonicalFixture({ eventName: "quote_uploaded" });
    const google = mapToGoogle(canonical);

    expect(google.suppressed).toBe(false);
    expect(google.payload?.conversion_action).toBe("wm_quote_uploaded");
  });

  it("maps quote_upload_completed alias to correct google conversion action", () => {
    const canonical = canonicalFixture({ eventName: "quote_upload_completed" });
    const google = mapToGoogle(canonical);

    expect(google.suppressed).toBe(false);
    expect(google.payload?.conversion_action).toBe("wm_quote_uploaded");
  });

  it("maps quote_uploaded to SubmitApplication meta event", () => {
    const canonical = canonicalFixture({ eventName: "quote_uploaded" });
    const meta = mapToMeta(canonical, "https://windowman.example/vault");

    expect(meta.suppressed).toBe(false);
    expect(meta.payload?.event_name).toBe("SubmitApplication");
  });
});
