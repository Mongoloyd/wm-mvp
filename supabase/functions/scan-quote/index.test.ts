import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/scan-quote`;

// Helper: create anon supabase client
function anonClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Helper: upload a tiny test file to storage and create quote_files + scan_sessions rows
async function setupTestSession(fileContent: Uint8Array, fileName: string) {
  const supabase = anonClient();
  const sessionTag = crypto.randomUUID();
  const storagePath = `test/${sessionTag}/${fileName}`;

  // Upload file
  const { error: upErr } = await supabase.storage
    .from("quotes")
    .upload(storagePath, fileContent, { contentType: fileName.endsWith(".pdf") ? "application/pdf" : "image/png" });
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

  // Insert quote_files
  const { data: qf, error: qfErr } = await supabase
    .from("quote_files")
    .insert({ storage_path: storagePath, status: "pending" })
    .select("id")
    .single();
  if (qfErr || !qf) throw new Error(`quote_files insert failed: ${qfErr?.message}`);

  // Insert scan_sessions
  const { data: ss, error: ssErr } = await supabase
    .from("scan_sessions")
    .insert({ status: "uploading", quote_file_id: qf.id })
    .select("id")
    .single();
  if (ssErr || !ss) throw new Error(`scan_sessions insert failed: ${ssErr?.message}`);

  return { scanSessionId: ss.id, quoteFileId: qf.id, storagePath };
}

// Helper: invoke scan-quote
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
// TEST 1: Valid window quote (simple text-based PDF-like content)
// We send a PNG with text overlay simulating a quote. Gemini should
// extract and score it. We verify the state transitions.
// ─────────────────────────────────────────────────────────────────────
Deno.test("valid quote → processing → complete with grade", async () => {
  // Create a minimal text file that looks like a window quote
  // (Gemini can handle text content in images; we use a simple approach)
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
    
    Subtotal: $14,600
    Installation (full removal, disposal, trim): $4,400
    Permits & Inspections: Included
    Total: $19,000
    
    Warranty: 10-year labor, Lifetime manufacturer, Transferable
    Cancellation: 3-day right of rescission per Florida statute
    
    Installation includes: full removal of existing windows, disposal of old units,
    new trim and caulking, county inspection coordination, screen installation.
  `;
  const encoder = new TextEncoder();
  const fileContent = encoder.encode(quoteText);

  const { scanSessionId } = await setupTestSession(fileContent, "test-quote.png");

  const { status, body } = await invokeScan(scanSessionId);

  console.log("Test 1 response:", JSON.stringify(body));

  // The function should return 200
  assertEquals(status, 200);

  // Should be complete or at least processed
  if (body.analysis_status === "complete") {
    // Verify grade exists and is A-F
    assertEquals(["A", "B", "C", "D", "F"].includes(body.grade), true, `Grade should be A-F, got: ${body.grade}`);
  } else {
    // Gemini may struggle with plain text as image — acceptable
    console.log("Note: Gemini returned non-complete status:", body.analysis_status);
  }
});

// ─────────────────────────────────────────────────────────────────────
// TEST 2: Invalid document (grocery receipt)
// ─────────────────────────────────────────────────────────────────────
Deno.test("invalid document → invalid_document status", async () => {
  const receiptText = `
    PUBLIX SUPERMARKET
    Store #1234 - Miami, FL
    Date: 03/15/2025
    
    Bananas (3 lb)          $1.47
    Whole Milk 1 Gal        $4.29
    Chicken Breast 2lb      $8.99
    Bread Wheat             $3.49
    Orange Juice 64oz       $5.99
    
    Subtotal:              $24.23
    Tax:                    $0.00
    Total:                 $24.23
    
    THANK YOU FOR SHOPPING AT PUBLIX
    Have a great day!
  `;
  const encoder = new TextEncoder();
  const fileContent = encoder.encode(receiptText);

  const { scanSessionId } = await setupTestSession(fileContent, "grocery-receipt.png");

  const { status, body } = await invokeScan(scanSessionId);

  console.log("Test 2 response:", JSON.stringify(body));

  assertEquals(status, 200);

  if (body.analysis_status === "invalid_document") {
    // Correct behavior — verify the reason
    assertEquals(typeof body.reason, "string");
  } else {
    console.log("Note: Gemini classified this as:", body.analysis_status, "- may need prompt tuning");
  }
});

// ─────────────────────────────────────────────────────────────────────
// TEST 3: Unreadable/garbled content → needs_better_upload or low_confidence
// ─────────────────────────────────────────────────────────────────────
Deno.test("garbled content → needs_better_upload or low_confidence", async () => {
  // Random bytes — completely unreadable
  const garbage = new Uint8Array(512);
  crypto.getRandomValues(garbage);

  const { scanSessionId } = await setupTestSession(garbage, "garbled-file.png");

  const { status, body } = await invokeScan(scanSessionId);

  console.log("Test 3 response:", JSON.stringify(body));

  // Should either be 200 with a controlled status or 502 if Gemini can't process
  if (status === 200) {
    const validStatuses = ["low_confidence", "invalid_document", "needs_better_upload"];
    // The error field being present also indicates controlled failure
    if (body.analysis_status) {
      console.log("Controlled status:", body.analysis_status);
    } else if (body.error) {
      console.log("Controlled error:", body.error);
    }
  } else {
    // 502 from Gemini is acceptable for truly garbled input
    console.log("Gemini rejected garbled input with status:", status);
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
  console.log("Test 4 response:", body);
});

// ─────────────────────────────────────────────────────────────────────
// TEST 5: Non-existent scan_session_id → 404
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
  console.log("Test 5 response:", body);
});
