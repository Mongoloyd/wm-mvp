import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Check, ShieldCheck } from "lucide-react";

interface ContractorMatchProps {
  isVisible: boolean;
  grade?: string;
  county?: string;
}

const vetItems = [
  "Each contractor submits 10+ sample quotes for our red flag audit before they're listed in our network.",
  "We verify they use brand-specified quotes, standard warranty language, and fair-market deposit structures.",
  "Homeowner feedback scores are updated monthly. Any contractor below 4.6 is removed.",
  "Your contractor never sees your WindowMan grade report unless you choose to share it.",
];

const ContractorMatch = ({ isVisible, grade = "C", county = "Broward", dollarDelta = 4800 }: ContractorMatchProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [introRequested, setIntroRequested] = useState(false);
  const isGoodGrade = grade === "A" || grade === "B";

  useEffect(() => {
    if (isVisible && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <motion.div ref={ref} id="contractor-match" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} style={{ background: "#0F1F35" }} className="py-16 md:py-24 px-4 md:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#0099BB", letterSpacing: "0.1em", marginBottom: 20 }}>YOUR WINDOWMAN INTRODUCTION</p>

        {isGoodGrade ? (
          <>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontSize: "clamp(30px, 5vw, 36px)", color: "white", fontWeight: 800, letterSpacing: "-0.02em" }}>Your quote scored {grade}. It's competitive.</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: "#D1D5DB", lineHeight: 1.75, maxWidth: 580, margin: "14px auto 0" }}>You're in a good position. Before you sign — here's the one question worth asking about the warranty.</p>
            <div className="mx-auto text-left" style={{ maxWidth: 480, marginTop: 32, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(200,149,42,0.25)", borderRadius: 14, padding: "28px 24px" }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#6B7280", letterSpacing: "0.1em", marginBottom: 12 }}>WARRANTY CHECK</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#D1D5DB", lineHeight: 1.8 }}>"What happens if a seal fails in year 3 — is the labor to replace the unit covered under your warranty, or just the glass?"</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#94A3B8", marginTop: 12, lineHeight: 1.7 }}>Most contractors cover the product but not the labor after year 1. A good warranty covers both for at least 3 years. Ask before you sign.</p>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", margin: "20px 0" }} />
              <button onClick={() => console.log({ event: "wm_comparison_quote_requested", grade })} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#94A3B8", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>Request a comparison quote anyway →</button>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontSize: "clamp(30px, 5vw, 36px)", color: "white", fontWeight: 800, letterSpacing: "-0.02em" }}>I found a contractor who will do this job for less.</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: "#D1D5DB", lineHeight: 1.75, maxWidth: 580, margin: "14px auto 0" }}>Based on your grade and the red flags in your quote, I've identified a {county} County contractor in our network who covers your scope at fair-market pricing.<br /><br />I'd like to make an introduction.</p>
            <div className="mx-auto text-left" style={{ maxWidth: 480, marginTop: 32, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(200,149,42,0.4)", borderRadius: 14, padding: "32px 28px" }}>
              {!introRequested ? (
                <>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center flex-shrink-0" style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(200,149,42,0.15)", border: "2px solid #C8952A" }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, color: "#C8952A" }}>WM</span>
                    </div>
                    <div>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "white" }}>WindowMan Verified Contractor</p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#94A3B8" }}>{county} County, Florida · Vetted Q1 2025</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["✓ Fair-market priced", "✓ Brand-specified quotes", "✓ 3yr labor warranty"].map((badge) => (
                          <span key={badge} style={{ background: "rgba(5,150,105,0.15)", border: "1px solid rgba(5,150,105,0.3)", borderRadius: 999, padding: "3px 10px", fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6EE7B7", fontWeight: 600 }}>{badge}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", margin: "20px 0" }} />
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#6B7280", letterSpacing: "0.1em", marginBottom: 12 }}>WHAT HAPPENS NEXT</p>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#D1D5DB", lineHeight: 1.9 }}>
                    <p>1. I pass your project details to our contractor — including your grade report and the issues we found.</p>
                    <p style={{ marginTop: 4 }}>2. They'll reach out to schedule a free measurement.</p>
                    <p style={{ marginTop: 4 }}>3. Their quote comes in writing with every specification named.</p>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { console.log({ event: "wm_contractor_intro_requested", grade, dollarDelta }); setIntroRequested(true); }}
                    style={{ width: "100%", marginTop: 24, background: "#C8952A", color: "white", fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 700, height: 54, borderRadius: 10, border: "none", cursor: "pointer" }}>
                    Yes — Make the Introduction →
                  </motion.button>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6B7280", textAlign: "center", marginTop: 12, fontStyle: "italic" }}>No obligation. The estimate is free.<br />You're under no pressure to accept it.</p>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="text-center py-4">
                  <div className="mx-auto flex items-center justify-center" style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(5,150,105,0.15)", border: "2px solid rgba(5,150,105,0.4)" }}>
                    <Check size={32} color="#059669" strokeWidth={3} />
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 700, color: "white", marginTop: 16 }}>Introduction requested.</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#D1D5DB", lineHeight: 1.8, marginTop: 12 }}>I've flagged your project. Our contractor will reach out within 2 business hours to schedule your free measurement.<br /><br />They already have your grade report. They know what your current quote missed. The conversation starts where most conversations end.</p>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9CA3AF", marginTop: 16 }}>You can still use your negotiation script with your current contractor. Having options is the point.</p>
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="max-w-4xl mx-auto mt-10" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "32px 28px" }}>
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="flex flex-col items-center flex-shrink-0">
            <ShieldCheck size={64} color="#059669" strokeWidth={1.5} />
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 700, color: "white", marginTop: 12, textAlign: "center" }}>How WindowMan vets these contractors</p>
          </div>
          <div className="flex flex-col gap-3">
            {vetItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#059669", flexShrink: 0, marginTop: 2 }}>✓</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#D1D5DB", lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-10 text-center">
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#6B7280", lineHeight: 1.8 }}>Not ready to talk to a contractor yet? That's completely fine.<br />Your grade report is saved in your WindowMan Vault —<br />come back to it whenever you're ready.</p>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#0099BB", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", marginTop: 8, display: "inline-block" }}>View my saved report →</button>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#4B5563", fontStyle: "italic", marginTop: 16, lineHeight: 1.8, maxWidth: 520, margin: "16px auto 0" }}>You are under no obligation to contact anyone.<br />WindowMan earns a referral fee only if you choose to work with a matched contractor.</p>
      </div>
    </motion.div>
  );
};

export default ContractorMatch;
