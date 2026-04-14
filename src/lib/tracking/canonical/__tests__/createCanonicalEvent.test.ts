import { describe, expect, it } from "vitest";
import { createCanonicalEvent } from "../createCanonicalEvent";
import type { CreateCanonicalEventInput } from "../types";

class MockDB {
  public inserts: Record<string, unknown[]> = {};
  public upserts: Record<string, unknown[]> = {};

  from(table: string) {
    return {
      insert: async (payload: Record<string, unknown> | Record<string, unknown>[]) => {
        const rows = Array.isArray(payload) ? payload : [payload];
        this.inserts[table] = [...(this.inserts[table] ?? []), ...rows];
        return { data: rows, error: null };
      },
      upsert: async (payload: Record<string, unknown>) => {
        this.upserts[table] = [...(this.upserts[table] ?? []), payload];
        return { data: payload, error: null };
      },
      select: (_columns: string) => ({
        eq: (_column: string, _value: string) => ({
          maybeSingle: async () => ({ data: { id: "event-log-1" }, error: null }),
        }),
      }),
    };
  }
}

function baseInput(overrides: Partial<CreateCanonicalEventInput> = {}): CreateCanonicalEventInput {
  return {
    eventName: "quote_validation_passed",
    leadId: crypto.randomUUID(),
    analysisId: crypto.randomUUID(),
    scanSessionId: crypto.randomUUID(),
    quoteFileId: crypto.randomUUID(),
    payload: {
      identity: {
        email: "user@example.com",
        phone: "5614685571",
        gclid: "gclid-123",
      },
      journey: {
        route: "/vault/upload",
        flow: "vault",
      },
      quote: {
        isQuoteDocument: true,
        analysisId: crypto.randomUUID(),
        quoteAmount: 12000,
        pricePerOpening: 1400,
        depositPercent: 20,
      },
      analytics: {
        ocrConfidence: 0.92,
        completeness: 0.9,
        mathConsistency: 0.9,
        cohortFit: 0.85,
        scopeConsistency: 0.88,
        documentValidity: 0.9,
        identityStrength: 0.75,
        anomalyScore: 0,
        trustScore: 0,
        anomalyStatus: "review",
        reasons: [],
      },
    },
    ...overrides,
  };
}

describe("createCanonicalEvent", () => {
  it("generates event_id when omitted and reuses when provided", async () => {
    const db = new MockDB();

    const generated = await createCanonicalEvent(baseInput({ eventId: undefined }), {
      db,
      createId: () => "wmc_fixed",
      now: () => new Date("2026-04-14T10:00:00.000Z"),
    });

    const reused = await createCanonicalEvent(baseInput({ eventId: "wmc_reused" }), {
      db,
      now: () => new Date("2026-04-14T10:00:00.000Z"),
    });

    expect(generated.canonicalEvent.eventId).toBe("wmc_fixed");
    expect(reused.canonicalEvent.eventId).toBe("wmc_reused");
  });

  it("persists wm_event_log and wm_quote_facts with dispatch eligibility", async () => {
    const db = new MockDB();

    const result = await createCanonicalEvent(baseInput(), {
      db,
      createId: () => "wmc_persist",
      now: () => new Date("2026-04-14T10:00:00.000Z"),
    });

    expect(db.inserts.wm_event_log?.length).toBe(1);
    expect(db.upserts.wm_quote_facts?.length).toBe(1);
    expect(db.inserts.wm_platform_dispatch_log?.length).toBeGreaterThan(0);
    expect(result.dispatchPlatforms).toContain("meta");
    expect(result.dispatchPlatforms).toContain("google_ads");
  });

  it("suppresses dispatch enqueue for unsafe quote states", async () => {
    const db = new MockDB();

    await createCanonicalEvent(
      baseInput({
        payload: {
          ...baseInput().payload,
          quote: {
            ...baseInput().payload.quote!,
            impossibleValuesDetected: true,
          },
        },
      }),
      {
        db,
        createId: () => "wmc_unsafe",
      },
    );

    expect(db.inserts.wm_platform_dispatch_log ?? []).toHaveLength(0);
  });
});
