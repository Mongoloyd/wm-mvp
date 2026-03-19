import sampleQuoteUrl from "./sample-quote.png";

let cachedBlob: Blob | null = null;

async function getSampleQuoteBlob(): Promise<Blob> {
  if (cachedBlob) return cachedBlob;
  const res = await fetch(sampleQuoteUrl);
  cachedBlob = await res.blob();
  return cachedBlob;
}

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

  // Synchronous fallback file (tiny PNG) — use getFile() for the real sample
  const fallbackBytes = new Uint8Array([
    0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,
    0x00,0x00,0x00,0x0d,0x49,0x48,0x44,0x52,
    0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,0x08,0x06,0x00,0x00,0x00,0x1f,0x15,0xc4,0x89,
    0x00,0x00,0x00,0x0a,0x49,0x44,0x41,0x54,
    0x78,0x9c,0x62,0x00,0x00,0x00,0x02,0x00,0x01,0xe5,0x27,0xde,0xfc,
    0x00,0x00,0x00,0x00,0x49,0x45,0x4e,0x44,0xae,0x42,0x60,0x82,
  ]);
  const file = new File([fallbackBytes], `mock-quote-${id.slice(0, 8)}.png`, { type: "image/png" });

  return {
    id,
    file,
    extracted: baseData,
    /** Returns a File with the real sample quote image for OCR testing */
    getFile: async (): Promise<File> => {
      const blob = await getSampleQuoteBlob();
      return new File([blob], `sample-quote-${id.slice(0, 8)}.png`, { type: "image/png" });
    },
  };
}
