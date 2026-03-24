import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Check, ShieldCheck, Loader2 } from "lucide-react";
import { trackEvent } from "@/lib/trackEvent";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const ContractorMatch = ({ isVisible, grade = "C", county = "Broward", scanSessionId, isFullLoaded, phoneE164 }: ContractorMatchProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [introRequested, setIntroRequested] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const isGoodGrade = grade === "A" || grade === "B";

  useEffect(() => { if (isVisible && ref.current) ref.current.scrollIntoView({ behavior: "smooth", block: "start" }); }, [isVisible]);
  if (!isVisible) return null;

  const handleIntroRequest = async () => {
    if (!scanSessionId || !phoneE164) {
      toast.error("Unable to process request. Please verify your phone number first.");
      return;
    }

    setIsGenerating(true);
    trackEvent({
      event_name: "contractor_match_clicked",
      session_id: scanSessionId,
      metadata: { after_full_unlock: !!isFullLoaded, grade },
    });

    try {
      const { data, error } = await supabase.functions.invoke("generate-contractor-brief", {
        body: { scan_session_id: scanSessionId, phone_e164: phoneE164 },
      });

      if (error || !data?.success) {
        console.error("[ContractorMatch] brief generation failed", error || data);
        toast.error("Something went wrong. Please try again.");
        setIsGenerating(false);
        return;
      }

      setIntroRequested(true);
      setIsGenerating(false);

      trackEvent({
        event_name: "contractor_brief_generated",
        session_id: scanSessionId,
        metadata: {
          opportunity_id: data.opportunity_id,
          grade,
        },
      });
    } catch (err) {
      console.error("[ContractorMatch] unexpected error", err);
      toast.error("Connection error. Please try again.");
      setIsGenerating(false);
    }
  };

  const handleComparisonRequest = () => {
    trackEvent({
      event_name: "contractor_match_clicked",
      session_id: scanSessionId,
      metadata: { after_full_unlock: !!isFullLoaded, grade, type: "comparison_request" },
    });
    handleIntroRequest();
  };

  return (
    <motion.div ref={ref} id="contractor-match" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} style={{ background: "#0A0A0A" }} className="py-16 md:py-24 px-4 md:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#2563EB", letterSpacing: "0.1em", marginBottom: 20 }}>YOUR WINDOWMAN INTRODUCTION</p>
        {isGoodGrade ? (
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
                disabled={isGenerating || introRequested}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: isGenerating ? "#7D9DBB" : "#E5E7EB", background: "none", border: "none", cursor: isGenerating ? "wait" : "pointer", textDecoration: "underline", padding: 0, display: "flex", alignItems: "center", gap: 6 }}
              >
                {isGenerating && <Loader2 size={14} className="animate-spin" />}
                {introRequested ? "Introduction requested ✓" : isGenerating ? "Processing..." : "Request a comparison quote anyway →"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(30px, 5vw, 36px)", color: "#E5E5E5", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em" }}>I found a contractor who will do this job for less.</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: "#E5E7EB", lineHeight: 1.75, maxWidth: 580, margin: "14px auto 0" }}>Based on your grade and the red flags in your quote, I've identified a {county} County contractor in our network who covers your scope at fair-market pricing.<br /><br />I'd like to make an introduction.</p>
            <div className="mx-auto text-left" style={{ maxWidth: 480, marginTop: 32, background: "#111111", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 0, padding: "32px 28px" }}>
              {!introRequested ? (
                <>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center flex-shrink-0" style={{ width: 64, height: 64, borderRadius: 0, background: "rgba(37,99,235,0.1)", border: "2px solid #2563EB" }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, color: "#2563EB" }}>WM</span>
                    </div>
                    <div>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#E5E5E5" }}>WindowMan Verified Contractor</p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#E5E7EB" }}>{county} County, Florida · Vetted Q1 2025</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["✓ Fair-market priced", "✓ Brand-specified quotes", "✓ 3yr labor warranty"].map((badge) => (
                          <span key={badge} style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 0, padding: "3px 10px", fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#2563EB", fontWeight: 600 }}>{badge}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid #1A1A1A", margin: "20px 0" }} />
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#E5E7EB", letterSpacing: "0.1em", marginBottom: 12 }}>WHAT HAPPENS NEXT</p>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#E5E7EB", lineHeight: 1.9 }}>
                    <p>1. I pass your project details to our contractor — including your grade report and the issues we found.</p>
                    <p style={{ marginTop: 4 }}>2. They'll reach out to schedule a free measurement.</p>
                    <p style={{ marginTop: 4 }}>3. Their quote comes in writing with every specification named.</p>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={handleIntroRequest}
                    disabled={isGenerating}
                    style={{ width: "100%", marginTop: 24, background: isGenerating ? "#1e40af" : "#2563EB", color: "white", fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 700, height: 54, borderRadius: 0, border: "none", cursor: isGenerating ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {isGenerating && <Loader2 size={18} className="animate-spin" />}
                    {isGenerating ? "Processing..." : "Yes — Make the Introduction →"}
                  </motion.button>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#E5E7EB", textAlign: "center", marginTop: 12, fontStyle: "italic" }}>No obligation. The estimate is free.<br />You're under no pressure to accept it.</p>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }} className="text-center py-4">
                  <div className="mx-auto flex items-center justify-center" style={{ width: 72, height: 72, borderRadius: 0, background: "rgba(37,99,235,0.1)", border: "2px solid #2563EB" }}>
                    <Check size={32} color="#2563EB" strokeWidth={3} />
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 700, color: "#E5E5E5", marginTop: 16 }}>Introduction requested.</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#E5E7EB", lineHeight: 1.8, marginTop: 12 }}>I've flagged your project. Our contractor will reach out within 2 business hours to schedule your free measurement.<br /><br />They already have your grade report. They know what your current quote missed. The conversation starts where most conversations end.</p>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#E5E7EB", marginTop: 16 }}>You can still use your negotiation script with your current contractor. Having options is the point.</p>
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="max-w-4xl mx-auto mt-10" style={{ background: "#111111", border: "1px solid #1A1A1A", borderRadius: 0, padding: "32px 28px" }}>
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="flex flex-col items-center flex-shrink-0">
            <ShieldCheck size={64} color="#2563EB" strokeWidth={1.5} />
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 700, color: "#E5E5E5", marginTop: 12, textAlign: "center" }}>How WindowMan vets these contractors</p>
          </div>
          <div className="flex flex-col gap-3">
            {vetItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#2563EB", flexShrink: 0, marginTop: 2 }}>✓</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#E5E7EB", lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-10 text-center">
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#E5E7EB", lineHeight: 1.8 }}>Not ready to talk to a contractor yet? That's completely fine.<br />Your grade report is saved in your WindowMan Vault —<br />come back to it whenever you're ready.</p>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#2563EB", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", marginTop: 8, display: "inline-block" }}>View my saved report →</button>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#E5E7EB", fontStyle: "italic", marginTop: 16, lineHeight: 1.8, maxWidth: 520, margin: "16px auto 0" }}>You are under no obligation to contact anyone.<br />WindowMan earns a referral fee only if you choose to work with a matched contractor.</p>
      </div>
    </motion.div>
  );
};

export default ContractorMatch;
