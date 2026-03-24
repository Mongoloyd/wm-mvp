import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Priority Score Calculator ────────────────────────────────────────────────
function computePriorityScore(params: {
  grade: string | null;
  flagCount: number;
  redFlagCount: number;
  amberFlagCount: number;
  windowCount: number | null;
  quoteRange: string | null;
  confidenceScore: number | null;
}): number {
  let score = 0;

  // Grade severity (worse grade = higher priority = more monetizable)
  const gradeMap: Record<string, number> = { F: 40, D: 30, C: 20, B: 10, A: 5 };
  score += gradeMap[params.grade || "C"] ?? 15;

  // Red flags are high-value signals
  score += Math.min(params.redFlagCount * 8, 40);
  score += Math.min(params.amberFlagCount * 3, 15);

  // Larger projects = higher value
  if (params.windowCount) {
    if (params.windowCount >= 15) score += 20;
    else if (params.windowCount >= 8) score += 12;
    else if (params.windowCount >= 4) score += 6;
  }

  // Quote range signals project size
  if (params.quoteRange) {
    const match = params.quoteRange.match(/[\d,]+/g);
    if (match) {
      const maxVal = Math.max(...match.map((s) => parseInt(s.replace(/,/g, ""), 10)));
      if (maxVal >= 30000) score += 15;
      else if (maxVal >= 15000) score += 10;
      else if (maxVal >= 8000) score += 5;
    }
  }

  // High confidence = reliable lead
  if (params.confidenceScore && params.confidenceScore >= 80) score += 5;

  return Math.min(score, 100);
}

// ── Brief Builder ────────────────────────────────────────────────────────────
function buildBrief(params: {
  grade: string | null;
  confidenceScore: number | null;
  county: string | null;
  projectType: string | null;
  windowCount: number | null;
  quoteRange: string | null;
  flags: unknown[];
  rubricVersion: string | null;
  fullJson: Record<string, unknown> | null;
}) {
  const flagSummary = (params.flags || []).map((f: any) => ({
    title: f.title || f.name || "Unnamed flag",
    severity: f.severity || "Medium",
  }));

  const redFlags = flagSummary.filter(
    (f) => f.severity === "Critical" || f.severity === "High"
  );
  const amberFlags = flagSummary.filter((f) => f.severity === "Medium");

  // Extract scope gaps from flags
  const scopeGapKeywords = ["missing", "not specified", "unclear", "absent"];
  const majorScopeGaps = flagSummary
    .filter((f) =>
      scopeGapKeywords.some((kw) => f.title.toLowerCase().includes(kw))
    )
    .map((f) => f.title)
    .slice(0, 5);

  // Extract warranty concerns
  const warrantyFlags = flagSummary
    .filter((f) => f.title.toLowerCase().includes("warranty"))
    .map((f) => f.title);

  // Pricing posture from grade
  const pricingPosture =
    params.grade === "F" || params.grade === "D"
      ? "significantly_above_market"
      : params.grade === "C"
      ? "above_market"
      : params.grade === "B"
      ? "market_rate"
      : "competitive";

  // Window count bucket
  let windowCountBucket: string | null = null;
  if (params.windowCount) {
    if (params.windowCount <= 4) windowCountBucket = "1-4";
    else if (params.windowCount <= 8) windowCountBucket = "5-8";
    else if (params.windowCount <= 15) windowCountBucket = "9-15";
    else windowCountBucket = "16+";
  }

  const briefJson = {
    grade: params.grade,
    confidence_score: params.confidenceScore,
    county: params.county,
    project_type: params.projectType,
    window_count: params.windowCount,
    window_count_bucket: windowCountBucket,
    quote_range: params.quoteRange,
    flag_count: flagSummary.length,
    red_flag_count: redFlags.length,
    amber_flag_count: amberFlags.length,
    flag_summary: flagSummary.slice(0, 10),
    pricing_posture: pricingPosture,
    major_scope_gaps: majorScopeGaps,
    warranty_concerns: warrantyFlags,
    rubric_version: params.rubricVersion,
    generated_at: new Date().toISOString(),
  };

  // Human-readable brief text
  const lines = [
    `WINDOWMAN CONTRACTOR BRIEF`,
    `Generated: ${new Date().toISOString().split("T")[0]}`,
    ``,
    `Grade: ${params.grade || "—"} | Confidence: ${params.confidenceScore ?? "—"}%`,
    `County: ${params.county || "—"} | Project: ${params.projectType || "—"}`,
    `Windows: ${params.windowCount ?? "—"} (${windowCountBucket || "—"}) | Quote Range: ${params.quoteRange || "—"}`,
    `Pricing Posture: ${pricingPosture.replace(/_/g, " ")}`,
    ``,
    `FLAGS: ${flagSummary.length} total (${redFlags.length} red, ${amberFlags.length} amber)`,
    ...flagSummary.slice(0, 8).map(
      (f) => `  [${f.severity}] ${f.title}`
    ),
    ``,
    majorScopeGaps.length > 0
      ? `SCOPE GAPS: ${majorScopeGaps.join("; ")}`
      : `SCOPE GAPS: none identified`,
    warrantyFlags.length > 0
      ? `WARRANTY: ${warrantyFlags.join("; ")}`
      : `WARRANTY: no issues flagged`,
    ``,
    `— This brief contains no homeowner PII. —`,
  ];

  return {
    briefJson,
    briefText: lines.join("\n"),
    flagCount: flagSummary.length,
    redFlagCount: redFlags.length,
    amberFlagCount: amberFlags.length,
  };
}

// ── Main Handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scan_session_id, phone_e164: rawPhone } = await req.json();
    const phone_e164 = typeof rawPhone === "string" ? rawPhone.trim() : "";

    console.log("[generate-contractor-brief] invoked", {
      scan_session_id,
      phone_e164: phone_e164 ? `${phone_e164.slice(0, 4)}****` : "(empty)",
    });

    if (!scan_session_id || !phone_e164) {
      return new Response(
        JSON.stringify({ error: "scan_session_id and phone_e164 are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── 1. Verify phone is verified for this session ────────────────────────
    const { data: authCheck } = await supabase.rpc("get_analysis_full", {
      p_scan_session_id: scan_session_id,
      p_phone_e164: phone_e164,
    });

    if (!authCheck || authCheck.length === 0) {
      console.error("[generate-contractor-brief] authorization failed", {
        scan_session_id,
      });
      return new Response(
        JSON.stringify({ error: "Not authorized. Phone verification required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysis = authCheck[0];

    // ── 2. Fetch scan_session → lead data ───────────────────────────────────
    const { data: session } = await supabase
      .from("scan_sessions")
      .select("lead_id")
      .eq("id", scan_session_id)
      .maybeSingle();

    if (!session?.lead_id) {
      console.error("[generate-contractor-brief] no lead_id on scan_session");
      return new Response(
        JSON.stringify({ error: "Session not linked to a lead." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: lead } = await supabase
      .from("leads")
      .select("county, window_count, project_type, quote_range")
      .eq("id", session.lead_id)
      .maybeSingle();

    // ── 3. Get analysis ID ──────────────────────────────────────────────────
    const { data: analysisRow } = await supabase
      .from("analyses")
      .select("id")
      .eq("scan_session_id", scan_session_id)
      .eq("analysis_status", "complete")
      .maybeSingle();

    if (!analysisRow) {
      return new Response(
        JSON.stringify({ error: "No completed analysis found." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 4. Build the brief ──────────────────────────────────────────────────
    const flags = Array.isArray(analysis.flags) ? analysis.flags : [];

    const brief = buildBrief({
      grade: analysis.grade,
      confidenceScore: analysis.confidence_score,
      county: lead?.county || null,
      projectType: lead?.project_type || null,
      windowCount: lead?.window_count || null,
      quoteRange: lead?.quote_range || null,
      flags,
      rubricVersion: analysis.rubric_version,
      fullJson: analysis.full_json as Record<string, unknown> | null,
    });

    const priorityScore = computePriorityScore({
      grade: analysis.grade,
      flagCount: brief.flagCount,
      redFlagCount: brief.redFlagCount,
      amberFlagCount: brief.amberFlagCount,
      windowCount: lead?.window_count || null,
      quoteRange: lead?.quote_range || null,
      confidenceScore: analysis.confidence_score,
    });

    console.log("[generate-contractor-brief] brief built", {
      grade: analysis.grade,
      flagCount: brief.flagCount,
      priorityScore,
    });

    // ── 5. Update analyses cached brief fields ──────────────────────────────
    const now = new Date().toISOString();

    await supabase
      .from("analyses")
      .update({
        contractor_brief: brief.briefText,
        contractor_brief_json: brief.briefJson,
        contractor_brief_generated_at: now,
      })
      .eq("id", analysisRow.id);

    // ── 6. Upsert canonical contractor_opportunity ──────────────────────────
    // Check for existing opportunity (idempotent)
    const { data: existingOpp } = await supabase
      .from("contractor_opportunities")
      .select("id")
      .eq("scan_session_id", scan_session_id)
      .maybeSingle();

    let opportunityId: string;

    if (existingOpp) {
      // Update existing
      const { error: updateErr } = await supabase
        .from("contractor_opportunities")
        .update({
          status: "brief_ready",
          brief_generated_at: now,
          brief_version: "1.0",
          brief_json: brief.briefJson,
          brief_text: brief.briefText,
          county: lead?.county || null,
          project_type: lead?.project_type || null,
          window_count: lead?.window_count || null,
          quote_range: lead?.quote_range || null,
          grade: analysis.grade,
          flag_count: brief.flagCount,
          red_flag_count: brief.redFlagCount,
          amber_flag_count: brief.amberFlagCount,
          priority_score: priorityScore,
        })
        .eq("id", existingOpp.id);

      if (updateErr) {
        console.error("[generate-contractor-brief] opportunity update failed", updateErr);
      }
      opportunityId = existingOpp.id;
      console.log("[generate-contractor-brief] updated existing opportunity", { opportunityId });
    } else {
      // Create new
      const { data: newOpp, error: insertErr } = await supabase
        .from("contractor_opportunities")
        .insert({
          lead_id: session.lead_id,
          scan_session_id,
          analysis_id: analysisRow.id,
          status: "brief_ready",
          intro_requested_at: now,
          brief_generated_at: now,
          brief_version: "1.0",
          brief_json: brief.briefJson,
          brief_text: brief.briefText,
          county: lead?.county || null,
          project_type: lead?.project_type || null,
          window_count: lead?.window_count || null,
          quote_range: lead?.quote_range || null,
          grade: analysis.grade,
          flag_count: brief.flagCount,
          red_flag_count: brief.redFlagCount,
          amber_flag_count: brief.amberFlagCount,
          priority_score: priorityScore,
        })
        .select("id")
        .single();

      if (insertErr) {
        console.error("[generate-contractor-brief] opportunity insert failed", insertErr);
        return new Response(
          JSON.stringify({ error: "Failed to create opportunity." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      opportunityId = newOpp!.id;
      console.log("[generate-contractor-brief] created new opportunity", { opportunityId });
    }

    // ── 7. Log event ────────────────────────────────────────────────────────
    await supabase.from("event_logs").insert({
      event_name: "contractor_brief_generated",
      session_id: scan_session_id,
      route: "/",
      metadata: {
        opportunity_id: opportunityId,
        analysis_id: analysisRow.id,
        grade: analysis.grade,
        priority_score: priorityScore,
        flag_count: brief.flagCount,
        timestamp: now,
      },
    });

    console.log("[generate-contractor-brief] complete", {
      opportunityId,
      analysisId: analysisRow.id,
      status: "brief_ready",
    });

    return new Response(
      JSON.stringify({
        success: true,
        opportunity_id: opportunityId,
        analysis_id: analysisRow.id,
        status: "brief_ready",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[generate-contractor-brief] unhandled exception:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
