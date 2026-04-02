import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── V2.0 Types & Constants ───────────────────────────────────────────────────
type FlagSeverity = "CRITICAL" | "WARNING" | "NOTICE";
type ArbitrageStatus = "VERIFIED" | "UNVERIFIED" | "HIGH_RISK_UNVERIFIED";

interface ProcessedLineItem {
  description?: string;
  quantity?: number | null;
  unit_price?: number | null;
  total_price?: number | null;
  brand?: string | null;
  classified_sub_type: string;
  brand_identified: string | null;
  is_impact_rated: boolean | null;
  line_item_math_valid: boolean;
  computed_line_total: number | null;
}

interface DossierLineItem {
  raw_description: string;
  competitor_unit_price: number | null;
  classified_sub_type: string;
  is_impact_rated: boolean | null;
  brand_identified: string | null;
  county_median_price: number | null;
  arbitrage_delta: number | null;
  arbitrage_status?: ArbitrageStatus;
}

interface RedFlagAction {
  flag_category: string;
  severity: FlagSeverity;
  vulnerability_description: string;
  action_rails: string[];
}

interface ContractorBriefPayload {
  priority_score: number;
  competitor_total_price: number | null;
  price_to_beat: number | null;
  math_discrepancy: boolean;
  scan_confidence_score: number;
  line_items: DossierLineItem[];
  competitive_gap_analysis: RedFlagAction[];
  scan_session_id: string;
  generated_at: string;
  target_county: string | null;
}

const COUNTY_BENCHMARKS: Record<string, Record<string, number>> = {
  "Palm Beach": {
    "Single Hung": 850, "Double Hung": 950, "Casement": 1100,
    "Sliding Glass Door": 2200, "French Door": 2800, "Picture Window": 1200,
    "Generic Window": 900, "Generic Door": 2000,
  },
  "Broward": {
    "Single Hung": 825, "Double Hung": 925, "Casement": 1075,
    "Sliding Glass Door": 2150, "French Door": 2750, "Picture Window": 1175,
    "Generic Window": 875, "Generic Door": 1950,
  },
  "Miami-Dade": {
    "Single Hung": 875, "Double Hung": 975, "Casement": 1125,
    "Sliding Glass Door": 2250, "French Door": 2850, "Picture Window": 1225,
    "Generic Window": 925, "Generic Door": 2050,
  }
};

// ── V2.0 Helper Functions ────────────────────────────────────────────────────
function sanitizeEvidence(rawText: string | null | undefined): string {
  if (!rawText) return "";
  
  const allowedPatterns = [
    /impact|hurricane|dp\s*\d+|noa|florida\s*building\s*code/i,
    /warranty|labor|manufacturer|transferable/i,
    /permit|engineering|installation|disposal/i,
    /pgt|cgi|esw|andersen|pella|windoor/i,
    /single\s*hung|double\s*hung|casement|slider|french/i,
    /\$[\d,]+|\d+\s*years?/i,
  ];
  
  const blockedPatterns = [
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/,
    /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,
    /\b\d+\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/i,
    /@[a-z0-9]+\.[a-z]+/i,
    /\bUnit\s*#?\d+\b|\bApt\s*#?\d+\b/i,
  ];
  
  if (blockedPatterns.some(pattern => pattern.test(rawText))) return ""; 
  
  const allowedMatches = allowedPatterns
    .flatMap(pattern => rawText.match(pattern) || [])
    .join(" ");
  
  return allowedMatches.trim() || rawText.slice(0, 100); 
}

function computeArbitrage(
  line: ProcessedLineItem, county: string | null, globalMathDiscrepancy: boolean
): Pick<DossierLineItem, "county_median_price" | "arbitrage_delta" | "arbitrage_status"> {
  if (globalMathDiscrepancy) {
    return { county_median_price: null, arbitrage_delta: null, arbitrage_status: "HIGH_RISK_UNVERIFIED" };
  }
  if (!line.line_item_math_valid) {
    return { county_median_price: null, arbitrage_delta: null, arbitrage_status: "UNVERIFIED" };
  }
  const competitorUnitPrice = line.unit_price;
  if (competitorUnitPrice === null || competitorUnitPrice === undefined) {
    return { county_median_price: null, arbitrage_delta: null, arbitrage_status: "UNVERIFIED" };
  }
  
  const countyData = county ? COUNTY_BENCHMARKS[county] : null;
  const countyMedianPrice = countyData?.[line.classified_sub_type] || null;
  
  if (countyMedianPrice === null) {
    return { county_median_price: null, arbitrage_delta: null, arbitrage_status: "UNVERIFIED" };
  }
  
  const arbitrageDelta = Math.round((competitorUnitPrice - countyMedianPrice) * 100) / 100;
  return { county_median_price: countyMedianPrice, arbitrage_delta: arbitrageDelta, arbitrage_status: "VERIFIED" };
}

function mapFlagToActionRails(flag: any): RedFlagAction {
  const title = (flag.title || flag.name || "Unknown Flag").toLowerCase();
  const rawSeverity = flag.severity || "Medium";
  
  let severity: FlagSeverity = "WARNING";
  if (rawSeverity === "Critical" || rawSeverity === "High") severity = "CRITICAL";
  else if (rawSeverity === "Low") severity = "NOTICE";
  
  if (title.includes("permit")) {
    return {
      flag_category: "Compliance", severity,
      vulnerability_description: sanitizeEvidence(flag.explanation || "Permit responsibility unclear"),
      action_rails: ["Demand written permit responsibility clause", "Verify contractor license includes permitting authority", "Request proof of past permit approval timeline"]
    };
  }
  if (title.includes("warranty") || title.includes("labor")) {
    return {
      flag_category: "Scope Gap", severity,
      vulnerability_description: sanitizeEvidence(flag.explanation || "Warranty terms incomplete"),
      action_rails: ["Request explicit labor warranty duration", "Verify warranty transferability terms", "Demand manufacturer warranty documentation"]
    };
  }
  if (title.includes("disposal") || title.includes("removal")) {
    return {
      flag_category: "Scope Gap", severity,
      vulnerability_description: sanitizeEvidence(flag.explanation || "Disposal scope unclear"),
      action_rails: ["Attack missing disposal fee line item", "Request debris removal protocol", "Verify haul-away included in price"]
    };
  }
  if (title.includes("noa") || title.includes("dp") || title.includes("impact")) {
    return {
      flag_category: "Compliance", severity: "CRITICAL",
      vulnerability_description: sanitizeEvidence(flag.explanation || "Impact rating or NOA missing"),
      action_rails: ["Demand NOA number for all openings", "Verify DP rating matches local code", "Request engineering packet before deposit"]
    };
  }
  if (title.includes("price") || title.includes("overcharg")) {
    return {
      flag_category: "Margin Trap", severity,
      vulnerability_description: sanitizeEvidence(flag.explanation || "Pricing above market median"),
      action_rails: ["Present county median pricing evidence", "Request itemized cost breakdown", "Leverage competitive bid pressure"]
    };
  }
  
  return {
    flag_category: "General Risk", severity,
    vulnerability_description: sanitizeEvidence(flag.explanation || flag.title || "Manual review required"),
    action_rails: ["Manual Review Required"]
  };
}

// ── Priority Score Calculator (Merged Old + V2) ──────────────────────────────
function computePriorityScore(params: {
  grade: string | null;
  redFlagCount: number;
  amberFlagCount: number;
  windowCount: number | null;
  quoteRange: string | null;
  confidenceScore: number | null;
  arbitrageSum: number;
  mathDiscrepancy: boolean;
}): number {
  let score = 0;
  const gradeMap: Record<string, number> = { F: 40, D: 30, C: 20, B: 10, A: 5 };
  score += gradeMap[params.grade || "C"] ?? 15;
  score += Math.min(params.redFlagCount * 8, 40);
  score += Math.min(params.amberFlagCount * 3, 15);
  
  if (params.windowCount) {
    if (params.windowCount >= 15) score += 20;
    else if (params.windowCount >= 8) score += 12;
    else if (params.windowCount >= 4) score += 6;
  }
  if (params.quoteRange) {
    const match = params.quoteRange.match(/[\d,]+/g);
    if (match) {
      const maxVal = Math.max(...match.map((s) => parseInt(s.replace(/,/g, ""), 10)));
      if (maxVal >= 30000) score += 15;
      else if (maxVal >= 15000) score += 10;
      else if (maxVal >= 8000) score += 5;
    }
  }
  
  if (params.arbitrageSum > 5000) score += 20;
  else if (params.arbitrageSum > 2000) score += 10;
  if (params.mathDiscrepancy) score += 15;
  if (params.confidenceScore && params.confidenceScore >= 80) score += 5;
  
  return Math.min(score, 100);
}

// ── Brief Builder (Preserved for Database Compatibility) ─────────────────────
function buildBrief(params: {
  grade: string | null;
  confidenceScore: number | null;
  county: string | null;
  projectType: string | null;
  windowCount: number | null;
  quoteRange: string | null;
  flags: unknown[];
  rubricVersion: string | null;
}) {
  const flagSummary = (params.flags || []).map((f: any) => ({
    title: f.title || f.name || "Unnamed flag",
    severity: f.severity || "Medium",
  }));

  const redFlags = flagSummary.filter((f) => f.severity === "Critical" || f.severity === "High");
  const amberFlags = flagSummary.filter((f) => f.severity === "Medium");

  const majorScopeGaps = flagSummary
    .filter((f) => ["missing", "not specified", "unclear", "absent"].some((kw) => f.title.toLowerCase().includes(kw)))
    .map((f) => f.title).slice(0, 5);

  const pricingPosture = params.grade === "F" || params.grade === "D" ? "significantly_above_market"
    : params.grade === "C" ? "above_market" : params.grade === "B" ? "market_rate" : "competitive";

  const briefJson = {
    grade: params.grade,
    confidence_score: params.confidenceScore,
    county: params.county,
    project_type: params.projectType,
    window_count: params.windowCount,
    quote_range: params.quoteRange,
    flag_count: flagSummary.length,
    red_flag_count: redFlags.length,
    amber_flag_count: amberFlags.length,
    pricing_posture: pricingPosture,
    rubric_version: params.rubricVersion,
    generated_at: new Date().toISOString(),
  };

  const lines = [
    `WINDOWMAN CONTRACTOR BRIEF`,
    `Generated: ${new Date().toISOString().split("T")[0]}`,
    `Grade: ${params.grade || "—"} | Confidence: ${params.confidenceScore ?? "—"}%`,
    `Pricing Posture: ${pricingPosture.replace(/_/g, " ")}`,
    `FLAGS: ${flagSummary.length} total (${redFlags.length} red, ${amberFlags.length} amber)`
  ];

  return { briefJson, briefText: lines.join("\n") };
}

// ── Suggested Match Logic (Preserved) ────────────────────────────────────────
interface ContractorRow {
  id: string; company_name: string; status: string; is_vetted: boolean;
  service_counties: string[]; project_types: string[]; min_window_count: number | null;
  max_window_count: number | null; accepts_low_grade_leads: boolean;
}

interface MatchCandidate { contractor_id: string; score: number; reasons: string[]; }

function computeSuggestedMatch(params: {
  contractors: ContractorRow[]; county: string | null; projectType: string | null;
  windowCount: number | null; grade: string | null;
}): { topCandidate: MatchCandidate | null; topThree: MatchCandidate[]; confidence: "high" | "medium" | "low"; } {
  const candidates: MatchCandidate[] = [];

  for (const c of params.contractors) {
    if (c.status !== "active" || !c.is_vetted) continue;

    let score = 20; // Vetted baseline
    const reasons: string[] = ["vetted_contractor"];

    if (params.county && c.service_counties.length > 0) {
      if (c.service_counties.some((sc) => sc.toLowerCase() === params.county!.toLowerCase())) {
        score += 30; reasons.push("county_specialist");
      } else { score -= 20; }
    }

    if (params.windowCount) {
      const minOk = !c.min_window_count || params.windowCount >= c.min_window_count;
      const maxOk = !c.max_window_count || params.windowCount <= c.max_window_count;
      if (minOk && maxOk) { score += 15; reasons.push("window_count_fit"); } else { score -= 10; }
    }

    const isLowGrade = params.grade === "D" || params.grade === "F";
    if (isLowGrade) {
      if (c.accepts_low_grade_leads) { score += 10; reasons.push("accepts_low_grade_leads", "suitable_for_scope_complexity"); } 
      else { score -= 15; }
    }

    if (score > 0) candidates.push({ contractor_id: c.id, score, reasons });
  }

  candidates.sort((a, b) => b.score - a.score);
  const topCandidate = candidates[0] || null;
  let confidence: "high" | "medium" | "low" = "low";
  if (topCandidate) {
    if (topCandidate.score >= 70) confidence = "high";
    else if (topCandidate.score >= 40) confidence = "medium";
  }

  return { topCandidate, topThree: candidates.slice(0, 3), confidence };
}

// ── Main Handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scan_session_id, phone_e164: rawPhone, cta_source } = await req.json();
    const phone_e164 = typeof rawPhone === "string" ? rawPhone.trim() : "";

    if (!scan_session_id || !phone_e164) {
      return new Response(JSON.stringify({ error: "scan_session_id and phone_e164 are required." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1. Verify Authorization
    const { data: authCheck } = await supabase.rpc("get_analysis_full", { p_scan_session_id: scan_session_id, p_phone_e164: phone_e164 });
    if (!authCheck || authCheck.length === 0) {
      return new Response(JSON.stringify({ error: "Not authorized. Phone verification required." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const analysis = authCheck[0];

    // 2. Fetch Lead & Analysis Context
    const { data: session } = await supabase.from("scan_sessions").select("lead_id").eq("id", scan_session_id).maybeSingle();
    const { data: lead } = await supabase.from("leads").select("county, window_count, project_type, quote_range").eq("id", session?.lead_id || "").maybeSingle();
    const { data: analysisRow } = await supabase.from("analyses").select("id").eq("scan_session_id", scan_session_id).eq("analysis_status", "complete").maybeSingle();

    if (!analysisRow) {
      return new Response(JSON.stringify({ error: "No completed analysis found." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const now = new Date().toISOString();

    // ── 3. V2.0 Dossier Math Extraction ──────────────────────────────────────
    const metricsData = (analysis.full_json as any)?.metrics || {};
    const processedLineItems: ProcessedLineItem[] = metricsData.line_items || [];
    const globalMathDiscrepancy = metricsData.math_validation?.math_discrepancy ?? false;
    const competitorTotalPrice = metricsData.math_validation?.quoted_total || null;

    const dossierLineItems: DossierLineItem[] = processedLineItems.map(line => {
      const arbitrageResult = computeArbitrage(line, lead?.county || null, globalMathDiscrepancy);
      return {
        raw_description: sanitizeEvidence(line.description),
        competitor_unit_price: line.unit_price || null,
        classified_sub_type: line.classified_sub_type,
        is_impact_rated: line.is_impact_rated,
        brand_identified: line.brand_identified,
        ...arbitrageResult
      };
    });

    const rawFlags = Array.isArray(analysis.flags) ? analysis.flags : [];
    const competitiveGapAnalysis: RedFlagAction[] = rawFlags.map(mapFlagToActionRails);

    const redFlagCountV2 = competitiveGapAnalysis.filter(f => f.severity === "CRITICAL").length;
    const amberFlagCountV2 = competitiveGapAnalysis.filter(f => f.severity === "WARNING").length;
    const arbitrageSum = dossierLineItems.reduce((sum, item) => sum + (item.arbitrage_delta && item.arbitrage_delta > 0 ? item.arbitrage_delta : 0), 0);
    const verifiedItems = dossierLineItems.filter(item => item.arbitrage_status === "VERIFIED");
    const priceToBeat = verifiedItems.length > 0 ? verifiedItems.reduce((sum, item) => sum + (item.county_median_price || 0), 0) : null;

    // ── 4. Priority Score & Payload Generation ──────────────────────────────
    const priorityScore = computePriorityScore({
      grade: analysis.grade, redFlagCount: redFlagCountV2, amberFlagCount: amberFlagCountV2,
      windowCount: lead?.window_count || null, quoteRange: lead?.quote_range || null,
      confidenceScore: analysis.confidence_score, arbitrageSum, mathDiscrepancy: globalMathDiscrepancy
    });

    const contractorBriefPayload: ContractorBriefPayload = {
      priority_score: priorityScore,
      competitor_total_price: competitorTotalPrice,
      price_to_beat: priceToBeat,
      math_discrepancy: globalMathDiscrepancy,
      scan_confidence_score: analysis.confidence_score || 50,
      line_items: dossierLineItems,
      competitive_gap_analysis: competitiveGapAnalysis,
      scan_session_id, generated_at: now,
      target_county: lead?.county || null
    };

    // ── 5. Legacy DB Insert Math (Preserved for compatibility) ──────────────
    const brief = buildBrief({
      grade: analysis.grade, confidenceScore: analysis.confidence_score, county: lead?.county || null,
      projectType: lead?.project_type || null, windowCount: lead?.window_count || null, quoteRange: lead?.quote_range || null,
      flags: rawFlags, rubricVersion: analysis.rubric_version
    });

    await supabase.from("analyses").update({
      contractor_brief: brief.briefText, contractor_brief_json: brief.briefJson, contractor_brief_generated_at: now,
    }).eq("id", analysisRow.id);

    const { data: allContractors } = await supabase.from("contractors").select("*").eq("status", "active");
    const matchResult = computeSuggestedMatch({
      contractors: (allContractors || []) as ContractorRow[],
      county: lead?.county || null, projectType: lead?.project_type || null,
      windowCount: lead?.window_count || null, grade: analysis.grade,
    });

    // ── 6. Idempotency Check & Insert ───────────────────────────────────────
    const { data: existingOpp } = await supabase.from("contractor_opportunities").select("*").eq("scan_session_id", scan_session_id).maybeSingle();

    if (existingOpp) {
      return new Response(JSON.stringify({
        success: true, opportunity_id: existingOpp.id, analysis_id: analysisRow.id, status: "brief_ready",
        suggested_match: existingOpp.suggested_contractor_id ? { confidence: existingOpp.suggested_match_confidence || "low", contractor_alias: `WM-${existingOpp.suggested_contractor_id.slice(0, 6).toUpperCase()}` } : null,
        dossier_payload: contractorBriefPayload,
        idempotent: true,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: newOpp } = await supabase.from("contractor_opportunities").insert({
      lead_id: session?.lead_id || null, scan_session_id, analysis_id: analysisRow.id, status: "brief_ready",
      intro_requested_at: now, brief_generated_at: now, brief_version: "2.0",
      brief_json: brief.briefJson, brief_text: brief.briefText,
      county: lead?.county || null, project_type: lead?.project_type || null, window_count: lead?.window_count || null, quote_range: lead?.quote_range || null,
      grade: analysis.grade, priority_score: priorityScore, cta_source: cta_source || "intro_request",
      suggested_contractor_id: matchResult.topCandidate?.contractor_id || null,
      suggested_match_confidence: matchResult.confidence,
    }).select("id").single();

    // ── 7. Return Final Payload ─────────────────────────────────────────────
    return new Response(JSON.stringify({
      success: true, opportunity_id: newOpp?.id || "unknown", analysis_id: analysisRow.id, status: "brief_ready",
      suggested_match: matchResult.topCandidate ? { confidence: matchResult.confidence, contractor_alias: `WM-${matchResult.topCandidate.contractor_id.slice(0, 6).toUpperCase()}` } : null,
      dossier_payload: contractorBriefPayload
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
