import { motion } from "framer-motion";
import "@fontsource/dm-mono/500.css";

const outcomes = [
  { bg: "hsl(152 82% 96%)", icon: "✓", iconColor: "hsl(160 84% 39%)", title: "Walk in knowing the fair price", sub: "Before they quote you a single number" },
  { bg: "hsl(39 90% 94%)", icon: "📋", iconColor: "hsl(36 77% 47%)", title: "Know the 5 questions to ask", sub: "The questions contractors hope you never think to ask" },
  { bg: "hsl(192 76% 94%)", icon: "🔔", iconColor: "hsl(192 100% 37%)", title: "Get a reminder to scan your quote", sub: "We'll text you the moment you need to upload it" },
];

const timelineSteps = [
  { num: "1", numColor: "hsl(192 100% 37%)", badgeBg: "hsl(192 76% 94%)", badgeColor: "hsl(192 100% 37%)", badgeText: "HAPPENING NOW", title: "Build your fair-market baseline", copy: "3 quick questions. We generate your county-specific price benchmark.", preview: "price" },
  { num: "2", numColor: "hsl(36 77% 47%)", badgeBg: "hsl(39 90% 94%)", badgeColor: "hsl(36 77% 47%)", badgeText: "WHEN YOU HAVE YOUR QUOTE", title: "Upload it for your full AI audit", copy: "The baseline becomes your benchmark. Your quote gets graded against it instantly.", preview: "grade" },
  { num: "3", numColor: "hsl(160 84% 39%)", badgeBg: "hsl(152 82% 96%)", badgeColor: "hsl(160 84% 39%)", badgeText: "BEFORE YOU SIGN", title: "Know exactly what to negotiate", copy: "Red flags. Dollar delta. Negotiation script. Everything you need to walk away with a fair deal.", preview: null },
];

interface FlowBEntryProps { onContinueToTool: () => void; onSwitchToFlowA: () => void; }

const FlowBEntry = ({ onContinueToTool, onSwitchToFlowA }: FlowBEntryProps) => {
  return (
    <div id="flow-b">
      <section className="frosted-card-light frosted-section-spacing">
        <div className="mx-auto max-w-5xl px-4 pt-14 pb-16 md:px-8 md:pt-20 md:pb-24">
          <div className="inline-flex items-center gap-2 mb-5" style={{ background: "hsl(152 82% 96%)", border: "1px solid hsl(160 84% 39%)", borderRadius: 6, padding: "5px 14px" }}>
            <span style={{ color: "hsl(160 84% 39%)", fontSize: 14 }}>★</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "hsl(160 84% 39%)" }}>YOU'RE EARLY — THAT'S THE BEST POSITION TO BE IN</span>
          </div>
          <h1 style={{ fontFamily: "'Jost', sans-serif", fontSize: "clamp(42px, 5.5vw, 58px)", fontWeight: 800, letterSpacing: "-0.02em", color: "hsl(213 57% 14%)", lineHeight: 1.15, marginBottom: 20 }}>
            You Don't Have a Quote Yet.<br /><span style={{ color: "hsl(160 84% 39%)" }}>Perfect You Still Have All The Power.</span>
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(19px, 2vw, 21px)", color: "hsl(220 9% 46%)", lineHeight: 1.75, marginBottom: 12, maxWidth: 640 }}>
            Contractors Walk in Knowing The Market Price.<br />Most Homeowners Don't. WindowMan Flips That.
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "hsl(220 9% 46%)", lineHeight: 1.7, marginBottom: 36, maxWidth: 580 }}>
            In 2 minutes, we'll generate your county-specific fair-market baseline. So when the contractor opens their briefcase, you already know the number they're hoping you don't.
          </p>
          <div className="flex flex-col md:flex-row gap-5 mb-10" style={{ maxWidth: 680 }}>
            {outcomes.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, borderRadius: "50%", background: item.bg }}>
                  <span style={{ fontSize: 16, color: item.iconColor }}>{item.icon}</span>
                </div>
                <div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, color: "hsl(213 57% 14%)" }}>{item.title}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "hsl(220 9% 46%)", marginTop: 2 }}>{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onContinueToTool}
            style={{ background: "hsl(160 84% 39%)", color: "hsl(0 0% 100%)", fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 700, padding: "16px 36px", borderRadius: 10, border: "none", boxShadow: "0 4px 16px hsla(160 84% 39% / 0.35)", cursor: "pointer" }}>
            Build My Baseline — It's Free →
          </motion.button>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "hsl(220 9% 64%)", marginTop: 14 }}>
            Actually, I Do Have a Quote —{" "}
            <button onClick={onSwitchToFlowA} style={{ background: "none", border: "none", color: "hsl(192 100% 37%)", textDecoration: "underline", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: 0 }}>Scan It Instead →</button>
          </p>
        </div>
      </section>

      <section style={{ backgroundColor: "hsl(210 20% 98%)", borderTop: "1px solid hsl(220 13% 91%)" }}>
        <div className="mx-auto max-w-4xl px-4 py-14 md:px-8 md:py-20">
          <p className="text-center mb-4" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "hsl(192 100% 37%)", letterSpacing: "0.1em" }}>WHAT FLOW B GIVES YOU</p>
          <h2 className="text-center" style={{ fontFamily: "'Jost', sans-serif", fontSize: "clamp(30px, 4vw, 38px)", fontWeight: 800, letterSpacing: "-0.02em", color: "hsl(213 57% 14%)", marginBottom: 48 }}>
            The Contractor Will Arrive Armed With Information.<br className="hidden md:block" /> Now you will too.
          </h2>
          <div className="relative">
            <div className="hidden md:block absolute" style={{ top: 20, left: "16.6%", right: "16.6%", height: 2, background: "hsl(220 13% 91%)" }} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 relative">
              <div className="md:hidden absolute" style={{ left: 19, top: 40, bottom: 40, width: 2, background: "hsl(220 13% 91%)" }} />
              {timelineSteps.map((step, i) => (
                <div key={i} className="relative flex md:flex-col items-start md:items-center gap-4 md:gap-0">
                  <div className="shrink-0 flex items-center justify-center relative z-10" style={{ width: 40, height: 40, borderRadius: "50%", background: "hsl(0 0% 100%)", border: `2px solid ${step.numColor}`, fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: step.numColor }}>{step.num}</div>
                  <div className="md:mt-4 md:text-center">
                    <span className="inline-block mb-2" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, background: step.badgeBg, color: step.badgeColor, padding: "3px 10px", borderRadius: 999 }}>{step.badgeText}</span>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "hsl(213 57% 14%)", marginBottom: 6 }}>{step.title}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "hsl(220 9% 46%)", lineHeight: 1.6 }}>{step.copy}</p>
                    {step.preview === "price" && (
                      <div className="relative mt-3 md:mx-auto" style={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 13% 91%)", borderRadius: 8, padding: "12px 14px", maxWidth: 280 }}>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "hsl(220 9% 46%)", marginBottom: 6 }}>FAIR MARKET RANGE · BROWARD CO.</p>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 700, color: "hsl(192 100% 37%)", filter: "blur(5px)", userSelect: "none" }}>$12,400 – $14,800</p>
                        <p className="absolute inset-0 flex items-center justify-center" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "hsl(220 9% 46%)", fontStyle: "italic", paddingTop: 16 }}>Unlock after step 3</p>
                      </div>
                    )}
                    {step.preview === "grade" && (
                      <div className="relative mt-3 md:mx-auto" style={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 13% 91%)", borderRadius: 8, padding: "12px 14px", maxWidth: 280 }}>
                        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 40, fontWeight: 800, color: "hsl(24 95% 53%)", filter: "blur(5px)", userSelect: "none", lineHeight: 1, textAlign: "center" }}>C</p>
                        <p className="absolute inset-0 flex items-center justify-center" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "hsl(220 9% 46%)", fontStyle: "italic" }}>Your Grade Waits Here</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center mt-10">
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "hsl(220 9% 30%)", fontStyle: "italic" }}>Most Contractors Budget on the Assumption You Won't Check.<br className="hidden md:block" /> You're About to Become The UnExpected.</p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "hsl(220 9% 64%)", marginTop: 8 }}>4,127 Florida Homeowners Did This Before Their Last Window Project.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FlowBEntry;
