/**
 * Tests for screenPhone — client-side junk/fake phone screening.
 *
 * Covers valid numbers, all invalid patterns, and the Identity Ladder
 * requirement that junk numbers never reach the OTP pipeline.
 */

import { describe, it, expect } from "vitest";
import { screenPhone } from "../screenPhone";

describe("screenPhone — valid US numbers", () => {
  it("accepts a standard 10-digit US number", () => {
    // 555 is a blocked exchange — use a non-blocked exchange
    expect(screenPhone("3052341234")).toEqual({ ok: true, e164: "+13052341234" });
  });

  it("accepts a formatted display value (strips non-digits)", () => {
    const result = screenPhone("(305) 234-1234");
    expect(result).toEqual({ ok: true, e164: "+13052341234" });
  });

  it("accepts an 11-digit number with leading '1' country code", () => {
    const result = screenPhone("13052341234");
    expect(result).toEqual({ ok: true, e164: "+13052341234" });
  });

  it("returns the normalized E.164 format on success", () => {
    expect(screenPhone("7272341234")).toEqual({ ok: true, e164: "+17272341234" });
  });
});

describe("screenPhone — length errors", () => {
  it("rejects a 9-digit number (too short)", () => {
    const result = screenPhone("305234123");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("10-digit");
    }
  });

  it("rejects an 8-digit number", () => {
    const result = screenPhone("30523412");
    expect(result.ok).toBe(false);
  });

  it("rejects a 12-digit number that does not start with 1", () => {
    const result = screenPhone("443052341234");
    expect(result.ok).toBe(false);
  });

  it("rejects an empty string", () => {
    const result = screenPhone("");
    expect(result.ok).toBe(false);
  });
});

describe("screenPhone — area code rules", () => {
  it("rejects area code starting with 0", () => {
    const result = screenPhone("0302341234");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/area code/i);
    }
  });

  it("rejects area code starting with 1", () => {
    const result = screenPhone("1002341234");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/area code/i);
    }
  });
});

describe("screenPhone — exchange rules", () => {
  it("rejects exchange (digits 4-6) starting with 0", () => {
    const result = screenPhone("3050341234");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/isn't valid/i);
    }
  });

  it("rejects exchange starting with 1", () => {
    const result = screenPhone("3051341234");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/isn't valid/i);
    }
  });
});

describe("screenPhone — 555 test numbers", () => {
  it("rejects a 555 exchange number", () => {
    const result = screenPhone("3055551234");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/test number/i);
    }
  });

  it("rejects 555 regardless of area code", () => {
    expect(screenPhone("2125550001").ok).toBe(false);
    expect(screenPhone("7075550001").ok).toBe(false);
  });
});

describe("screenPhone — toll-free numbers", () => {
  it("rejects 800 prefix", () => {
    const result = screenPhone("8002341234");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/toll-free/i);
    }
  });

  it("rejects 888 prefix", () => {
    expect(screenPhone("8882341234").ok).toBe(false);
  });

  it("rejects 877 prefix", () => {
    expect(screenPhone("8772341234").ok).toBe(false);
  });

  it("rejects 866 prefix", () => {
    expect(screenPhone("8662341234").ok).toBe(false);
  });

  it("rejects 855 prefix", () => {
    expect(screenPhone("8552341234").ok).toBe(false);
  });

  it("rejects 844 prefix", () => {
    expect(screenPhone("8442341234").ok).toBe(false);
  });

  it("rejects 833 prefix", () => {
    expect(screenPhone("8332341234").ok).toBe(false);
  });
});

describe("screenPhone — sequential digits", () => {
  it("rejects descending sequential number 9876543210", () => {
    // 9876543210 passes area code and exchange checks but fails the sequential guard
    const result = screenPhone("9876543210");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/real phone/i);
    }
  });

  it("rejects ascending sequential-like number 0123456789 (also fails area code check)", () => {
    // Area code starts with 0 → fails area code rule
    const result = screenPhone("0123456789");
    expect(result.ok).toBe(false);
  });
});

describe("screenPhone — repeated digit numbers", () => {
  it("rejects all-same-digit number 2222222222", () => {
    const result = screenPhone("2222222222");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/real phone/i);
    }
  });

  it("rejects 9999999999", () => {
    expect(screenPhone("9999999999").ok).toBe(false);
  });

  it("rejects 3333333333", () => {
    expect(screenPhone("3333333333").ok).toBe(false);
  });
});

describe("screenPhone — blocked number list", () => {
  it("rejects +15551234567 — exchange starts with 1 (structural invalid)", () => {
    // +15551234567 → digits10 = "5551234567", exchange digit[3] = "1" → invalid exchange
    const result = screenPhone("+15551234567");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/isn't valid/i);
    }
  });

  it("rejects 0000000000 equivalent (+10000000000) from blocked list", () => {
    // area code 000 would fail area code check first (starts with 0)
    const result = screenPhone("0000000000");
    expect(result.ok).toBe(false);
  });

  it("rejects 1234567890 (also in blocked list)", () => {
    const result = screenPhone("1234567890");
    expect(result.ok).toBe(false);
  });

  it("rejects 9999999999 (+19999999999 from blocked list)", () => {
    expect(screenPhone("9999999999").ok).toBe(false);
  });
});
