import { motion } from "framer-motion";
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
            <span className="wm-eyebrow text-primary">YOU'RE EARLY — THAT'S THE BEST POSITION TO BE IN</span>
          </div>
          <h1 className="font-heading text-foreground  leading-[1.15] mb-5" style={{ fontSize: "clamp(42px, 5.5vw, 58px)", fontWeight: 700, letterSpacing: "normal" }}>
            You Don't Have a Quote Yet.<br /><span className="text-primary">Perfect. You Still Have All The Power.</span>
          </h1>
          <p className="font-body text-foreground leading-[1.75] mb-3" style={{ fontSize: "clamp(19px, 2vw, 21px)", maxWidth: 640 }}>
            Contractors walk in knowing the market price.<br />Most homeowners don't. WindowMan flips that.
          </p>
          <p className="wm-body mb-8" style={{ maxWidth: 580 }}>
            In 2 minutes, we'll generate your county-specific fair-market baseline. So when the contractor opens their briefcase, you already know the number they're hoping you don't.
          </p>
          <div className="flex flex-col md:flex-row gap-5 mb-10" style={{ maxWidth: 680 }}>
            {outcomes.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex items-center justify-center shrink-0 w-9 h-9 card-raised">
                  <span className="text-primary text-base">{item.icon}</span>
                </div>
                <div>
                  <p className="font-body text-[15px] font-bold text-foreground">{item.title}</p>
                  <p className="font-body text-[13px] text-muted-foreground mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={onContinueToTool}
            className="btn-depth-primary" style={{ padding: "16px 32px" }}>
            Build My Baseline — It's Free →
          </button>
          <p className="font-body text-[13px] text-muted-foreground mt-8">
            Actually, I do have a quote —{" "}
            <button onClick={onSwitchToFlowA} className="text-primary underline cursor-pointer bg-transparent border-none p-0 font-body text-[13px]">Scan it instead →</button>
          </p>
        </div>
      </section>

      <section className="bg-card border-t border-border section-recessed">
        <div className="mx-auto max-w-5xl px-4 py-20 md:px-8 md:py-28">
          <p className="text-center wm-eyebrow text-primary mb-4">WHAT FLOW B GIVES YOU</p>
          <h2 className="text-center wm-title-section mb-12" style={{ fontSize: "clamp(30px, 4vw, 38px)" }}>
            The Contractor Will Arrive Armed With Information.<br className="hidden md:block" /> Now you will too.
          </h2>
          <div className="relative">
            <div className="hidden md:block absolute border-b border-border" style={{ top: 20, left: "16.6%", right: "16.6%", height: 2 }} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 relative">
              <div className="md:hidden absolute border-l border-border" style={{ left: 19, top: 40, bottom: 40 }} />
              {timelineSteps.map((step, i) => (
                <div key={i} className="relative flex md:flex-col items-start md:items-center gap-4 md:gap-0">
                  <div className="shrink-0 flex items-center justify-center relative z-10 w-10 h-10 card-raised border-2 border-primary text-primary font-body text-base font-bold">{step.num}</div>
                  <div className="md:mt-4 md:text-center">
                    <span className="inline-block mb-2 wm-eyebrow text-primary bg-primary/5 border border-primary/20" style={{ padding: "3px 10px", fontSize: 10 }}>{step.badgeText}</span>
                    <p className="font-body text-base font-bold text-foreground mb-1.5">{step.title}</p>
                    <p className="font-body text-[13px] text-muted-foreground leading-[1.6]">{step.copy}</p>
                    {step.preview === "price" && (
                      <div className="relative mt-3 md:mx-auto card-raised p-3" style={{ maxWidth: 280 }}>
                        <p className="wm-eyebrow text-muted-foreground mb-1.5" style={{ fontSize: 10 }}>FAIR MARKET RANGE · BROWARD CO.</p>
                        <p className="text-primary font-mono text-lg font-bold" style={{ filter: "blur(5px)", userSelect: "none" }}>$12,400 – $14,800</p>
                        <p className="absolute inset-0 flex items-center justify-center wm-eyebrow text-muted-foreground italic" style={{ fontSize: 10, paddingTop: 16 }}>Unlock after step 3</p>
                      </div>
                    )}
                    {step.preview === "grade" && (
                      <div className="relative mt-3 md:mx-auto card-raised p-3" style={{ maxWidth: 280 }}>
                        <p className="font-heading text-[40px] font-bold text-center leading-none text-vivid-orange" style={{ filter: "blur(5px)", userSelect: "none" }}>C</p>
                        <p className="absolute inset-0 flex items-center justify-center wm-eyebrow text-muted-foreground italic" style={{ fontSize: 10 }}>Your Grade Waits Here</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center mt-10">
            <p className="font-body text-base italic text-foreground">Most contractors budget on the assumption you won't check.<br className="hidden md:block" /> You're about to become the unexpected.</p>
            <p className="font-body text-sm text-muted-foreground mt-2">{tickerTotal.toLocaleString()} Florida homeowners did this before their last window project.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FlowBEntry;
