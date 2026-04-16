import { describe, expect, it } from "vitest";
import { getOptimizationValueUsd } from "../valueModel";

describe("canonical value ladder", () => {
  it("uses deterministic fixed values", () => {
    expect(getOptimizationValueUsd({ eventName: "lead_identified" })).toBe(10);
    expect(getOptimizationValueUsd({ eventName: "quote_uploaded" })).toBe(250);
    expect(getOptimizationValueUsd({ eventName: "quote_upload_completed" })).toBe(250);
    expect(getOptimizationValueUsd({ eventName: "quote_validation_passed" })).toBe(500);
  });

  it("uses margin for sale_confirmed when provided", () => {
    expect(getOptimizationValueUsd({ eventName: "sale_confirmed", marginUsd: 3456.78 })).toBe(3456.78);
    expect(getOptimizationValueUsd({ eventName: "sale_confirmed" })).toBe(1500);
  });
});
