import { randomUUID } from "crypto";

export function createMockQuote(overrides = {}) {
  const id = randomUUID();

  // Fake extracted fields that your OCR pipeline expects
  const baseData = {
    contractor_name: `Test Contractor ${id.slice(0, 4)}`,
    price_per_window: Math.floor(Math.random() * 400) + 300, // 300–700
    warranty_length: Math.random() > 0.5 ? "Lifetime" : "10 years",
    missing_specs: [],
    address: "123 Test Lane",
    city: "Pompano Beach",
    state: "FL",
    zip: "33062",
    ...overrides
  };

  // Fake PDF or image buffer (your tests don’t need a real PDF)
  const fakeFile = Buffer.from(
    `FAKE_QUOTE_${id}\n${JSON.stringify(baseData, null, 2)}`
  );

  return {
    id,
    file: fakeFile,
    extracted: baseData
  };
}
