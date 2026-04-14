import { describe, expect, it } from "vitest";
import { computeIdentityQuality, normalizeAndHashIdentity } from "../identity";

describe("canonical identity helpers", () => {
  it("normalizes and hashes email/phone without double hashing", async () => {
    const normalized = await normalizeAndHashIdentity({
      email: "  USER@Example.COM ",
      phone: "(561) 468-5571",
      emailHash: "a".repeat(64),
    });

    expect(normalized.email).toBe("user@example.com");
    expect(normalized.phone).toBe("+15614685571");
    expect(normalized.emailHash).toBe("a".repeat(64));
    expect(normalized.phoneHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("scores click-id + strong pii as high quality", () => {
    const quality = computeIdentityQuality({
      emailHash: "b".repeat(64),
      gclid: "test-gclid",
      leadId: crypto.randomUUID(),
    });

    expect(quality).toBe("high");
  });

  it("scores browser-only identifiers as low quality", () => {
    const quality = computeIdentityQuality({
      fbp: "fbp.1.2.3",
      clickId: "cid",
    });

    expect(quality).toBe("low");
  });
});
