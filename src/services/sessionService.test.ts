/**
 * Tests for generateUUID in sessionService.ts
 *
 * Covers:
 * - crypto.randomUUID path (native API delegation)
 * - crypto.getRandomValues fallback path (RFC 4122 v4 UUID)
 * - UUID format and v4 semantics (version nibble = 4, variant bits = 10xx)
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { generateUUID } from "./sessionService";

// UUID v4 format: xxxxxxxx-xxxx-4xxx-[89ab]xxx-xxxxxxxxxxxx
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("generateUUID — crypto.randomUUID path", () => {
  it("delegates to crypto.randomUUID when it is available", () => {
    const expected = "11111111-2222-4333-a444-555555555555";
    const spy = vi.spyOn(crypto, "randomUUID").mockReturnValue(expected as `${string}-${string}-${string}-${string}-${string}`);

    const result = generateUUID();

    expect(spy).toHaveBeenCalledOnce();
    expect(result).toBe(expected);
  });

  it("returns a value that matches UUID v4 format when delegating to crypto.randomUUID", () => {
    // Use the real crypto.randomUUID (available in jsdom/Node >= 19)
    const result = generateUUID();
    expect(result).toMatch(UUID_V4_REGEX);
  });
});

describe("generateUUID — crypto.getRandomValues fallback path", () => {
  /**
   * Simulate the environment where crypto.randomUUID is absent so that the
   * getRandomValues branch is exercised.  We replace the global `crypto`
   * object with a trimmed version that exposes only `getRandomValues`,
   * then restore it after each test via vi.unstubAllGlobals().
   */
  function withoutRandomUUID(fn: () => void) {
    const realGetRandomValues = crypto.getRandomValues.bind(crypto);
    vi.stubGlobal("crypto", { getRandomValues: realGetRandomValues });
    try {
      fn();
    } finally {
      vi.unstubAllGlobals();
    }
  }

  it("falls back to crypto.getRandomValues when randomUUID is unavailable", () => {
    withoutRandomUUID(() => {
      const spy = vi.spyOn(
        globalThis.crypto as Crypto,
        "getRandomValues"
      );
      generateUUID();
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  it("returns a string that matches UUID v4 format via getRandomValues", () => {
    withoutRandomUUID(() => {
      const result = generateUUID();
      expect(result).toMatch(UUID_V4_REGEX);
    });
  });

  it("sets version nibble to 4 (0x4x in octet 6)", () => {
    withoutRandomUUID(() => {
      // Run several times to reduce flakiness from random data
      for (let i = 0; i < 20; i++) {
        const uuid = generateUUID();
        // Segment layout: xxxxxxxx-xxxx-Vxxx-... (V is at index 14 in the string)
        expect(uuid[14]).toBe("4");
      }
    });
  });

  it("sets variant bits to 10xx (high byte of octet 8 in range [89ab])", () => {
    withoutRandomUUID(() => {
      for (let i = 0; i < 20; i++) {
        const uuid = generateUUID();
        // Segment layout: xxxxxxxx-xxxx-xxxx-Vxxx-... (V is at index 19)
        expect(["8", "9", "a", "b"]).toContain(uuid[19]);
      }
    });
  });

  it("returns a UUID with the correct hyphen positions", () => {
    withoutRandomUUID(() => {
      const uuid = generateUUID();
      expect(uuid[8]).toBe("-");
      expect(uuid[13]).toBe("-");
      expect(uuid[18]).toBe("-");
      expect(uuid[23]).toBe("-");
      expect(uuid).toHaveLength(36);
    });
  });

  it("produces distinct values on consecutive calls (no constant output)", () => {
    withoutRandomUUID(() => {
      const results = new Set(Array.from({ length: 10 }, () => generateUUID()));
      // Ten random UUIDs should all be unique
      expect(results.size).toBe(10);
    });
  });
});
