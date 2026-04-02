import { describe, it, expect } from "vitest";
import { resolveEffectiveSeverity } from "../resolveEffectiveSeverity";
import type { AnalysisFlag } from "@/hooks/useAnalysisData";

function makeFlag(
  overrides: Partial<AnalysisFlag> & Pick<AnalysisFlag, "severity" | "label" | "detail">
): AnalysisFlag {
  return {
    id: 1,
    tip: null,
    pillar: null,
    ...overrides,
  };
}

describe("resolveEffectiveSeverity", () => {
  // ── Red overrides ──

  it("escalates green to red when license is missing", () => {
    const flag = makeFlag({
      severity: "green",
      label: "License Verification",
      detail: "No evidence of contractor licensing found in the document.",
    });
    expect(resolveEffectiveSeverity(flag)).toBe("red");
  });

  it("escalates amber to red when warranty is missing", () => {
    const flag = makeFlag({
      severity: "amber",
      label: "Labor Warranty",
      detail: "Warranty terms not found in the estimate.",
    });
    expect(resolveEffectiveSeverity(flag)).toBe("red");
  });

  it("escalates green to red when cancellation is absent", () => {
    const flag = makeFlag({
      severity: "green",
      label: "Cancellation Policy",
      detail: "Cancellation clause is missing from the contract.",
    });
    expect(resolveEffectiveSeverity(flag)).toBe("red");
  });

  it("escalates green to red when insurance is missing", () => {
    const flag = makeFlag({
      severity: "green",
      label: "Proof of Insurance",
      detail: "No evidence of insurance documentation.",
    });
    expect(resolveEffectiveSeverity(flag)).toBe("red");
  });

  // ── Amber overrides ──

  it("escalates green to amber when permit is missing", () => {
    const flag = makeFlag({
      severity: "green",
      label: "Permit Handling",
      detail: "No mention of permits in the quote.",
    });
    expect(resolveEffectiveSeverity(flag)).toBe("amber");
  });

  it("escalates green to amber when timeline is unclear", () => {
    const flag = makeFlag({
      severity: "green",
      label: "Project Timeline",
      detail: "Start date not specified.",
    });
    expect(resolveEffectiveSeverity(flag)).toBe("amber");
  });

  // ── Catch-all escalation ──

  it("escalates green to amber when any negative trigger is present on unknown topic", () => {
    const flag = makeFlag({
      severity: "green",
      label: "Material Specifications",
      detail: "Glass type is unspecified in the document.",
    });
    expect(resolveEffectiveSeverity(flag)).toBe("amber");
  });

  // ── No change cases ──

  it("preserves red severity when negative trigger is present", () => {
    const flag = makeFlag({
      severity: "red",
      label: "Critical Issue",
      detail: "Important protection is missing.",
    });
    expect(resolveEffectiveSeverity(flag)).toBe("red");
  });

  it("preserves amber severity when negative trigger is present on unknown topic", () => {
    const flag = makeFlag({
      severity: "amber",
      label: "Something",
      detail: "Details are unclear.",
    });
    expect(resolveEffectiveSeverity(flag)).toBe("amber");
  });

  it("preserves green severity when no negative trigger is present", () => {
    const flag = makeFlag({
      severity: "green",
      label: "Warranty Included",
      detail: "Full 10-year manufacturer warranty confirmed in writing.",
    });
    expect(resolveEffectiveSeverity(flag)).toBe("green");
  });

  it("preserves red severity when no negative trigger is present", () => {
    const flag = makeFlag({
      severity: "red",
      label: "Excessive Pricing",
      detail: "Total is 40% above county benchmark.",
    });
    expect(resolveEffectiveSeverity(flag)).toBe("red");
  });

  it("preserves amber severity when no negative trigger is present", () => {
    const flag = makeFlag({
      severity: "amber",
      label: "Deposit Structure",
      detail: "Deposit of 30% requested upfront.",
    });
    expect(resolveEffectiveSeverity(flag)).toBe("amber");
  });

  // ── Punctuation normalization ──

  it("handles punctuation-heavy text correctly", () => {
    const flag = makeFlag({
      severity: "green",
      label: "License/Verification",
      detail: "License: not found (contractor's license is missing).",
    });
    expect(resolveEffectiveSeverity(flag)).toBe("red");
  });

  // ── Token safety (no raw .includes('no') false positives) ──

  it("does NOT escalate when 'no' appears as part of another word", () => {
    const flag = makeFlag({
      severity: "green",
      label: "NOA Compliance",
      detail: "Notice of Acceptance confirmed for all products.",
    });
    expect(resolveEffectiveSeverity(flag)).toBe("green");
  });

  it("does NOT escalate on 'not' as part of 'notation'", () => {
    const flag = makeFlag({
      severity: "green",
      label: "Notation Present",
      detail: "Notation confirmed in specifications section.",
    });
    expect(resolveEffectiveSeverity(flag)).toBe("green");
  });
});
