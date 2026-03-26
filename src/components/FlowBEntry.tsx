import { motion } from "framer-motion";
import "@fontsource/dm-mono/500.css";
import { useTickerStats } from "@/hooks/useTickerStats";

const outcomes = [
  { icon: "✓", title: "Walk in knowing the fair price", sub: "Before they quote you a single number" },
  { icon: "📋", title: "Know the 5 questions to ask", sub: "The questions contractors hope you never think to ask" },
  { icon: "🔔", title: "Get a reminder to scan your quote", sub: "We'll text you the moment you need to upload it" },
];

const timelineSteps = [
  { num: "1", badgeText: "HAPPENING NOW", title: "Build your fair-market baseline", copy: "3 quick questions. We generate your county-specific price benchmark.", preview: "price" },
  { num: "2", badgeText: "WHEN YOU HAVE YOUR QUOTE", title: "Upload it for your full AI audit", copy: "The baseline becomes your benchmark. Your quote gets graded against it instantly.", preview: "grade" },
  { num: "3", badgeText: "BEFORE YOU SIGN", title: "Know exactly what to negotiate", copy: "Red flags. Dollar delta. Negotiation script. Everything you need to walk away with a fair deal.", preview: null },
];

interface FlowBEntryProps { onContinueToTool: () => void; onSwitchToFlowA: () => void; }

const FlowBEntry = ({ onContinueToTool, onSwitchToFlowA }: FlowBEntryProps) => {
  const { total: tickerTotal } = useTickerStats();
  return (
    <div id="flow-b">
      <section className="bg-background">
        <div className="mx-auto max-w-5xl px-4 pt-14 pb-16 md:px-8 md:pt-20 md:pb-24">
          <div className="inline-flex items-center gap-2 mb-5 border border-primary bg-primary/5 px-3.5 py-1.5">
            <span className="text-primary text-sm">★</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }} className="text-primary">YOU'RE EARLY — THAT'S THE BEST POSITION TO BE IN</span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(42px, 5.5vw, 58px)", fontWeight: 800, letterSpacing: "0.02em", lineHeight: 1.15, marginBottom: 20, textTransform: "uppercase" }} className="text-foreground">
            You Don't Have a Quote Yet.<br /><span className="text-primary">Perfect. You Still Have All The Power.</span>
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(19px, 2vw, 21px)", lineHeight: 1.75, marginBottom: 12, maxWidth: 640 }} className="text-foreground">
            Contractors walk in knowing the market price.<br />Most homeowners don't. WindowMan flips that.
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, lineHeight: 1.7, marginBottom: 36, maxWidth: 580 }} className="text-muted-foreground">
            In 2 minutes, we'll generate your county-specific fair-market baseline. So when the contractor opens their briefcase, you already know the number they're hoping you don't.
          </p>
          <div className="flex flex-col md:flex-row gap-5 mb-10" style={{ maxWidth: 680 }}>
            {outcomes.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex items-center justify-center shrink-0 w-9 h-9 card-raised">
                  <span className="text-primary text-base">{item.icon}</span>
                </div>
                <div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700 }} className="text-foreground">{item.title}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginTop: 2 }} className="text-muted-foreground">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onContinueToTool}
            className="btn-depth-primary" style={{ padding: "16px 36px", fontSize: 17 }}>
            Build My Baseline — It's Free →
          </motion.button>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginTop: 14 }} className="text-muted-foreground">
            Actually, I do have a quote —{" "}
            <button onClick={onSwitchToFlowA} className="text-primary underline cursor-pointer bg-transparent border-none p-0" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Scan it instead →</button>
          </p>
        </div>
      </section>

      <section className="bg-card border-t border-border">
        <div className="mx-auto max-w-4xl px-4 py-14 md:px-8 md:py-20">
          <p className="text-center mb-4 text-primary" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.1em" }}>WHAT FLOW B GIVES YOU</p>
          <h2 className="text-center text-foreground" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(30px, 4vw, 38px)", fontWeight: 800, letterSpacing: "0.02em", marginBottom: 48, textTransform: "uppercase" }}>
            The Contractor Will Arrive Armed With Information.<br className="hidden md:block" /> Now you will too.
          </h2>
          <div className="relative">
            <div className="hidden md:block absolute border-b border-border" style={{ top: 20, left: "16.6%", right: "16.6%", height: 2 }} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 relative">
              <div className="md:hidden absolute border-l border-border" style={{ left: 19, top: 40, bottom: 40 }} />
              {timelineSteps.map((step, i) => (
                <div key={i} className="relative flex md:flex-col items-start md:items-center gap-4 md:gap-0">
                  <div className="shrink-0 flex items-center justify-center relative z-10 w-10 h-10 card-raised border-2 border-primary text-primary" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700 }}>{step.num}</div>
                  <div className="md:mt-4 md:text-center">
                    <span className="inline-block mb-2 text-primary bg-primary/5 border border-primary/20" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, padding: "3px 10px" }}>{step.badgeText}</span>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 6 }} className="text-foreground">{step.title}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.6 }} className="text-muted-foreground">{step.copy}</p>
                    {step.preview === "price" && (
                      <div className="relative mt-3 md:mx-auto bg-muted border border-border p-3" style={{ maxWidth: 280 }}>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, marginBottom: 6 }} className="text-muted-foreground">FAIR MARKET RANGE · BROWARD CO.</p>
                        <p className="text-primary" style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 700, filter: "blur(5px)", userSelect: "none" }}>$12,400 – $14,800</p>
                        <p className="absolute inset-0 flex items-center justify-center text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontStyle: "italic", paddingTop: 16 }}>Unlock after step 3</p>
                      </div>
                    )}
                    {step.preview === "grade" && (
                      <div className="relative mt-3 md:mx-auto bg-muted border border-border p-3" style={{ maxWidth: 280 }}>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 40, fontWeight: 800, color: "hsl(var(--color-vivid-orange))", filter: "blur(5px)", userSelect: "none", lineHeight: 1, textAlign: "center" }}>C</p>
                        <p className="absolute inset-0 flex items-center justify-center text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontStyle: "italic" }}>Your Grade Waits Here</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center mt-10">
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontStyle: "italic" }} className="text-foreground">Most contractors budget on the assumption you won't check.<br className="hidden md:block" /> You're about to become the unexpected.</p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, marginTop: 8 }} className="text-muted-foreground">{tickerTotal.toLocaleString()} Florida homeowners did this before their last window project.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FlowBEntry;
