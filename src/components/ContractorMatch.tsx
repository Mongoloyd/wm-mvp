import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ShieldCheck, Loader2, Phone, MapPin, Wrench, Award, ChevronRight } from "lucide-react";
import { trackEvent } from "@/lib/trackEvent";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MATCH_REASON_HOMEOWNER, type MatchReasonKey, type MatchConfidence } from "@/shared/matchReasons";

interface SuggestedMatch {
  confidence: MatchConfidence;
  reasons: string[];
  contractor_alias: string;
}

interface ContractorMatchProps {
  isVisible: boolean;
  grade?: string;
  county?: string;
  scanSessionId?: string | null;
  isFullLoaded?: boolean;
  phoneE164?: string | null;
}

const vetItems = [
  "Each contractor submits 10+ sample quotes for our red flag audit before they're listed in our network.",
  "We verify they use brand-specified quotes, standard warranty language, and fair-market deposit structures.",
  "Homeowner feedback scores are updated monthly. Any contractor below 4.6 is removed.",
  "Your contractor never sees your WindowMan grade report unless you choose to share it.",
];

const confidenceLabel: Record<MatchConfidence, { text: string; color: string; bg: string }> = {
  high: { text: "STRONG FIT", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  medium: { text: "GOOD FIT", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  low: { text: "POSSIBLE FIT", color: "#7D9DBB", bg: "rgba(125,157,187,0.12)" },
};

const ContractorMatch = ({ isVisible, grade = "C", county = "Broward", scanSessionId, isFullLoaded, phoneE164 }: ContractorMatchProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [introRequested, setIntroRequested] = useState(false);
  const [reportCallRequested, setReportCallRequested] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedMatch, setSuggestedMatch] = useState<SuggestedMatch | null>(null);
  const [opportunityId, setOpportunityId] = useState<string | null>(null);
  const isGoodGrade = grade === "A" || grade === "B";

  useEffect(() => { if (isVisible && ref.current) ref.current.scrollIntoView({ behavior: "smooth", block: "start" }); }, [isVisible]);
  if (!isVisible) return null;

  // ── CTA A: Introduction Request ──────────────────────────────────────
  const handleIntroRequest = async () => {
    if (!scanSessionId || !phoneE164) {
      toast.error("Unable to process request. Please verify your phone number first.");
      return;
    }

    setIsGenerating(true);
    trackEvent({
      event_name: "intro_call_requested",
      session_id: scanSessionId,
      metadata: { after_full_unlock: !!isFullLoaded, grade, cta_source: "intro_request" },
    });

    try {
      const { data, error } = await supabase.functions.invoke("generate-contractor-brief", {
        body: { scan_session_id: scanSessionId, phone_e164: phoneE164, cta_source: "intro_request" },
      });

      if (error || !data?.success) {
        console.error("[ContractorMatch] brief generation failed", error || data);
        toast.error("Something went wrong. Please try again.");
        setIsGenerating(false);
        return;
      }

      setOpportunityId(data.opportunity_id);
      if (data.suggested_match) {
        setSuggestedMatch(data.suggested_match);
        trackEvent({
          event_name: "suggested_match_shown_to_homeowner",
          session_id: scanSessionId,
          metadata: { opportunity_id: data.opportunity_id, confidence: data.suggested_match.confidence },
        });
      } else {
        trackEvent({
          event_name: "suggested_match_unavailable",
          session_id: scanSessionId,
          metadata: { opportunity_id: data.opportunity_id },
        });
      }

      // Fire voice followup webhook
      supabase.functions.invoke("voice-followup", {
        body: {
          scan_session_id: scanSessionId,
          phone_e164: phoneE164,
          call_intent: "contractor_intro",
          cta_source: "intro_request",
          opportunity_id: data.opportunity_id,
        },
      }).catch(err => console.warn("[ContractorMatch] voice followup failed", err));

      setIntroRequested(true);
      setIsGenerating(false);

      trackEvent({
        event_name: "contractor_brief_generated",
        session_id: scanSessionId,
        metadata: { opportunity_id: data.opportunity_id, grade },
      });
    } catch (err) {
      console.error("[ContractorMatch] unexpected error", err);
      toast.error("Connection error. Please try again.");
      setIsGenerating(false);
    }
  };

  // ── CTA B: Report Help Call ──────────────────────────────────────────
  const handleReportHelpCall = async () => {
    if (!scanSessionId || !phoneE164) {
      toast.error("Unable to process request. Please verify your phone number first.");
      return;
    }

    setIsGenerating(true);
    trackEvent({
      event_name: "report_help_call_requested",
      session_id: scanSessionId,
      metadata: { after_full_unlock: !!isFullLoaded, grade, cta_source: "report_help" },
    });

    try {
      // Fire voice followup for report help
      await supabase.functions.invoke("voice-followup", {
        body: {
          scan_session_id: scanSessionId,
          phone_e164: phoneE164,
          call_intent: "report_explainer",
          cta_source: "report_help",
        },
      });

      setReportCallRequested(true);
      setIsGenerating(false);
    } catch (err) {
      console.error("[ContractorMatch] report help call failed", err);
      toast.error("Connection error. Please try again.");
      setIsGenerating(false);
    }
  };

  // ── Good grade comparison request ────────────────────────────────────
  const handleComparisonRequest = () => {
    trackEvent({
      event_name: "contractor_match_clicked",
      session_id: scanSessionId,
      metadata: { after_full_unlock: !!isFullLoaded, grade, type: "comparison_request" },
    });
    handleIntroRequest();
  };

  const processSteps = [
    { label: "Best-fit candidate identified", done: introRequested && !!suggestedMatch },
    { label: "WindowMan ops confirms the fit", done: false },
    { label: "You receive an SMS/call update", done: false },
    { label: "Introduction completed if approved", done: false },
  ];

  return (
    <motion.div ref={ref} id="contractor-match" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} style={{ background: "#0A0A0A" }} className="py-16 md:py-24 px-4 md:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#C8952A", letterSpacing: "0.1em", marginBottom: 20 }}>YOUR WINDOWMAN INTRODUCTION</p>

        {/* ── GOOD GRADE PATH ── */}
        {isGoodGrade && !introRequested ? (
          <>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(30px, 5vw, 36px)", color: "#E5E5E5", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em" }}>Your quote scored {grade}. It's competitive.</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: "#E5E7EB", lineHeight: 1.75, maxWidth: 580, margin: "14px auto 0" }}>You're in a good position. Before you sign — here's the one question worth asking about the warranty.</p>
            <div className="mx-auto text-left" style={{ maxWidth: 480, marginTop: 32, background: "#111111", border: "1px solid #1A1A1A", borderRadius: 0, padding: "28px 24px" }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#E5E7EB", letterSpacing: "0.1em", marginBottom: 12 }}>WARRANTY CHECK</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#E5E5E5", lineHeight: 1.8 }}>"What happens if a seal fails in year 3 — is the labor to replace the unit covered under your warranty, or just the glass?"</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#E5E7EB", marginTop: 12, lineHeight: 1.7 }}>Most contractors cover the product but not the labor after year 1. A good warranty covers both for at least 3 years. Ask before you sign.</p>
              <div style={{ borderTop: "1px solid #1A1A1A", margin: "20px 0" }} />
              <button
                onClick={handleComparisonRequest}
                disabled={isGenerating}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: isGenerating ? "#7D9DBB" : "#E5E7EB", background: "none", border: "none", cursor: isGenerating ? "wait" : "pointer", textDecoration: "underline", padding: 0, display: "flex", alignItems: "center", gap: 6 }}
              >
                {isGenerating && <Loader2 size={14} className="animate-spin" />}
                {isGenerating ? "Processing..." : "Request a comparison quote anyway →"}
              </button>
            </div>
          </>
        ) : !introRequested && !reportCallRequested ? (
          /* ── BAD GRADE — DUAL CTA ── */
          <>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(30px, 5vw, 36px)", color: "#E5E5E5", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em" }}>I found a contractor who will do this job for less.</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: "#E5E7EB", lineHeight: 1.75, maxWidth: 580, margin: "14px auto 0" }}>Based on your grade and the red flags in your quote, I've identified a {county} County contractor in our network who covers your scope at fair-market pricing.<br /><br />I'd like to make an introduction.</p>

            <div className="mx-auto" style={{ maxWidth: 520, marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
              {/* CTA A — Introduction */}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={handleIntroRequest}
                disabled={isGenerating}
                style={{ width: "100%", background: isGenerating ? "#1e40af" : "#C8952A", color: "white", fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 700, height: 54, borderRadius: 0, border: "none", cursor: isGenerating ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px rgba(200,149,42,0.35)" }}>
                {isGenerating && <Loader2 size={18} className="animate-spin" />}
                {isGenerating ? "Processing..." : "I'd Like an Introduction →"}
              </motion.button>

              {/* CTA B — Report Help Call */}
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={handleReportHelpCall}
                disabled={isGenerating}
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", color: "#E5E7EB", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, height: 48, borderRadius: 0, border: "1.5px solid rgba(255,255,255,0.15)", cursor: isGenerating ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Phone size={16} />
                Call WindowMan About My Report
              </motion.button>

              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9CA3AF", textAlign: "center", marginTop: 4, fontStyle: "italic" }}>
                No obligation. Free estimate. You may receive a free WindowMan call to explain your report and next step.
              </p>
            </div>
          </>
        ) : introRequested ? (
          /* ── INTRO SUCCESS STATE + IMMEDIATE MATCH ── */
          <AnimatePresence mode="wait">
            <motion.div key="intro-success" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              {suggestedMatch ? (
                /* Potential Match Card */
                <div className="mx-auto text-left" style={{ maxWidth: 520, marginTop: 8 }}>
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(26px, 4vw, 32px)", color: "#E5E5E5", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em", textAlign: "center", marginBottom: 20 }}>
                    Potential match found for your project
                  </h2>

                  {/* Match Card */}
                  <div style={{ background: "#111111", border: "1px solid rgba(200,149,42,0.3)", padding: "28px 24px" }}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center justify-center flex-shrink-0" style={{ width: 56, height: 56, background: "rgba(200,149,42,0.1)", border: "2px solid #C8952A" }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 700, color: "#C8952A" }}>WM</span>
                      </div>
                      <div>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#E5E5E5" }}>WindowMan Verified Contractor</p>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9CA3AF" }}>{county} County, Florida</p>
                      </div>
                    </div>

                    {/* Confidence badge */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span style={{
                        background: confidenceLabel[suggestedMatch.confidence].bg,
                        color: confidenceLabel[suggestedMatch.confidence].color,
                        fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700,
                        padding: "3px 10px", letterSpacing: "0.08em",
                      }}>
                        {confidenceLabel[suggestedMatch.confidence].text}
                      </span>
                      <span style={{ background: "rgba(16,185,129,0.1)", color: "#10B981", fontFamily: "'DM Mono', monospace", fontSize: 10, padding: "3px 10px", fontWeight: 600, letterSpacing: "0.06em" }}>✓ VETTED</span>
                    </div>

                    {/* Fit Reasons */}
                    <div style={{ borderTop: "1px solid #1A1A1A", paddingTop: 16, marginTop: 8 }}>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#9CA3AF", letterSpacing: "0.1em", marginBottom: 10 }}>WHY THIS FIT</p>
                      <div className="flex flex-col gap-2">
                        {suggestedMatch.reasons.map((reason) => (
                          <div key={reason} className="flex items-start gap-2">
                            <ChevronRight size={12} color="#C8952A" style={{ marginTop: 3, flexShrink: 0 }} />
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#E5E7EB", lineHeight: 1.5 }}>
                              {MATCH_REASON_HOMEOWNER[reason as MatchReasonKey] || reason}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Process Strip */}
                  <div style={{ background: "#111111", border: "1px solid #1A1A1A", padding: "24px", marginTop: 12 }}>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#9CA3AF", letterSpacing: "0.1em", marginBottom: 14 }}>WHAT HAPPENS NEXT</p>
                    <div className="flex flex-col gap-3">
                      {processSteps.map((step, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div style={{
                            width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            background: step.done ? "rgba(16,185,129,0.15)" : "rgba(200,149,42,0.1)",
                            border: step.done ? "1.5px solid #10B981" : "1.5px solid rgba(200,149,42,0.3)",
                          }}>
                            {step.done ? <Check size={12} color="#10B981" /> : <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#C8952A" }}>{i + 1}</span>}
                          </div>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: step.done ? "#10B981" : "#E5E7EB" }}>{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Call Expectation */}
                  <div style={{ background: "rgba(200,149,42,0.06)", border: "1px solid rgba(200,149,42,0.2)", padding: "16px 20px", marginTop: 12, textAlign: "center" }}>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#E5E7EB", lineHeight: 1.7 }}>
                      You may receive a free WindowMan call shortly to explain your report, answer questions, and help move your introduction forward.
                    </p>
                  </div>

                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9CA3AF", textAlign: "center", marginTop: 16, fontStyle: "italic", lineHeight: 1.7 }}>
                    This is a candidate pending review by the WindowMan operations team.<br />Expect an SMS or call update within 15 minutes.
                  </p>
                </div>
              ) : (
                /* No Match Fallback */
                <div className="mx-auto text-center" style={{ maxWidth: 480, marginTop: 8 }}>
                  <div className="mx-auto flex items-center justify-center" style={{ width: 72, height: 72, background: "rgba(200,149,42,0.1)", border: "2px solid #C8952A" }}>
                    <Check size={32} color="#C8952A" strokeWidth={3} />
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 700, color: "#E5E5E5", marginTop: 16 }}>Introduction requested.</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#E5E7EB", lineHeight: 1.8, marginTop: 12 }}>
                    We're finalizing your best-fit contractor review now. Our operations team will identify the strongest candidate for your {county} County project.
                    <br /><br />
                    Expect an SMS or call update within 15 minutes.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        ) : reportCallRequested ? (
          /* ── REPORT HELP CALL SUCCESS STATE ── */
          <AnimatePresence mode="wait">
            <motion.div key="report-help-success" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="mx-auto text-center" style={{ maxWidth: 480 }}>
              <div className="mx-auto flex items-center justify-center" style={{ width: 72, height: 72, background: "rgba(200,149,42,0.1)", border: "2px solid #C8952A" }}>
                <Phone size={32} color="#C8952A" strokeWidth={2} />
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 700, color: "#E5E5E5", marginTop: 16 }}>Call requested.</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#E5E7EB", lineHeight: 1.8, marginTop: 12 }}>
                WindowMan is preparing a free call to explain your report and answer your questions.
                <br /><br />
                Expect a call or text within 15 minutes. We'll walk through what the Grade {grade} means, what the flags mean for your project, and what options you have.
              </p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9CA3AF", marginTop: 16 }}>You can still use your negotiation script with your current contractor.</p>
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>

      {/* ── HOW WINDOWMAN VETS ── */}
      <div className="max-w-4xl mx-auto mt-10" style={{ background: "#111111", border: "1px solid #1A1A1A", borderRadius: 0, padding: "32px 28px" }}>
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="flex flex-col items-center flex-shrink-0">
            <ShieldCheck size={64} color="#C8952A" strokeWidth={1.5} />
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 700, color: "#E5E5E5", marginTop: 12, textAlign: "center" }}>How WindowMan vets these contractors</p>
          </div>
          <div className="flex flex-col gap-3">
            {vetItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#C8952A", flexShrink: 0, marginTop: 2 }}>✓</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#E5E7EB", lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM SECTION ── */}
      <div className="max-w-4xl mx-auto mt-10 text-center">
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#E5E7EB", lineHeight: 1.8 }}>Not ready to talk to a contractor yet? That's completely fine.<br />Your grade report is saved in your WindowMan Vault —<br />come back to it whenever you're ready.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#C8952A", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>View my saved report →</button>
          <a href="/how-we-beat-window-quotes" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#9CA3AF", textDecoration: "underline", cursor: "pointer" }}>How WindowMan beats window quotes →</a>
        </div>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#9CA3AF", fontStyle: "italic", marginTop: 16, lineHeight: 1.8, maxWidth: 520, margin: "16px auto 0" }}>You are under no obligation to contact anyone.<br />WindowMan earns a referral fee only if you choose to work with a matched contractor.</p>
      </div>
    </motion.div>
  );
};

export default ContractorMatch;
