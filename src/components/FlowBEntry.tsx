import { motion } from "framer-motion";
import "@fontsource/dm-mono/500.css";
import { useTickerStats } from "@/hooks/useTickerStats";

const outcomes = [
  { icon: "✓", iconColor: "hsl(var(--primary))", title: "Walk in knowing the fair price", sub: "Before they quote you a single number" },
  { icon: "📋", iconColor: "hsl(var(--wm-orange))", title: "Know the 5 questions to ask", sub: "The questions contractors hope you never think to ask" },
  { icon: "🔔", iconColor: "hsl(var(--primary))", title: "Get a reminder to scan your quote", sub: "We'll text you the moment you need to upload it" },
];

const timelineSteps = [
  { num: "1", numColor: "hsl(var(--primary))", badgeBg: "hsl(var(--primary) / 0.1)", badgeColor: "hsl(var(--primary))", badgeText: "HAPPENING NOW", title: "Build your fair-market baseline", copy: "3 quick questions. We generate your county-specific price benchmark.", preview: "price" },
  { num: "2", numColor: "hsl(var(--wm-orange))", badgeBg: "hsl(var(--wm-orange) / 0.1)", badgeColor: "hsl(var(--wm-orange))", badgeText: "WHEN YOU HAVE YOUR QUOTE", title: "Upload it for your full AI audit", copy: "The baseline becomes your benchmark. Your quote gets graded against it instantly.", preview: "grade" },
  { num: "3", numColor: "hsl(var(--primary))", badgeBg: "hsl(var(--primary) / 0.1)", badgeColor: "hsl(var(--primary))", badgeText: "BEFORE YOU SIGN", title: "Know exactly what to negotiate", copy: "Red flags. Dollar delta. Negotiation script. Everything you need to walk away with a fair deal.", preview: null },
];

interface FlowBEntryProps { onContinueToTool: () => void; onSwitchToFlowA: () => void; }

const FlowBEntry = ({ onContinueToTool, onSwitchToFlowA }: FlowBEntryProps) => {
  const { total: tickerTotal } = useTickerStats();
  return (
    <div id="flow-b">
      <section className="bg-background">
        <div className="mx-auto max-w-5xl px-4 pt-14 pb-16 md:px-8 md:pt-20 md:pb-24">
          <div className="inline-flex items-center gap-2 mb-5 badge-signal rounded-lg px-3 py-1">
            <span className="text-primary text-sm">★</span>
            <span className="eyebrow">YOU'RE EARLY — THAT'S THE BEST POSITION TO BE IN</span>
          </div>
          <h1 className="display-hero text-foreground mb-5" style={{ fontSize: "clamp(42px, 5.5vw, 58px)", lineHeight: 1.15 }}>
            You Don't Have a Quote Yet.<br /><span className="text-primary">Perfect. You Still Have All The Power.</span>
          </h1>
          <p className="wm-copy font-body mb-3" style={{ fontSize: "clamp(19px, 2vw, 21px)", lineHeight: 1.75, maxWidth: 640 }}>
            Contractors walk in knowing the market price.<br />Most homeowners don't. WindowMan flips that.
          </p>
          <p className="wm-copy font-body mb-9" style={{ fontSize: 16, lineHeight: 1.7, maxWidth: 580 }}>
            In 2 minutes, we'll generate your county-specific fair-market baseline. So when the contractor opens their briefcase, you already know the number they're hoping you don't.
          </p>
          <div className="flex flex-col md:flex-row gap-5 mb-10" style={{ maxWidth: 680 }}>
            {outcomes.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex items-center justify-center shrink-0 w-9 h-9 rounded-lg bg-card border border-border shadow-sm">
                  <span style={{ fontSize: 16, color: item.iconColor }}>{item.icon}</span>
                </div>
                <div>
                  <p className="font-body text-[15px] font-bold text-foreground">{item.title}</p>
                  <p className="font-body text-[13px] text-muted-foreground mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onContinueToTool}
            className="btn-depth-primary rounded-xl py-4 px-9 font-body text-[17px] font-bold">
            Build My Baseline — It's Free →
          </motion.button>
          <p className="font-body text-[13px] text-muted-foreground mt-3.5">
            Actually, I do have a quote —{" "}
            <button onClick={onSwitchToFlowA} className="text-primary underline bg-transparent border-none cursor-pointer font-body text-[13px] p-0">Scan it instead →</button>
          </p>
        </div>
      </section>

      <section className="bg-muted border-t border-border">
        <div className="mx-auto max-w-4xl px-4 py-14 md:px-8 md:py-20">
          <p className="text-center mb-4 eyebrow text-primary">WHAT FLOW B GIVES YOU</p>
          <h2 className="text-center display-secondary text-foreground mb-12" style={{ fontSize: "clamp(30px, 4vw, 38px)" }}>
            The Contractor Will Arrive Armed With Information.<br className="hidden md:block" /> Now you will too.
          </h2>
          <div className="relative">
            <div className="hidden md:block absolute" style={{ top: 20, left: "16.6%", right: "16.6%", height: 2 }} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 relative">
              <div className="md:hidden absolute" style={{ left: 19, top: 40, bottom: 40, width: 2 }} />
              {timelineSteps.map((step, i) => (
                <div key={i} className="relative flex md:flex-col items-start md:items-center gap-4 md:gap-0">
                  <div className="shrink-0 flex items-center justify-center relative z-10 w-10 h-10 rounded-lg bg-card border-2 shadow-md" style={{ borderColor: step.numColor, fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: step.numColor }}>{step.num}</div>
                  <div className="md:mt-4 md:text-center">
                    <span className="inline-block mb-2 rounded px-2.5 py-0.5" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, background: step.badgeBg, color: step.badgeColor }}>{step.badgeText}</span>
                    <p className="font-body text-[16px] font-bold text-foreground mb-1.5">{step.title}</p>
                    <p className="font-body text-[13px] text-muted-foreground leading-relaxed">{step.copy}</p>
                    {step.preview === "price" && (
                      <div className="relative mt-3 md:mx-auto bg-card border border-border rounded-lg p-3 shadow-md" style={{ maxWidth: 280 }}>
                        <p className="font-mono text-[10px] text-muted-foreground mb-1.5">FAIR MARKET RANGE · BROWARD CO.</p>
                        <p className="font-mono text-[18px] font-bold text-primary" style={{ filter: "blur(5px)", userSelect: "none" }}>$12,400 – $14,800</p>
                        <p className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-muted-foreground italic pt-4">Unlock after step 3</p>
                      </div>
                    )}
                    {step.preview === "grade" && (
                      <div className="relative mt-3 md:mx-auto bg-card border border-border rounded-lg p-3 shadow-md" style={{ maxWidth: 280 }}>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 40, fontWeight: 800, color: "hsl(var(--wm-orange))", filter: "blur(5px)", userSelect: "none", lineHeight: 1, textAlign: "center" }}>C</p>
                        <p className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-muted-foreground italic">Your Grade Waits Here</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center mt-10">
            <p className="font-body text-[16px] text-muted-foreground italic">Most contractors budget on the assumption you won't check.<br className="hidden md:block" /> You're about to become the unexpected.</p>
            <p className="font-body text-[14px] text-muted-foreground mt-2">{tickerTotal.toLocaleString()} Florida homeowners did this before their last window project.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FlowBEntry;
