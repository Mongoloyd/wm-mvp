export function createMockQuote(overrides: Record<string, unknown> = {}) {
  const id = globalThis.crypto.randomUUID();

  const baseData = {
    contractor_name: `Test Contractor ${id.slice(0, 4)}`,
    price_per_window: Math.floor(Math.random() * 400) + 300,
    warranty_length: Math.random() > 0.5 ? "Lifetime" : "10 years",
    missing_specs: [] as string[],
    address: "123 Test Lane",
    city: "Pompano Beach",
    state: "FL",
    zip: "33062",
    ...overrides,
  };

  const content = `FAKE_QUOTE_${id}\n${JSON.stringify(baseData, null, 2)}`;
  const file = new File([content], `mock-quote-${id.slice(0, 8)}.txt`, { type: "text/plain" });

  return { id, file, extracted: baseData };
}
