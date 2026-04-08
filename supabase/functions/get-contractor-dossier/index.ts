/**
 * get-contractor-dossier — Secure dossier read path for contractors.
 *
 * Resolves route param (analysis id) → analysis + lead data.
 * Masks PII unless the contractor has unlocked the lead.
 * Returns credit balance and unlock state as meta.
 *
 * Inputs: { id: uuid } — the analysis id from the route param
 * Auth: JWT required
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function maskString(value: string | null | undefined, visibleEnd = 4): string {
  if (!value) return "••••••••";
  if (value.length <= visibleEnd) return "••••••••";
  return "•".repeat(value.length - visibleEnd) + value.slice(-visibleEnd);
}

function maskEmail(email: string | null | undefined): string {
  if (!email) return "••••@••••.•••";
  const at = email.indexOf("@");
  if (at < 1) return "••••@••••.•••";
  return "•".repeat(at) + email.slice(at);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "unauthenticated", message: "Missing auth token." }, 401);
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claimsData?.claims?.sub) {
      return json({ error: "unauthenticated", message: "Invalid auth token." }, 401);
    }
    const contractorId = claimsData.claims.sub as string;

    // ── Input ─────────────────────────────────────────────────────
    const body = await req.json();
    const routeId = body?.id;
    if (!routeId || typeof routeId !== "string") {
      return json({ error: "invalid_input", message: "id is required." }, 400);
    }

    // ── Service client for data reads ─────────────────────────────
    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Resolve route id as analysis id ───────────────────────────
    const { data: analysis, error: aErr } = await svc
      .from("analyses")
      .select("id, grade, confidence_score, flags, full_json, proof_of_read, preview_json, document_type, rubric_version, created_at, lead_id")
      .eq("id", routeId)
      .maybeSingle();

    if (aErr) {
      console.error("[get-contractor-dossier] Analysis fetch error:", aErr);
      return json({ error: "fetch_error", message: "Failed to fetch analysis." }, 500);
    }

    if (!analysis) {
      return json({ error: "not_found", message: "Dossier not found for the given ID." }, 404);
    }

    const leadId = analysis.lead_id;

    // ── Fetch lead data ───────────────────────────────────────────
    let lead: Record<string, unknown> | null = null;
    if (leadId) {
      const { data: leadRow } = await svc
        .from("leads")
        .select("id, first_name, last_name, email, phone_e164, city, state, county, project_type, quote_range, window_count, grade, estimated_savings_low, estimated_savings_high")
        .eq("id", leadId)
        .maybeSingle();
      lead = leadRow;
    }

    // ── Check unlock state ────────────────────────────────────────
    let alreadyUnlocked = false;
    if (leadId) {
      const { data: unlockRow } = await svc
        .from("contractor_unlocked_leads")
        .select("id")
        .eq("contractor_id", contractorId)
        .eq("lead_id", leadId)
        .maybeSingle();
      alreadyUnlocked = !!unlockRow;
    }

    // ── Fetch contractor profile & credits ────────────────────────
    const { data: profile } = await svc
      .from("contractor_profiles")
      .select("status")
      .eq("id", contractorId)
      .maybeSingle();

    const contractorStatus = (profile?.status as string) ?? "unknown";

    const { data: creditRow } = await svc
      .from("contractor_credits")
      .select("balance")
      .eq("contractor_id", contractorId)
      .maybeSingle();

    const creditBalance = (creditRow?.balance as number) ?? 0;
    const canUnlock = contractorStatus === "active" && creditBalance >= 1 && !!leadId;

    // ── Build extraction snapshot ─────────────────────────────────
    const fullJson = (analysis.full_json ?? {}) as Record<string, unknown>;
    const extraction = (fullJson.extraction ?? {}) as Record<string, unknown>;
    const pillarScores = (fullJson.pillar_scores ?? {}) as Record<string, number>;
    const flags = Array.isArray(analysis.flags) ? analysis.flags : [];

    // ── Apply masking ─────────────────────────────────────────────
    const masked = !alreadyUnlocked;

    const dossierLead = lead
      ? {
          id: lead.id,
          first_name: masked ? maskString(lead.first_name as string, 1) : lead.first_name,
          last_name: masked ? maskString(lead.last_name as string, 1) : lead.last_name,
          email: masked ? maskEmail(lead.email as string) : lead.email,
          phone_e164: masked ? maskString(lead.phone_e164 as string, 4) : lead.phone_e164,
          city: lead.city,
          state: lead.state,
          county: lead.county,
          project_type: lead.project_type,
          quote_range: lead.quote_range,
          window_count: lead.window_count,
          estimated_savings_low: lead.estimated_savings_low,
          estimated_savings_high: lead.estimated_savings_high,
        }
      : null;

    const dossierAnalysis = {
      id: analysis.id,
      grade: analysis.grade,
      confidence_score: analysis.confidence_score,
      document_type: analysis.document_type,
      rubric_version: analysis.rubric_version,
      created_at: analysis.created_at,
      flag_count: flags.length,
      red_flag_count: flags.filter(
        (f: Record<string, unknown>) =>
          f.severity === "Critical" || f.severity === "High",
      ).length,
      amber_flag_count: flags.filter(
        (f: Record<string, unknown>) => f.severity === "Medium",
      ).length,
    };

    const dossierExtraction = {
      total_quoted_price: extraction.total_quoted_price ?? null,
      total_opening_count: extraction.total_opening_count ?? null,
      project_type: extraction.project_type ?? null,
      // Mask competitor name
      company_name: masked
        ? maskString(extraction.company_name as string, 0)
        : extraction.company_name ?? null,
    };

    const dossierFlags = flags.map((f: Record<string, unknown>) => ({
      label: f.label ?? f.flag_key ?? "Flag",
      detail: f.detail ?? f.description ?? "",
      severity: f.severity ?? "Medium",
      pillar: f.pillar ?? null,
      tip: masked ? null : (f.tip ?? null),
    }));

    const dossier = {
      lead: dossierLead,
      analysis: dossierAnalysis,
      extraction: dossierExtraction,
      pillar_scores: pillarScores,
      flags: dossierFlags,
      proof_of_read: analysis.proof_of_read,
    };

    const meta = {
      analysis_id: analysis.id,
      lead_id: leadId,
      contractor_id: contractorId,
      credit_balance: creditBalance,
      already_unlocked: alreadyUnlocked,
      can_unlock: canUnlock,
      contractor_status: contractorStatus,
      masked,
    };

    return json({ dossier, meta });
  } catch (err) {
    console.error("[get-contractor-dossier] Unhandled error:", err);
    return json({ error: "internal_error", message: "Internal server error." }, 500);
  }
});
