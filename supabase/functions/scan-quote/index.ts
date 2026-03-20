// ═══════════════════════════════════════════════════════════════════════════════
// SCANNER BRAIN — scan-quote Edge Function
// Orchestrates: file download → Gemini extraction → Zod validation →
//               deterministic scoring → analyses upsert
// Uses: Direct Gemini API via GEMINI_API_KEY
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: SCHEMA (Zod-like runtime validation — manual for Deno compat)
// ═══════════════════════════════════════════════════════════════════════════════

interface LineItem {
  description: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  brand?: string;
  series?: string;
  dp_rating?: string;
  noa_number?: string;
  dimensions?: string;
}

interface ExtractionResult {
  document_type: string;
  is_window_door_related: boolean;
  confidence: number;
  page_count?: number;
  line_items: LineItem[];
  warranty?: {
    labor_years?: number;
    manufacturer_years?: number;
    transferable?: boolean;
    details?: string;
  };
  permits?: {
    included?: boolean;
    responsible_party?: string;
    details?: string;
  };
  installation?: {
    scope_detail?: string;
    disposal_included?: boolean;
    accessories_mentioned?: boolean;
  };
  cancellation_policy?: string;
  total_quoted_price?: number;
  opening_count?: number;
  contractor_name?: string;
  hvhz_zone?: boolean;
}

/**
 * Light pre-validation: only checks document-level fields exist.
 * Used before full schema validation to catch invalid documents early.
 */
function validateDocumentClassification(raw: unknown): { success: true; data: Record<string, unknown> } | { success: false; error: string } {
  if (!raw || typeof raw !== "object") return { success: false, error: "Not an object" };
  const obj = raw as Record<string, unknown>;

  if (typeof obj.document_type !== "string") return { success: false, error: "Missing document_type" };
  if (typeof obj.is_window_door_related !== "boolean") return { success: false, error: "Missing is_window_door_related" };
  if (typeof obj.confidence !== "number" || obj.confidence < 0 || obj.confidence > 1) return { success: false, error: "Invalid confidence" };

  return { success: true, data: obj };
}

/**
 * Full extraction validation: ensures line_items and detailed fields are present.
 * Only called AFTER document is confirmed as window/door related.
 */
function validateExtraction(raw: unknown): { success: true; data: ExtractionResult } | { success: false; error: string } {
  if (!raw || typeof raw !== "object") return { success: false, error: "Not an object" };
  const obj = raw as Record<string, unknown>;

  if (typeof obj.document_type !== "string") return { success: false, error: "Missing document_type" };
  if (typeof obj.is_window_door_related !== "boolean") return { success: false, error: "Missing is_window_door_related" };
  if (typeof obj.confidence !== "number" || obj.confidence < 0 || obj.confidence > 1) return { success: false, error: "Invalid confidence" };
  if (!Array.isArray(obj.line_items)) return { success: false, error: "Missing line_items array" };

  for (const item of obj.line_items) {
    if (!item || typeof item !== "object" || typeof (item as Record<string, unknown>).description !== "string") {
      return { success: false, error: "Invalid line_item" };
    }
  }

  return { success: true, data: raw as ExtractionResult };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: RUBRIC (weights, thresholds, hard caps)
// ═══════════════════════════════════════════════════════════════════════════════

const RUBRIC_VERSION = "1.0.0";

const PILLAR_WEIGHTS = {
  safety: 0.25,
  install: 0.20,
  price: 0.20,
  finePrint: 0.20,
  warranty: 0.15,
};

const GRADE_THRESHOLDS: Record<string, number> = { A: 85, B: 70, C: 55, D: 40 };

const CONFIDENCE_THRESHOLD = 0.4;

// Numeric rank for grade comparison — higher = better
const GRADE_RANK: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, F: 1 };

function letterGrade(score: number): string {
  if (score >= GRADE_THRESHOLDS.A) return "A";
  if (score >= GRADE_THRESHOLDS.B) return "B";
  if (score >= GRADE_THRESHOLDS.C) return "C";
  if (score >= GRADE_THRESHOLDS.D) return "D";
  return "F";
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: SCORING (deterministic pillar math)
// ═══════════════════════════════════════════════════════════════════════════════

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function scoreSafety(data: ExtractionResult): number {
  let score = 100;
  const items = data.line_items;
  const itemsWithoutDp = items.filter(i => !i.dp_rating);
  const itemsWithoutNoa = items.filter(i => !i.noa_number);

  if (itemsWithoutDp.length > 0) score -= Math.min(40, itemsWithoutDp.length * 20);
  if (itemsWithoutNoa.length > 0) score -= Math.min(30, itemsWithoutNoa.length * 15);
  if (data.hvhz_zone === undefined || data.hvhz_zone === null) score -= 10;

  // Check if any items clearly mention "impact" in description
  const hasImpactMention = items.some(i =>
    /impact|hurricane|storm/i.test(i.description || "")
  );
  if (!hasImpactMention && items.length > 0) score -= 25;

  return clamp(score);
}

function scoreInstall(data: ExtractionResult): number {
  let score = 100;
  if (!data.installation?.scope_detail) score -= 25;
  if (!data.permits || data.permits.included === undefined) score -= 20;
  if (!data.installation?.disposal_included) score -= 15;
  if (!data.opening_count && data.line_items.length === 0) score -= 10;
  if (!data.installation?.accessories_mentioned) score -= 5;
  return clamp(score);
}

function scorePrice(data: ExtractionResult): number {
  let score = 100;
  const items = data.line_items;
  const itemsWithoutPrice = items.filter(i => i.unit_price === undefined && i.total_price === undefined);

  if (itemsWithoutPrice.length > 0) score -= Math.min(40, itemsWithoutPrice.length * 20);
  if (!data.total_quoted_price) score -= 15;

  // Basic anomaly: if per-unit price exists, flag extremes
  for (const item of items) {
    if (item.unit_price !== undefined) {
      if (item.unit_price < 100) score -= 10; // suspiciously low for impact windows
      if (item.unit_price > 5000) score -= 10; // suspiciously high per unit
    }
  }

  return clamp(score);
}

function scoreFinePrint(data: ExtractionResult): number {
  let score = 100;
  if (!data.cancellation_policy) score -= 20;

  const items = data.line_items;
  const vague = items.filter(i => (i.description || "").length < 10);
  score -= Math.min(30, vague.length * 15);

  const unbranded = items.filter(i => !i.brand && !i.series);
  score -= Math.min(30, unbranded.length * 15);

  return clamp(score);
}

function scoreWarranty(data: ExtractionResult): number {
  let score = 100;
  if (!data.warranty) return clamp(score - 40);
  if (data.warranty.labor_years === undefined) score -= 20;
  if (data.warranty.manufacturer_years === undefined) score -= 20;
  if (data.warranty.transferable === undefined) score -= 10;
  if (!data.warranty.details) score -= 10;
  return clamp(score);
}

interface PillarScores {
  safety: number;
  install: number;
  price: number;
  finePrint: number;
  warranty: number;
}

interface GradeResult {
  weightedAverage: number;
  letterGrade: string;
  hardCapApplied: string | null;
  pillarScores: PillarScores;
}

type PreviewPillarStatus = "pass" | "warn" | "fail";

interface PreviewPillarScores {
  safety_code: { status: PreviewPillarStatus };
  install_scope: { status: PreviewPillarStatus };
  price_fairness: { status: PreviewPillarStatus };
  fine_print: { status: PreviewPillarStatus };
  warranty: { status: PreviewPillarStatus };
}

function computeGrade(data: ExtractionResult): GradeResult {
  const pillarScores: PillarScores = {
    safety: scoreSafety(data),
    install: scoreInstall(data),
    price: scorePrice(data),
    finePrint: scoreFinePrint(data),
    warranty: scoreWarranty(data),
  };

  let weightedAvg =
    pillarScores.safety * PILLAR_WEIGHTS.safety +
    pillarScores.install * PILLAR_WEIGHTS.install +
    pillarScores.price * PILLAR_WEIGHTS.price +
    pillarScores.finePrint * PILLAR_WEIGHTS.finePrint +
    pillarScores.warranty * PILLAR_WEIGHTS.warranty;

  weightedAvg = Math.round(weightedAvg * 100) / 100;

  let grade = letterGrade(weightedAvg);
  let hardCapApplied: string | null = null;

  // Hard cap: no impact product mentions
  const hasImpact = data.line_items.some(i => /impact|hurricane|storm/i.test(i.description || ""));
  if (!hasImpact && data.line_items.length > 0) {
    if (GRADE_RANK[grade] <= GRADE_RANK["D"]) { /* already at or below D */ }
    else { grade = "D"; hardCapApplied = "no_impact_products"; }
  }

  // Hard cap: zero line items
  if (data.line_items.length === 0) {
    grade = "F";
    hardCapApplied = "zero_line_items";
  }

  return { weightedAverage: weightedAvg, letterGrade: grade, hardCapApplied, pillarScores };
}

function toPreviewPillarStatus(score: number): PreviewPillarStatus {
  if (score >= GRADE_THRESHOLDS.B) return "pass";
  if (score >= GRADE_THRESHOLDS.D) return "warn";
  return "fail";
}

function buildPreviewPillarScores(pillarScores: PillarScores): PreviewPillarScores {
  return {
    // Preview stays teaser-safe: expose only coarse bands, not the exact numeric internals.
    safety_code: { status: toPreviewPillarStatus(pillarScores.safety) },
    install_scope: { status: toPreviewPillarStatus(pillarScores.install) },
    price_fairness: { status: toPreviewPillarStatus(pillarScores.price) },
    fine_print: { status: toPreviewPillarStatus(pillarScores.finePrint) },
    warranty: { status: toPreviewPillarStatus(pillarScores.warranty) },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: FORENSIC (red flag detection)
// ═══════════════════════════════════════════════════════════════════════════════

interface Flag {
  flag: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  pillar: string;
  detail: string;
}

function detectFlags(data: ExtractionResult): Flag[] {
  const flags: Flag[] = [];
  const items = data.line_items;

  // Safety flags
  const noDp = items.filter(i => !i.dp_rating);
  if (noDp.length > 0) {
    flags.push({ flag: "missing_dp_rating", severity: "High", pillar: "safety", detail: `${noDp.length} item(s) missing DP rating` });
  }
  const noNoa = items.filter(i => !i.noa_number);
  if (noNoa.length > 0) {
    flags.push({ flag: "missing_noa_number", severity: "Medium", pillar: "safety", detail: `${noNoa.length} item(s) missing NOA number` });
  }

  // Install flags
  if (!data.permits || data.permits.included === undefined) {
    flags.push({ flag: "no_permits_mentioned", severity: "High", pillar: "install", detail: "No permit responsibility stated" });
  }
  if (!data.installation?.scope_detail) {
    flags.push({ flag: "vague_install_scope", severity: "Medium", pillar: "install", detail: "Installation scope is vague or missing" });
  }

  // Price flags
  const noPrice = items.filter(i => i.unit_price === undefined && i.total_price === undefined);
  if (noPrice.length > 0) {
    flags.push({ flag: "missing_line_item_pricing", severity: "High", pillar: "price", detail: `${noPrice.length} item(s) missing pricing` });
  }

  // Fine print flags
  if (!data.cancellation_policy) {
    flags.push({ flag: "no_cancellation_policy", severity: "Low", pillar: "finePrint", detail: "No cancellation policy found" });
  }
  const unbranded = items.filter(i => !i.brand && !i.series);
  if (unbranded.length > 0) {
    flags.push({ flag: "unspecified_brand", severity: "Medium", pillar: "finePrint", detail: `${unbranded.length} item(s) with unspecified brand/series` });
  }

  // Warranty flags
  if (!data.warranty) {
    flags.push({ flag: "no_warranty_section", severity: "High", pillar: "warranty", detail: "No warranty information found" });
  }

  return flags;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: ORCHESTRATION (HTTP handler)
type ScanSessionStatus = "idle" | "uploading" | "processing" | "preview_ready" | "complete" | "invalid_document" | "needs_better_upload" | "error";
// ═══════════════════════════════════════════════════════════════════════════════

// CRASH RECOVERY:
// If this function crashes after setting status='processing', the session
// stays in 'processing' with no analyses row. A recovery sweep can detect
// sessions stuck in 'processing' for >N minutes and re-invoke this function.
// The upsert pattern on analyses ensures re-invocation is safe (idempotent).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function updateScanSessionStatus(
  supabase: ReturnType<typeof createClient>,
  scanSessionId: string,
  status: ScanSessionStatus,
  logMessage: string,
  failureBody?: Record<string, unknown>,
): Promise<{ success: true } | { success: false; response: Response }> {
  const { data, error } = await supabase
    .from("scan_sessions")
    .update({ status })
    .eq("id", scanSessionId)
    .select("id");

  if (error) {
    console.error(logMessage, error);
    return {
      success: false,
      response: jsonResponse(
        failureBody ?? {
          error: "Failed to persist scan session state",
          scan_session_id: scanSessionId,
        },
        500,
      ),
    };
  }

  if (!data || data.length === 0) {
    console.error(
      `${logMessage} — no scan_sessions row updated for id=${scanSessionId}`,
    );
    return {
      success: false,
      response: jsonResponse(failureBody ?? {
        error: "Failed to persist scan session state",
        scan_session_id: scanSessionId,
        analysis_status: "processing",
        scan_session_status: "processing",
      }, 500),
    };
  }

  return { success: true };
}

export async function upsertAnalysisRecord(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
  logMessage: string,
  failureBody: Record<string, unknown>,
  status = 500,
): Promise<{ success: true } | { success: false; response: Response }> {
  const { error } = await supabase
    .from("analyses")
    .upsert(payload, { onConflict: "scan_session_id" });

  if (error) {
    console.error(logMessage, error);
    return {
      success: false,
      response: jsonResponse(failureBody, status),
    };
  }

  return { success: true };
}

function mimeFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
  };
  return map[ext] || "application/octet-stream";
}

const GEMINI_EXTRACTION_PROMPT = `You are a forensic document extraction engine for impact window and door quotes.

Analyze the uploaded document and extract ALL structured data into the JSON schema below.

Rules:
- Set is_window_door_related to true ONLY if this is an impact window, impact door, or hurricane fenestration quote/proposal.
- Set confidence between 0.0 and 1.0 based on how readable and complete the document is.
- Extract every line item you can identify (windows, doors, panels, screens, etc.)
- For each line item, extract brand, series, DP rating, NOA number, dimensions, quantity, unit price, and total price where visible.
- Extract warranty, permit, installation, and cancellation details if present.
- If a field is not found in the document, omit it from the output (do not guess).

Return ONLY valid JSON matching this exact schema — no markdown, no explanation:
{
  "document_type": "string (e.g. 'impact_window_quote', 'impact_door_quote', 'mixed_fenestration_proposal', 'general_contractor_estimate', 'unrelated_document')",
  "is_window_door_related": boolean,
  "confidence": number (0-1),
  "page_count": number | null,
  "contractor_name": "string | null",
  "opening_count": number | null,
  "total_quoted_price": number | null,
  "hvhz_zone": boolean | null,
  "cancellation_policy": "string | null",
  "line_items": [
    {
      "description": "string",
      "quantity": number | null,
      "unit_price": number | null,
      "total_price": number | null,
      "brand": "string | null",
      "series": "string | null",
      "dp_rating": "string | null",
      "noa_number": "string | null",
      "dimensions": "string | null"
    }
  ],
  "warranty": {
    "labor_years": number | null,
    "manufacturer_years": number | null,
    "transferable": boolean | null,
    "details": "string | null"
  } | null,
  "permits": {
    "included": boolean | null,
    "responsible_party": "string | null",
    "details": "string | null"
  } | null,
  "installation": {
    "scope_detail": "string | null",
    "disposal_included": boolean | null,
    "accessories_mentioned": boolean | null
  } | null
}`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scan_session_id, dev_extraction_override, dev_secret } = await req.json();
    if (!scan_session_id) {
      return jsonResponse({ error: "scan_session_id required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const _devBypassSecretEarly = Deno.env.get("DEV_BYPASS_SECRET");
    const _isDevBypass = dev_extraction_override && dev_secret && _devBypassSecretEarly && dev_secret === _devBypassSecretEarly;

    if (!geminiKey && !_isDevBypass) {
      console.error("GEMINI_API_KEY not configured");
      return jsonResponse({ error: "AI service not configured" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Load scan session
    const { data: session, error: sessionErr } = await supabase
      .from("scan_sessions")
      .select("id, quote_file_id, lead_id, status")
      .eq("id", scan_session_id)
      .single();

    if (sessionErr || !session) {
      console.error("Session not found:", sessionErr);
      return jsonResponse({ error: "Session not found" }, 404);
    }

    // 2. Set status to processing
    const processingUpdate = await updateScanSessionStatus(
      supabase,
      scan_session_id,
      "processing",
      "scan_sessions processing update failed",
    );
    if (!processingUpdate.success) return processingUpdate.response;

    try {
      // ── DEV BYPASS: skip file download + Gemini when override provided ──
      const _devBypassSecret = Deno.env.get("DEV_BYPASS_SECRET");
      const _useBypass = dev_extraction_override && dev_secret && _devBypassSecret && dev_secret === _devBypassSecret;
      let parsed: unknown;

      if (_useBypass) {
        console.log(`[DEV BYPASS] Using extraction override for session ${scan_session_id}`);
        parsed = dev_extraction_override;
      } else {
      // 3. Load quote file
      const { data: qf, error: qfErr } = await supabase
        .from("quote_files")
        .select("storage_path")
        .eq("id", session.quote_file_id)
        .single();

      if (qfErr || !qf) {
        console.error("Quote file not found:", qfErr);
        const missingFileStatusUpdate = await updateScanSessionStatus(
          supabase,
          scan_session_id,
          "needs_better_upload",
          "scan_sessions needs_better_upload update failed after missing quote file",
          {
            error: "Failed to persist scan session state",
            scan_session_id,
            analysis_status: "processing",
            scan_session_status: "processing",
          },
        );
        if (!missingFileStatusUpdate.success) return missingFileStatusUpdate.response;

        return jsonResponse({
          error: "Quote file not found",
          scan_session_id,
          analysis_status: "needs_better_upload",
          scan_session_status: "needs_better_upload",
        }, 404);
      }

      // 4. Download file from storage
      const { data: fileData, error: dlErr } = await supabase.storage
        .from("quotes")
        .download(qf.storage_path);

      if (dlErr || !fileData) {
        console.error("File download failed:", dlErr);
        const downloadFailureStatusUpdate = await updateScanSessionStatus(
          supabase,
          scan_session_id,
          "needs_better_upload",
          "scan_sessions needs_better_upload update failed after file download error",
          {
            error: "Failed to persist scan session state",
            scan_session_id,
            analysis_status: "processing",
            scan_session_status: "processing",
          },
        );
        if (!downloadFailureStatusUpdate.success) return downloadFailureStatusUpdate.response;

        return jsonResponse({
          error: "File download failed",
          scan_session_id,
          analysis_status: "needs_better_upload",
          scan_session_status: "needs_better_upload",
        }, 500);
      }

      // 5. Base64 encode file
      const arrayBuf = await fileData.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuf);
      let binary = "";
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      const base64Data = btoa(binary);
      const mimeType = mimeFromPath(qf.storage_path);

      // 6. Call Gemini API directly
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${geminiKey}`;

      const geminiPayload = {
        contents: [
          {
            parts: [
              { text: GEMINI_EXTRACTION_PROMPT },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
        },
      };

      const geminiResp = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload),
      });

      if (!geminiResp.ok) {
        const errText = await geminiResp.text();
        console.error("Gemini API error:", geminiResp.status, errText);
        // Stay in 'processing' for crash recovery
        return jsonResponse({
          error: "AI extraction failed",
          scan_session_id,
          analysis_status: "processing",
          scan_session_status: "processing",
        }, 502);
      }

      // 7. Parse Gemini response
      const geminiJson = await geminiResp.json();
      const rawText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        console.error("No text in Gemini response:", JSON.stringify(geminiJson).slice(0, 500));
        const emptyResponseStatusUpdate = await updateScanSessionStatus(
          supabase,
          scan_session_id,
          "needs_better_upload",
          "scan_sessions needs_better_upload update failed after empty Gemini response",
          {
            error: "Failed to persist scan session state",
            scan_session_id,
            analysis_status: "processing",
            scan_session_status: "processing",
          },
        );
        if (!emptyResponseStatusUpdate.success) return emptyResponseStatusUpdate.response;

        return jsonResponse({
          error: "AI returned empty response",
          scan_session_id,
          analysis_status: "needs_better_upload",
          scan_session_status: "needs_better_upload",
        }, 502);
      }

      // Strip markdown fences if present
      let cleanJson = rawText.trim();
      if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      }

      // parsed is declared above (hoisted for bypass support)
      try {
        parsed = JSON.parse(cleanJson);
      } catch (parseErr) {
        console.error("JSON parse failed:", parseErr, "Raw:", cleanJson.slice(0, 500));
        const parseFailureStatusUpdate = await updateScanSessionStatus(
          supabase,
          scan_session_id,
          "needs_better_upload",
          "scan_sessions needs_better_upload update failed after Gemini JSON parse error",
          {
            error: "Failed to persist scan session state",
            scan_session_id,
            analysis_status: "processing",
            scan_session_status: "processing",
          },
        );
        if (!parseFailureStatusUpdate.success) return parseFailureStatusUpdate.response;

        return jsonResponse({
          error: "AI response not parseable",
          scan_session_id,
          analysis_status: "needs_better_upload",
          scan_session_status: "needs_better_upload",
        }, 200);
      }
      } // end else (non-bypass OCR path)

      // 8. CLASSIFICATION GATE — check document type BEFORE full extraction validation
      //    This catches invalid documents even when Gemini returns partial/malformed data.
      const classCheck = validateDocumentClassification(parsed);

      if (classCheck.success) {
        const classData = classCheck.data;

        // 8a. Invalid document gate (not window/door related)
        if (classData.is_window_door_related === false) {
          const invalidDocumentUpsertPayload = {
            scan_session_id,
            lead_id: session.lead_id,
            analysis_status: "invalid_document",
            document_is_window_door_related: false,
            document_type: classData.document_type as string,
            confidence_score: classData.confidence as number,
            rubric_version: RUBRIC_VERSION,
          };
          const invalidDocumentAnalysisUpsert = await upsertAnalysisRecord(
            supabase,
            invalidDocumentUpsertPayload,
            "analyses upsert failed",
            {
              error: "Failed to persist analysis state",
              scan_session_id,
              analysis_status: "processing",
              scan_session_status: "processing",
            },
          );
          if (!invalidDocumentAnalysisUpsert.success) return invalidDocumentAnalysisUpsert.response;

          const invalidDocumentStatusUpdate = await updateScanSessionStatus(
            supabase,
            scan_session_id,
            "invalid_document",
            "scan_sessions invalid_document update failed",
            {
              error: "Failed to persist scan session state",
              scan_session_id,
              analysis_status: "invalid_document",
              scan_session_status: "processing",
            },
          );
          if (!invalidDocumentStatusUpdate.success) return invalidDocumentStatusUpdate.response;

          return jsonResponse({
            scan_session_id,
            analysis_status: "invalid_document",
            scan_session_status: "invalid_document",
            reason: "This file does not appear to be an impact window or door quote.",
          }, 200);
        }

        // 8b. Low confidence gate — document is related but unreadable
        if ((classData.confidence as number) < CONFIDENCE_THRESHOLD) {
          console.log(`Low confidence ${classData.confidence} for session ${scan_session_id}`);
          const lowConfidencePayload = {
            scan_session_id,
            lead_id: session.lead_id,
            analysis_status: "invalid_document",
            document_is_window_door_related: true,
            document_type: classData.document_type as string,
            confidence_score: classData.confidence as number,
            rubric_version: RUBRIC_VERSION,
          };
          const lowConfidenceAnalysisUpsert = await upsertAnalysisRecord(
            supabase,
            lowConfidencePayload,
            "analyses upsert failed",
            {
              error: "Failed to persist analysis state",
              scan_session_id,
              analysis_status: "processing",
              scan_session_status: "processing",
            },
          );
          if (!lowConfidenceAnalysisUpsert.success) return lowConfidenceAnalysisUpsert.response;

          const lowConfidenceStatusUpdate = await updateScanSessionStatus(
            supabase,
            scan_session_id,
            "needs_better_upload",
            "scan_sessions needs_better_upload update failed",
            {
              error: "Failed to persist scan session state",
              scan_session_id,
              analysis_status: "needs_better_upload",
              scan_session_status: "processing",
            },
          );
          if (!lowConfidenceStatusUpdate.success) return lowConfidenceStatusUpdate.response;

          return jsonResponse({
            scan_session_id,
            analysis_status: "needs_better_upload",
            scan_session_status: "needs_better_upload",
            confidence: classData.confidence,
            reason: "We couldn't read this file clearly enough. Please upload a higher quality scan or photo.",
          }, 200);
        }
      }

      // 9. FULL EXTRACTION VALIDATION — only reached for window/door docs with sufficient confidence
      const validation = validateExtraction(parsed);
      if (!validation.success) {
        console.error("Extraction validation failed:", validation.error);
        // Document passed classification but extraction is incomplete — treat as needs_better_upload
        const extractionFailurePayload = {
          scan_session_id,
          lead_id: session.lead_id,
          analysis_status: "invalid_document",
          document_is_window_door_related: classCheck.success ? (classCheck.data.is_window_door_related as boolean) : null,
          document_type: classCheck.success ? (classCheck.data.document_type as string) : null,
          confidence_score: classCheck.success ? (classCheck.data.confidence as number) : null,
          rubric_version: RUBRIC_VERSION,
        };
        const extractionFailureAnalysisUpsert = await upsertAnalysisRecord(
          supabase,
          extractionFailurePayload,
          "analyses upsert failed",
          {
            error: "Failed to persist analysis state",
            scan_session_id,
            analysis_status: "processing",
            scan_session_status: "processing",
          },
        );
        if (!extractionFailureAnalysisUpsert.success) return extractionFailureAnalysisUpsert.response;

        const extractionFailureStatusUpdate = await updateScanSessionStatus(
          supabase,
          scan_session_id,
          "needs_better_upload",
          "scan_sessions needs_better_upload update failed",
          {
            error: "Failed to persist scan session state",
            scan_session_id,
            analysis_status: "needs_better_upload",
            scan_session_status: "processing",
          },
        );
        if (!extractionFailureStatusUpdate.success) return extractionFailureStatusUpdate.response;

        return jsonResponse({
          scan_session_id,
          analysis_status: "needs_better_upload",
          scan_session_status: "needs_better_upload",
          reason: "We found a window quote but couldn't extract all details. Please try a clearer upload.",
        }, 200);
      }

      const extraction = validation.data;

      // 11. Score all pillars
      const gradeResult = computeGrade(extraction);
      const flags = detectFlags(extraction);

      // 12. Build payloads
      const openingBucket = (extraction.opening_count || extraction.line_items.length) <= 5 ? "1-5"
        : (extraction.opening_count || extraction.line_items.length) <= 10 ? "6-10"
        : (extraction.opening_count || extraction.line_items.length) <= 20 ? "11-20" : "20+";

      const proofOfRead = {
        page_count: extraction.page_count || null,
        opening_count: extraction.opening_count || extraction.line_items.length,
        contractor_name: extraction.contractor_name || null,
        document_type: extraction.document_type,
        line_item_count: extraction.line_items.length,
      };

      // Preview: limited info — enough for teaser, not enough for full report
      const previewJson = {
        grade: gradeResult.letterGrade,
        flag_count: flags.length,
        opening_count_bucket: openingBucket,
        quality_band: gradeResult.weightedAverage >= 70 ? "good" : gradeResult.weightedAverage >= 50 ? "fair" : "poor",
        hard_cap_applied: gradeResult.hardCapApplied,
        has_warranty: !!extraction.warranty,
        has_permits: !!extraction.permits,
        pillar_scores: buildPreviewPillarScores(gradeResult.pillarScores),
      };

      // Full JSON: complete analysis — gated behind SMS verification on client
      const fullJson = {
        grade: gradeResult.letterGrade,
        weighted_average: gradeResult.weightedAverage,
        hard_cap_applied: gradeResult.hardCapApplied,
        pillar_scores: gradeResult.pillarScores,
        flags: flags,
        extraction: extraction,
        rubric_version: RUBRIC_VERSION,
      };

      // 13. Upsert full analyses row
      const completeAnalysisUpsert = await upsertAnalysisRecord(supabase, {
        scan_session_id: scan_session_id,
        lead_id: session.lead_id,
        analysis_status: "complete",
        document_is_window_door_related: true,
        document_type: extraction.document_type,
        confidence_score: extraction.confidence,
        grade: gradeResult.letterGrade,
        flags: flags,
        // NOTE: dollar_delta stores raw total_quoted_price for now.
        // It is NOT a true benchmark delta — benchmark comparison is planned future logic.
        // Do not present this value as "overpayment" or "savings" in any UI.
        dollar_delta: extraction.total_quoted_price || null,
        proof_of_read: proofOfRead,
        preview_json: previewJson,
        full_json: fullJson,
        rubric_version: RUBRIC_VERSION,
      }, "analyses upsert failed", {
        error: "Failed to persist analysis state",
        scan_session_id,
        analysis_status: "processing",
        scan_session_status: "processing",
      });
      if (!completeAnalysisUpsert.success) return completeAnalysisUpsert.response;

      // 14. Update session to preview_ready
      const previewReadyStatusUpdate = await updateScanSessionStatus(
        supabase,
        scan_session_id,
        "preview_ready",
        "scan_sessions preview_ready update failed",
        {
          error: "Failed to persist scan session state",
          scan_session_id,
          analysis_status: "complete",
          scan_session_status: "processing",
          grade: gradeResult.letterGrade,
        },
      );
      if (!previewReadyStatusUpdate.success) {
        // COMPENSATING ACTION:
        // If the scan session status failed to transition to preview_ready,
        // roll the analysis_status back from "complete" to "processing"
        // so that analyses + scan_sessions remain logically aligned.
        try {
          const rollbackAnalysis = await upsertAnalysisRecord(
            supabase,
            {
              scan_session_id: scan_session_id,
              lead_id: session.lead_id,
              analysis_status: "processing",
              document_is_window_door_related: true,
              document_type: extraction.document_type,
              confidence_score: extraction.confidence,
              grade: gradeResult.letterGrade,
              flags: flags,
              dollar_delta: extraction.total_quoted_price || null,
              proof_of_read: proofOfRead,
              preview_json: previewJson,
              full_json: fullJson,
              rubric_version: RUBRIC_VERSION,
            },
            "analyses rollback after scan_sessions preview_ready failure",
            {
              error: "Failed to rollback analysis after scan session status failure",
              scan_session_id,
              analysis_status: "processing",
              scan_session_status: "processing",
              grade: gradeResult.letterGrade,
            },
          );
          if (!rollbackAnalysis.success) {
            console.error(
              "Rollback of analysis record after scan_sessions preview_ready failure also failed",
              rollbackAnalysis.response,
            );
          }
        } catch (rollbackErr) {
          console.error(
            "Unexpected error during analysis rollback after scan_sessions preview_ready failure",
            rollbackErr,
          );
        }
        return previewReadyStatusUpdate.response;
      }

      return jsonResponse({
        scan_session_id,
        analysis_status: "complete",
        scan_session_status: "preview_ready",
        grade: gradeResult.letterGrade,
      }, 200);

    } catch (innerErr) {
      // CRASH RECOVERY: session stays in 'processing' — recoverable by sweep
      console.error("Unexpected error during scan processing:", innerErr);
      return jsonResponse({
        error: "Internal processing error",
        scan_session_id,
        analysis_status: "processing",
        scan_session_status: "processing",
      }, 500);
    }

  } catch (outerErr) {
    console.error("scan-quote outer error:", outerErr);
    return jsonResponse({ error: "Bad request" }, 400);
  }
});
