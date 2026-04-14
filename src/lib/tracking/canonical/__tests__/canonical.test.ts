import { describe, expect, it } from "vitest";

import { computeTrustScore } from "../../../../../supabase/functions/_shared/canonical/trustScore";
import { computeAnomalyScore, routeQuoteTrust } from "../../../../../supabase/functions/_shared/canonical/anomaly";
import { mapToMeta } from "../../../../../supabase/functions/_shared/canonical/mapToMeta";
import { mapToGoogle } from "../../../../../supabase/functions/_shared/canonical/mapToGoogle";
import { RETRY_DELAYS_MS } from "../../../../../supabase/functions/_shared/canonical/constants";
import { createCanonicalEvent } from "../../../../../supabase/functions/_shared/canonical/createCanonicalEvent";

describe("canonical trust/anomaly", () => {
  it("computes high trust for complete quote inputs", () => {
    const trust = computeTrustScore({
      identityQuality: "strong",
      quote: {
        ocrConfidence: 0.95,
        completeness: 0.95,
        mathConsistency: 0.9,
        cohortFit: 0.85,
        scopeConsistency: 0.9,
        documentValidity: 1,
      },
    });

    expect(trust).toBeGreaterThan(0.85);
  });

  it("routes impossible quote values to reject", () => {
    const anomaly = computeAnomalyScore({
      isWindowDoorQuote: true,
      impossibleValueDetected: true,
      quotedAmount: -100,
    });

    const routed = routeQuoteTrust(0.8, anomaly, {
      isWindowDoorQuote: true,
      impossibleValueDetected: true,
      quotedAmount: -100,
    });

    expect(routed.anomalyStatus).toBe("reject");
    expect(routed.approvedForAds).toBe(false);
  });
});

describe("canonical mappers", () => {
  const safeEvent = {
    eventId: "wm_evt_1",
    eventName: "quote_validation_passed",
    occurredAt: new Date().toISOString(),
    schemaVersion: "1",
    modelVersion: "1",
    identity: { leadId: "lead-1", gclid: "gclid-1" },
    identityHashes: { emailSha256: "abc", phoneSha256: "def" },
    identityQuality: "strong",
    journey: {},
    optimization: { currency: "USD", value: 65, shouldSendMeta: true, shouldSendGoogle: true },
    trust: {
      trustScore: 0.91,
      anomalyScore: 0.02,
      anomalyStatus: "safe",
      manualReviewRequired: false,
      approvedForIndex: true,
      approvedForAds: true,
      reasons: [],
    },
  } as const;

  it("suppresses Meta when anomaly is not safe", () => {
    const meta = mapToMeta({ ...safeEvent, trust: { ...safeEvent.trust, anomalyStatus: "review" } });
    expect(meta).toBeNull();
  });

  it("suppresses Google when no attribution identifiers", () => {
    const google = mapToGoogle({
      ...safeEvent,
      identity: {},
      identityHashes: {},
    });
    expect(google).toBeNull();
  });
});

describe("canonical event id and retry schedule", () => {
  it("reuses provided event_id", async () => {
    const inserts: Array<{ table: string; payload: Record<string, unknown> }> = [];
    const supabaseStub = {
      from: (table: string) => ({
        insert: async (payload: Record<string, unknown>) => {
          inserts.push({ table, payload });
          return { error: null };
        },
        upsert: async (payload: Record<string, unknown>) => {
          inserts.push({ table, payload });
          return { error: null };
        },
      }),
    };

    const out = await createCanonicalEvent(supabaseStub, {
      eventId: "wm_fixed_123",
      eventName: "lead_identified",
      identity: { leadId: "lead-1", email: "x@example.com" },
    });

    expect(out.event.eventId).toBe("wm_fixed_123");
    const ledgerInsert = inserts.find((i) => i.table === "wm_event_log");
    expect(ledgerInsert?.payload.event_id).toBe("wm_fixed_123");
  });

  it("uses bounded retry schedule", () => {
    expect(RETRY_DELAYS_MS).toEqual([0, 300000, 1800000, 7200000, 43200000]);
  });

  it("review/quarantine/reject never approved for ads", () => {
    const review = routeQuoteTrust(0.55, 0.45, { isWindowDoorQuote: true });
    const quarantine = routeQuoteTrust(0.4, 0.7, { isWindowDoorQuote: true });
    const reject = routeQuoteTrust(0.1, 0.9, { isWindowDoorQuote: true });

    expect(review.approvedForAds).toBe(false);
    expect(quarantine.approvedForAds).toBe(false);
    expect(reject.approvedForAds).toBe(false);
  });
});
