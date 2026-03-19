import { motion } from "framer-motion";
import "@fontsource/dm-mono/500.css";
import { useTickerStats } from "@/hooks/useTickerStats";

const outcomes = [
  { icon: "✓", iconColor: "#2563EB", title: "Walk in knowing the fair price", sub: "Before they quote you a single number" },
  { icon: "📋", iconColor: "#F97316", title: "Know the 5 questions to ask", sub: "The questions contractors hope you never think to ask" },
  { icon: "🔔", iconColor: "#2563EB", title: "Get a reminder to scan your quote", sub: "We'll text you the moment you need to upload it" },
];

const timelineSteps = [
  { num: "1", numColor: "#2563EB", badgeBg: "rgba(37,99,235,0.1)", badgeColor: "#2563EB", badgeText: "HAPPENING NOW", title: "Build your fair-market baseline", copy: "3 quick questions. We generate your county-specific price benchmark.", preview: "price" },
  { num: "2", numColor: "#F97316", badgeBg: "rgba(249,115,22,0.1)", badgeColor: "#F97316", badgeText: "WHEN YOU HAVE YOUR QUOTE", title: "Upload it for your full AI audit", copy: "The baseline becomes your benchmark. Your quote gets graded against it instantly.", preview: "grade" },
  { num: "3", numColor: "#2563EB", badgeBg: "rgba(37,99,235,0.1)", badgeColor: "#2563EB", badgeText: "BEFORE YOU SIGN", title: "Know exactly what to negotiate", copy: "Red flags. Dollar delta. Negotiation script. Everything you need to walk away with a fair deal.", preview: null },
];

interface FlowBEntryProps { onContinueToTool: () => void; onSwitchToFlowA: () => void; }

const FlowBEntry = ({ onContinueToTool, onSwitchToFlowA }: FlowBEntryProps) => {
  const { total: tickerTotal } = useTickerStats();
  return (
    <div id="flow-b">
      <section style={{ backgroundColor: "#0A0A0A" }}>
        <div className="mx-auto max-w-5xl px-4 pt-14 pb-16 md:px-8 md:pt-20 md:pb-24">
          <div className="inline-flex items-center gap-2 mb-5" style={{ background: "rgba(37,99,235,0.1)", border: "1px solid #2563EB", borderRadius: 0, padding: "5px 14px" }}>
            <span style={{ color: "#2563EB", fontSize: 14 }}>★</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#2563EB" }}>YOU'RE EARLY — THAT'S THE BEST POSITION TO BE IN</span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(42px, 5.5vw, 58px)", fontWeight: 800, letterSpacing: "0.02em", color: "#E5E5E5", lineHeight: 1.15, marginBottom: 20, textTransform: "uppercase" }}>
            You Don't Have a Quote Yet.<br /><span style={{ color: "#2563EB" }}>Perfect. You Still Have All The Power.</span>
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(19px, 2vw, 21px)", color: "#E5E7EB", lineHeight: 1.75, marginBottom: 12, maxWidth: 640 }}>
            Contractors walk in knowing the market price.<br />Most homeowners don't. WindowMan flips that.
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#E5E7EB", lineHeight: 1.7, marginBottom: 36, maxWidth: 580 }}>
            In 2 minutes, we'll generate your county-specific fair-market baseline. So when the contractor opens their briefcase, you already know the number they're hoping you don't.
          </p>
          <div className="flex flex-col md:flex-row gap-5 mb-10" style={{ maxWidth: 680 }}>
            {outcomes.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, borderRadius: 0, background: "#111111", border: "1px solid #1A1A1A" }}>
                  <span style={{ fontSize: 16, color: item.iconColor }}>{item.icon}</span>
                </div>
                <div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, color: "#E5E5E5" }}>{item.title}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#E5E7EB", marginTop: 2 }}>{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onContinueToTool}
            style={{ background: "#2563EB", color: "#FFFFFF", fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 700, padding: "16px 36px", borderRadius: 0, border: "none", boxShadow: "0 4px 16px rgba(37,99,235,0.35)", cursor: "pointer" }}>
            Build My Baseline — It's Free →
          </motion.button>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6B7280", marginTop: 14 }}>
            Actually, I do have a quote —{" "}
            <button onClick={onSwitchToFlowA} style={{ background: "none", border: "none", color: "#2563EB", textDecoration: "underline", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: 0 }}>Scan it instead →</button>
          </p>
        </div>
      </section>

      <section style={{ backgroundColor: "#111111", borderTop: "1px solid #1A1A1A" }}>
        <div className="mx-auto max-w-4xl px-4 py-14 md:px-8 md:py-20">
          <p className="text-center mb-4" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#2563EB", letterSpacing: "0.1em" }}>WHAT FLOW B GIVES YOU</p>
          <h2 className="text-center" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(30px, 4vw, 38px)", fontWeight: 800, letterSpacing: "0.02em", color: "#E5E5E5", marginBottom: 48, textTransform: "uppercase" }}>
            The Contractor Will Arrive Armed With Information.<br className="hidden md:block" /> Now you will too.
          </h2>
          <div className="relative">
            <div className="hidden md:block absolute" style={{ top: 20, left: "16.6%", right: "16.6%", height: 2, background: "#1A1A1A" }} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 relative">
              <div className="md:hidden absolute" style={{ left: 19, top: 40, bottom: 40, width: 2, background: "#1A1A1A" }} />
              {timelineSteps.map((step, i) => (
                <div key={i} className="relative flex md:flex-col items-start md:items-center gap-4 md:gap-0">
                  <div className="shrink-0 flex items-center justify-center relative z-10" style={{ width: 40, height: 40, borderRadius: 0, background: "#0A0A0A", border: `2px solid ${step.numColor}`, fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: step.numColor }}>{step.num}</div>
                  <div className="md:mt-4 md:text-center">
                    <span className="inline-block mb-2" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, background: step.badgeBg, color: step.badgeColor, padding: "3px 10px", borderRadius: 0 }}>{step.badgeText}</span>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#E5E5E5", marginBottom: 6 }}>{step.title}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#E5E7EB", lineHeight: 1.6 }}>{step.copy}</p>
                    {step.preview === "price" && (
                      <div className="relative mt-3 md:mx-auto" style={{ background: "#0A0A0A", border: "1px solid #1A1A1A", borderRadius: 0, padding: "12px 14px", maxWidth: 280 }}>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#6B7280", marginBottom: 6 }}>FAIR MARKET RANGE · BROWARD CO.</p>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 700, color: "#2563EB", filter: "blur(5px)", userSelect: "none" }}>$12,400 – $14,800</p>
                        <p className="absolute inset-0 flex items-center justify-center" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#6B7280", fontStyle: "italic", paddingTop: 16 }}>Unlock after step 3</p>
                      </div>
                    )}
                    {step.preview === "grade" && (
                      <div className="relative mt-3 md:mx-auto" style={{ background: "#0A0A0A", border: "1px solid #1A1A1A", borderRadius: 0, padding: "12px 14px", maxWidth: 280 }}>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 40, fontWeight: 800, color: "#F97316", filter: "blur(5px)", userSelect: "none", lineHeight: 1, textAlign: "center" }}>C</p>
                        <p className="absolute inset-0 flex items-center justify-center" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#E5E7EB", fontStyle: "italic" }}>Your Grade Waits Here</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center mt-10">
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#E5E7EB", fontStyle: "italic" }}>Most contractors budget on the assumption you won't check.<br className="hidden md:block" /> You're about to become the unexpected.</p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#E5E7EB", marginTop: 8 }}>{tickerTotal.toLocaleString()} Florida homeowners did this before their last window project.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FlowBEntry;
