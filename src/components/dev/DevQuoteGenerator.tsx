// /components/dev/DevQuoteGenerator.tsx
// This component NEVER renders in production.

import { createMockQuote } from "@/tests/utils/createMockQuote";
import { uploadQuote } from "@/lib/quoteUploader";
import { useState } from "react";

const SCENARIOS = {
  lowSafety: {
    missing_specs: ["HVHZ", "DP rating"],
    price_per_window: 299
  },
  vagueScope: {
    missing_specs: ["flashing", "sealing", "disposal"]
  },
  missingWarranty: {
    warranty_length: null
  },
  overpaymentTrap: {
    price_per_window: 1200,
    warranty_length: "Lifetime"
  },
  cornerCutting: {
    price_per_window: 199,
    missing_specs: ["glass thickness", "lamination"]
  },
  insuranceSensitive: {
    missing_specs: ["stucco sealant"],
    user_context: { timeline: "ASAP" }
  },
  finePrintTrap: {
    missing_specs: ["change orders", "permit fees"]
  }
};

export function DevQuoteGenerator() {
  const [status, setStatus] = useState("");

  if (process.env.NODE_ENV !== "development") return null;

  const handleGenerate = async (scenarioKey) => {
    setStatus("Generating…");

    const overrides = SCENARIOS[scenarioKey];
    const mock = createMockQuote(overrides);

    try {
      await uploadQuote(mock.file);
      setStatus(`Uploaded mock quote: ${scenarioKey}`);
    } catch (err) {
      setStatus("Error uploading mock quote");
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 16, border: "1px dashed #999", marginTop: 24 }}>
      <h3>🧪 Dev Quote Generator</h3>
      <p>Generate and upload a mock quote for testing.</p>

      {Object.keys(SCENARIOS).map((key) => (
        <button
          key={key}
          onClick={() => handleGenerate(key)}
          style={{
            marginRight: 8,
            marginBottom: 8,
            padding: "6px 12px",
            background: "#eee",
            borderRadius: 4
          }}
        >
          {key}
        </button>
      ))}

      <p style={{ marginTop: 12, fontStyle: "italic" }}>{status}</p>
    </div>
  );
}
