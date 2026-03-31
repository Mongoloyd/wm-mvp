/**
 * send-report-email — Sends branded WindowMan report emails via Resend.
 *
 * Two email types:
 *   "preview"  — Sent after scan completes. Shows grade, flag count, CTA to unlock.
 *   "full"     — Sent after OTP verification. Shows full findings + negotiation CTA.
 *
 * Idempotent: checks leads.report_email_sent_at to prevent duplicate sends.
 *
 * POST { scan_session_id, email_type: "preview" | "full" }
 *
 * Required secrets:
 *   RESEND_API_KEY       — Resend.com API key
 *   REPORT_FROM_EMAIL    — Verified sender (e.g. reports@windowman.pro)
 *   REPORT_BASE_URL      — App URL for deep links (e.g. https://wmmvp.lovable.app)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Grade color mapping ──────────────────────────────────────────────────────
function gradeColor(grade: string): string {
  if (grade === "A" || grade === "B") return "#10B981";
  if (grade === "C") return "#F59E0B";
  return "#DC2626";
}

function gradeEmoji(grade: string): string {
  if (grade === "A") return "\u2705";
  if (grade === "B") return "\u2705";
  if (grade === "C") return "\u26A0\uFE0F";
  return "\uD83D\uDEA8";
}

function pillarStatusLabel(status: string): { label: string; color: string } {
  if (status === "pass") return { label: "PASS", color: "#10B981" };
  if (status === "warn") return { label: "REVIEW", color: "#F59E0B" };
  return { label: "FAIL", color: "#DC2626" };
}

// ── Email template builder ───────────────────────────────────────────────────
function buildPreviewEmail(params: {
  firstName: string;
  grade: string;
  flagCount: number;
  redFlagCount: number;
  county: string;
  pillarScores: Record<string, { status: string }> | null;
  deepLink: string;
}): { subject: string; html: string } {
  const { firstName, grade, flagCount, redFlagCount, county, pillarScores, deepLink } = params;
  const gColor = gradeColor(grade);
  const emoji = gradeEmoji(grade);

  const pillarRows = pillarScores
    ? Object.entries(pillarScores)
        .map(([key, val]) => {
          const { label, color } = pillarStatusLabel(val.status);
          const name = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
          return `<tr><td style="padding:8px 12px;font-size:14px;color:#C8DEFF;border-bottom:1px solid #1E293B;">${name}</td><td style="padding:8px 12px;font-size:14px;font-weight:700;color:${color};text-align:right;border-bottom:1px solid #1E293B;">${label}</td></tr>`;
        })
        .join("")
    : "";

  const subject = `${emoji} Your Quote Grade: ${grade} — ${flagCount} Issue${flagCount !== 1 ? "s" : ""} Found | WindowMan`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0A0E14;font-family:'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0E14;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111418;border:1px solid #2E3A50;">

<!-- Header -->
<tr><td style="padding:28px 32px 20px;border-bottom:1px solid #1E293B;">
  <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.12em;color:#49A5FF;font-weight:700;text-transform:uppercase;margin-bottom:4px;">WINDOWMAN QUOTE SCANNER</div>
  <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:22px;font-weight:900;color:#FFFFFF;text-transform:uppercase;">Your Quote Report</div>
</td></tr>

<!-- Grade -->
<tr><td style="padding:28px 32px;text-align:center;">
  <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.12em;color:#A0B8D8;font-weight:600;text-transform:uppercase;margin-bottom:12px;">OVERALL GRADE</div>
  <div style="display:inline-block;width:80px;height:80px;line-height:80px;font-size:48px;font-weight:900;color:${gColor};background:${gColor}15;border:2px solid ${gColor}40;text-align:center;">${grade}</div>
  <div style="font-size:14px;color:#A0B8D8;margin-top:12px;">
    ${flagCount} issue${flagCount !== 1 ? "s" : ""} found${redFlagCount > 0 ? ` — <span style="color:#DC2626;font-weight:700;">${redFlagCount} critical</span>` : ""}
  </div>
  ${county ? `<div style="font-size:13px;color:#64748B;margin-top:6px;">${county} County market comparison</div>` : ""}
</td></tr>

<!-- Pillar Scores -->
${pillarRows ? `<tr><td style="padding:0 32px 24px;">
  <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:0.12em;color:#A0B8D8;font-weight:600;text-transform:uppercase;margin-bottom:8px;">PILLAR BREAKDOWN</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0E14;border:1px solid #1E293B;">
    ${pillarRows}
  </table>
</td></tr>` : ""}

<!-- Greeting -->
<tr><td style="padding:0 32px 24px;">
  <p style="font-size:15px;color:#C8DEFF;line-height:1.65;margin:0;">
    Hi ${firstName},<br><br>
    Your impact window quote has been analyzed. We found <strong style="color:#FFFFFF;">${flagCount} issue${flagCount !== 1 ? "s" : ""}</strong> that may be costing you money or putting your home at risk.
    ${grade === "D" || grade === "F" ? "<br><br><strong style=\"color:#DC2626;\">This quote scored significantly below market standards.</strong> We recommend reviewing the full findings before signing anything." : ""}
  </p>
</td></tr>

<!-- CTA -->
<tr><td style="padding:0 32px 32px;text-align:center;">
  <a href="${deepLink}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#C8952A,#E2B04A);color:#0D0D0D;font-size:16px;font-weight:800;text-decoration:none;text-transform:uppercase;letter-spacing:0.04em;">View Full Report</a>
  <p style="font-size:12px;color:#64748B;margin-top:12px;">Your full report includes detailed findings, flag explanations, and negotiation guidance.</p>
</td></tr>

<!-- Footer -->
<tr><td style="padding:20px 32px;border-top:1px solid #1E293B;text-align:center;">
  <p style="font-size:11px;color:#475569;margin:0;">WindowMan — Free AI Quote Scanner for Impact Windows</p>
  <p style="font-size:10px;color:#334155;margin:4px 0 0;">No contractor will be contacted without your permission.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject, html };
}

// ── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scan_session_id, email_type = "preview" } = await req.json();

    if (!scan_session_id) {
      return json({ error: "scan_session_id required" }, 400);
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("REPORT_FROM_EMAIL") || "WindowMan <onboarding@resend.dev>";
    const baseUrl = Deno.env.get("REPORT_BASE_URL") || "https://wmmvp.lovable.app";

    if (!resendKey) {
      console.warn("[send-report-email] RESEND_API_KEY not configured — skipping send");
      return json({ success: false, skipped: true, reason: "email_not_configured" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Resolve session → lead + analysis
    const { data: session } = await supabase
      .from("scan_sessions")
      .select("lead_id")
      .eq("id", scan_session_id)
      .maybeSingle();

    if (!session?.lead_id) {
      return json({ error: "Session not found or no lead linked" }, 404);
    }

    // 2. Get lead data
    const { data: lead } = await supabase
      .from("leads")
      .select("first_name, email, county, report_email_sent_at, report_email_type")
      .eq("id", session.lead_id)
      .maybeSingle();

    if (!lead?.email) {
      return json({ error: "Lead has no email address" }, 400);
    }

    // 3. Idempotency: don't send same type twice
    if (lead.report_email_sent_at && lead.report_email_type === email_type) {
      console.log(`[send-report-email] Already sent '${email_type}' to ${lead.email.slice(0, 3)}***`);
      return json({ success: true, already_sent: true });
    }

    // 4. Get analysis data
    const { data: analysis } = await supabase
      .from("analyses")
      .select("grade, flags, preview_json, full_json, analysis_status")
      .eq("scan_session_id", scan_session_id)
      .eq("analysis_status", "complete")
      .maybeSingle();

    if (!analysis) {
      return json({ error: "No completed analysis found" }, 400);
    }

    // 5. Build email
    const previewData = analysis.preview_json as Record<string, unknown> | null;
    const flags = Array.isArray(analysis.flags) ? analysis.flags : [];
    const redFlags = flags.filter((f: any) => f.severity === "Critical" || f.severity === "High");

    const deepLink = `${baseUrl}/?session=${scan_session_id}`;

    const { subject, html } = buildPreviewEmail({
      firstName: lead.first_name || "there",
      grade: analysis.grade || "?",
      flagCount: flags.length,
      redFlagCount: redFlags.length,
      county: lead.county || "",
      pillarScores: (previewData?.pillar_scores as Record<string, { status: string }>) || null,
      deepLink,
    });

    // 6. Send via Resend
    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [lead.email],
        subject,
        html,
      }),
    });

    const resendData = await resendResp.json();

    if (!resendResp.ok) {
      console.error("[send-report-email] Resend error:", resendData);
      return json({ success: false, error: "Email delivery failed", details: resendData }, 502);
    }

    // 7. Mark as sent (idempotency)
    const now = new Date().toISOString();
    await supabase
      .from("leads")
      .update({ report_email_sent_at: now, report_email_type: email_type })
      .eq("id", session.lead_id);

    // 8. Log event
    await supabase.from("event_logs").insert({
      event_name: "report_email_sent",
      session_id: scan_session_id,
      route: "/",
      metadata: {
        email_type,
        grade: analysis.grade,
        flag_count: flags.length,
        resend_id: resendData.id,
        timestamp: now,
      },
    });

    console.log(`[send-report-email] Sent '${email_type}' email for session ${scan_session_id}`);

    return json({
      success: true,
      email_type,
      resend_id: resendData.id,
    });
  } catch (err) {
    console.error("[send-report-email] unhandled error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
