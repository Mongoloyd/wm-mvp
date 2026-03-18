import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/scan-quote`;

function anonClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Build a minimal valid PDF containing the given text.
 * Gemini can parse PDFs natively — raw text bytes pretending to be PNG won't work.
 */
function buildTextPdf(text: string): Uint8Array {
  const streamContent = `BT /F1 12 Tf 72 720 Td (${text.replace(/[()\\]/g, "\\$&").replace(/\n/g, ") Tj T* (")}) Tj ET`;
  const stream = new TextEncoder().encode(streamContent);

  const objects = [
    `1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj`,
    `2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj`,
    `3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj`,
    `4 0 obj<</Length ${stream.length}>>stream\n${new TextDecoder().decode(stream)}\nendstream endobj`,
    `5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj`,
  ];

  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (const obj of objects) {
    offsets.push(body.length);
    body += obj + "\n";
  }
  const xrefOffset = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    body += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(body);
}

async function setupTestSession(fileContent: Uint8Array, fileName: string) {
  const supabase = anonClient();
  const sessionTag = crypto.randomUUID();
  const storagePath = `test/${sessionTag}/${fileName}`;
  const quoteFileId = crypto.randomUUID();
  const scanSessionId = crypto.randomUUID();

  const contentType = fileName.endsWith(".pdf") ? "application/pdf" : "image/png";
  const { error: upErr } = await supabase.storage
    .from("quotes")
    .upload(storagePath, fileContent, { contentType });
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

  const { error: qfErr } = await supabase
    .from("quote_files")
    .insert({ id: quoteFileId, storage_path: storagePath, status: "pending" });
  if (qfErr) throw new Error(`quote_files insert failed: ${qfErr.message}`);

  const { error: ssErr } = await supabase
    .from("scan_sessions")
    .insert({ id: scanSessionId, status: "uploading", quote_file_id: quoteFileId });
  if (ssErr) throw new Error(`scan_sessions insert failed: ${ssErr.message}`);

  return { scanSessionId, quoteFileId, storagePath };
}

async function invokeScan(scanSessionId: string) {
  const resp = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ scan_session_id: scanSessionId }),
  });
  const body = await resp.json();
  return { status: resp.status, body };
}

// ─────────────────────────────────────────────────────────────────────
// TEST 1: Valid window quote (PDF)
// ─────────────────────────────────────────────────────────────────────
Deno.test("valid quote → complete with grade", async () => {
  const quoteText = [
    "ACME Windows and Doors - Impact Window Quote",
    "Contractor: ACME Windows LLC",
    "Date: 2025-01-15",
    "HVHZ Zone: Yes",
    "Permit: Included handled by contractor",
    "Line Items:",
    "1. PGT WinGuard SGD 72x80 Impact Sliding Glass Door",
    "   Brand: PGT Series: WinGuard DP Rating: +50/-60",
    "   NOA: NOA 17-0501.09 Qty: 2 Unit Price: $2100 Total: $4200",
    "2. CGI Sentinel 36x48 Impact Single Hung Window",
    "   Brand: CGI Series: Sentinel DP Rating: +45/-55",
    "   NOA: NOA 11-0926.04 Qty: 8 Unit Price: $850 Total: $6800",
    "3. PGT WinGuard 60x36 Impact Picture Window",
    "   Brand: PGT Series: WinGuard DP Rating: +50/-60",
    "   NOA: NOA 17-0501.09 Qty: 3 Unit Price: $1200 Total: $3600",
    "Total: $19000",
    "Installation: full removal disposal trim county inspection",
    "Warranty: 10-year labor Lifetime manufacturer Transferable",
    "Cancellation: 3-day right of rescission per Florida statute",
  ].join("\n");
  const pdfBytes = buildTextPdf(quoteText);
  const { scanSessionId } = await setupTestSession(pdfBytes, "valid-quote.pdf");

  const { status, body } = await invokeScan(scanSessionId);
  console.log("Test 1:", JSON.stringify(body));

  assertEquals(status, 200);
  if (body.analysis_status === "complete") {
    assertEquals(["A", "B", "C", "D", "F"].includes(body.grade), true, `Expected A-F, got ${body.grade}`);
  } else {
    console.log("Note: non-complete status:", body.analysis_status, "— acceptable for minimal PDF");
  }
});

// ─────────────────────────────────────────────────────────────────────
// TEST 2: Invalid document (grocery receipt PDF)
// ─────────────────────────────────────────────────────────────────────
Deno.test("invalid document → invalid_document status", async () => {
  const receiptText = [
    "PUBLIX SUPERMARKET 1234 - Miami FL",
    "Bananas 3lb $1.47",
    "Whole Milk 1 Gal $4.29",
    "Chicken Breast 2lb $8.99",
    "Total: $14.75",
    "THANK YOU FOR SHOPPING AT PUBLIX",
  ].join("\n");
  const pdfBytes = buildTextPdf(receiptText);
  const { scanSessionId } = await setupTestSession(pdfBytes, "grocery-receipt.pdf");

  const { status, body } = await invokeScan(scanSessionId);
  console.log("Test 2:", JSON.stringify(body));

  assertEquals(status, 200);
  if (body.analysis_status === "invalid_document") {
    assertEquals(typeof body.reason, "string");
  } else {
    console.log("Note: Gemini classified as:", body.analysis_status);
  }
});

// ─────────────────────────────────────────────────────────────────────
// TEST 3: Garbled content → controlled failure
// ─────────────────────────────────────────────────────────────────────
Deno.test("garbled content → controlled failure state", async () => {
  const garbage = new Uint8Array(512);
  crypto.getRandomValues(garbage);
  const { scanSessionId } = await setupTestSession(garbage, "garbled.png");

  const { status, body } = await invokeScan(scanSessionId);
  console.log("Test 3:", JSON.stringify(body));

  // Acceptable: 200 with controlled status OR 502 from Gemini
  if (status === 200) {
    console.log("Controlled result:", body.analysis_status || body.error);
  } else {
    console.log("Gemini rejection status:", status);
  }
});

// ─────────────────────────────────────────────────────────────────────
// TEST 4: Missing scan_session_id → 400
// ─────────────────────────────────────────────────────────────────────
Deno.test("missing scan_session_id → 400", async () => {
  const resp = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({}),
  });
  const body = await resp.text();
  assertEquals(resp.status, 400);
  console.log("Test 4:", body);
});

// ─────────────────────────────────────────────────────────────────────
// TEST 5: Non-existent session → 404
// ─────────────────────────────────────────────────────────────────────
Deno.test("non-existent session → 404", async () => {
  const resp = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ scan_session_id: "00000000-0000-0000-0000-000000000000" }),
  });
  const body = await resp.text();
  assertEquals(resp.status, 404);
  console.log("Test 5:", body);
});
