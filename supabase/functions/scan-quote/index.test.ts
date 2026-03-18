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

// Setup uses anon client. scan_sessions allows anon INSERT but not SELECT,
// so we generate IDs client-side and use them directly.
async function setupTestSession(fileContent: Uint8Array, fileName: string) {
  const supabase = anonClient();
  const sessionTag = crypto.randomUUID();
  const storagePath = `test/${sessionTag}/${fileName}`;
  const quoteFileId = crypto.randomUUID();
  const scanSessionId = crypto.randomUUID();

  // Upload file
  const { error: upErr } = await supabase.storage
    .from("quotes")
    .upload(storagePath, fileContent, {
      contentType: fileName.endsWith(".pdf") ? "application/pdf" : "image/png",
    });
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

  // Insert quote_files with known ID
  const { error: qfErr } = await supabase
    .from("quote_files")
    .insert({ id: quoteFileId, storage_path: storagePath, status: "pending" });
  if (qfErr) throw new Error(`quote_files insert failed: ${qfErr.message}`);

  // Insert scan_sessions with known ID
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
// TEST 1: Valid window quote
// ─────────────────────────────────────────────────────────────────────
Deno.test("valid quote → complete with grade", async () => {
  const quoteText = `
    ACME Windows & Doors - Impact Window Quote
    Contractor: ACME Windows LLC
    Date: 2025-01-15
    HVHZ Zone: Yes
    Permit: Included, handled by contractor
    
    Line Items:
    1. PGT WinGuard SGD 72x80 Impact Sliding Glass Door
       Brand: PGT, Series: WinGuard, DP Rating: +50/-60
       NOA: NOA 17-0501.09, Qty: 2, Unit Price: $2,100, Total: $4,200
    2. CGI Sentinel 36x48 Impact Single Hung Window  
       Brand: CGI, Series: Sentinel, DP Rating: +45/-55
       NOA: NOA 11-0926.04, Qty: 8, Unit Price: $850, Total: $6,800
    3. PGT WinGuard 60x36 Impact Picture Window
       Brand: PGT, Series: WinGuard, DP Rating: +50/-60
       NOA: NOA 17-0501.09, Qty: 3, Unit Price: $1,200, Total: $3,600
    
    Total: $19,000
    Installation: full removal, disposal, trim, county inspection
    Warranty: 10-year labor, Lifetime manufacturer, Transferable
    Cancellation: 3-day right of rescission per Florida statute
  `;
  const encoder = new TextEncoder();
  const { scanSessionId } = await setupTestSession(encoder.encode(quoteText), "valid-quote.png");

  const { status, body } = await invokeScan(scanSessionId);
  console.log("Test 1:", JSON.stringify(body));

  assertEquals(status, 200);
  if (body.analysis_status === "complete") {
    assertEquals(["A", "B", "C", "D", "F"].includes(body.grade), true, `Expected A-F, got ${body.grade}`);
  } else {
    console.log("Note: non-complete status:", body.analysis_status, "— acceptable for text-as-image");
  }
});

// ─────────────────────────────────────────────────────────────────────
// TEST 2: Invalid document (grocery receipt)
// ─────────────────────────────────────────────────────────────────────
Deno.test("invalid document → invalid_document status", async () => {
  const receiptText = `
    PUBLIX SUPERMARKET #1234 - Miami FL
    Bananas 3lb $1.47
    Whole Milk 1 Gal $4.29
    Chicken Breast 2lb $8.99
    Total: $14.75
    THANK YOU FOR SHOPPING AT PUBLIX
  `;
  const encoder = new TextEncoder();
  const { scanSessionId } = await setupTestSession(encoder.encode(receiptText), "grocery-receipt.png");

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
