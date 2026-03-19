// /components/dev/DevQuoteGenerator.tsx
// This component NEVER renders in production.

import { createMockQuote } from "@/test/createMockQuote";
import { useState } from "react";

const SCENARIOS: Record<string, Record<string, unknown>> = {
  lowSafety: { missing_specs: ["HVHZ", "DP rating"], price_per_window: 299 },
  vagueScope: { missing_specs: ["flashing", "sealing", "disposal"] },
  missingWarranty: { warranty_length: null },
  overpaymentTrap: { price_per_window: 1200, warranty_length: "Lifetime" },
  cornerCutting: { price_per_window: 199, missing_specs: ["glass thickness", "lamination"] },
  insuranceSensitive: { missing_specs: ["stucco sealant"], user_context: { timeline: "ASAP" } },
  finePrintTrap: { missing_specs: ["change orders", "permit fees"] },
};

export function DevQuoteGenerator() {
  const [status, setStatus] = useState("");

  if (!import.meta.env.DEV) return null;

  const handleGenerate = (scenarioKey: string) => {
    const overrides = SCENARIOS[scenarioKey];
    const mock = createMockQuote(overrides);
    setStatus(`Generated mock quote: ${scenarioKey} (${mock.id.slice(0, 8)})`);
    console.log("🧪 Mock quote generated:", mock);
  };

  return (
    <div style={{ padding: 16, border: "1px dashed #999", marginTop: 24 }}>
      <h3>🧪 Dev Quote Generator</h3>
      <p>Generate a mock quote for testing.</p>
      {Object.keys(SCENARIOS).map((key) => (
        <button key={key} onClick={() => handleGenerate(key)}
          style={{ marginRight: 8, marginBottom: 8, padding: "6px 12px", background: "#eee", borderRadius: 4 }}>
          {key}
        </button>
      ))}
      <p style={{ marginTop: 12, fontStyle: "italic" }}>{status}</p>
    </div>
  );
}
