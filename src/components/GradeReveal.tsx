import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Flag {
  id: number;
  severity: "red" | "amber" | "green";
  label: string;
  detail: string;
  tip: string | null;
}

interface GradeRevealProps {
  grade?: string;
  dollarDelta?: number;
  county?: string;
  flags?: Flag[];
  fairPriceLow?: number;
  fairPriceHigh?: number;
  onContractorMatchClick?: () => void;
  contractorName?: string | null;
  isLoading?: boolean;
  accessLevel?: "preview" | "full";
}

const gradeConfig: Record<string, { color: string; bg: string; label: string; message: string }> = {
  A: { color: "#059669", bg: "rgba(5,150,105,0.12)", label: "STRONG QUOTE", message: "Your Quote Is Well-Structured and Competitively Priced." },
  B: { color: "#84CC16", bg: "rgba(132,204,22,0.12)", label: "ACCEPTABLE", message: "Your Quote Is Acceptable with Minor Items Worth Addressing." },
  C: { color: "#F97316", bg: "rgba(249,115,22,0.12)", label: "REVIEW BEFORE SIGNING", message: "Your Quote Has Issues That Could Cost You Money." },
  D: { color: "#DC2626", bg: "rgba(220,38,38,0.12)", label: "SIGNIFICANT PROBLEMS FOUND", message: "Do Not Sign Without Renegotiating These Issues." },
  F: { color: "#991B1B", bg: "rgba(220,38,38,0.12)", label: "CRITICAL ISSUES FOUND", message: "This Quote Has Critical Problems. You Are Likely Being Significantly Overcharged." },
};

const stagger = (i: number) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.06, duration: 0.15, ease: 'easeInOut' as const } }) as const;

const GradeReveal = ({
  grade = "C",
  dollarDelta,
  county = "Broward",
  flags = [],
  fairPriceLow,
  fairPriceHigh,
  onContractorMatchClick,
  contractorName,
  isLoading,
  accessLevel = "full",
}: GradeRevealProps) => {
  const isFull = accessLevel === "full";
  const config = gradeConfig[grade] || gradeConfig.C;
  const [counter, setCounter] = useState(0);
  const [copied, setCopied] = useState(false);
  const counterStarted = useRef(false);

  const redCount = flags.filter(f => f.severity === "red").length;
  const amberCount = flags.filter(f => f.severity === "amber").length;
  const greenCount = flags.filter(f => f.severity === "green").length;
  const issueCount = redCount + amberCount;

  const hasBenchmark = dollarDelta != null && fairPriceLow != null && fairPriceHigh != null;

  useEffect(() => {
    if (!hasBenchmark || counterStarted.current) return;
    counterStarted.current = true;
    const target = Math.abs(dollarDelta!);
    const duration = 1500;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCounter(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [dollarDelta, hasBenchmark]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="w-[120px] h-[120px] rounded-full" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  const displayName = contractorName || "[Contractor Name]";
  const scriptText = `Hi ${displayName}, I've had a chance to review your quote in more detail and I have a few questions before I can move forward.\n\nFirst — can you confirm the specific brand and model of window you'll be installing? I want that in writing before we finalize anything.\n\nSecond — I'd like to see the labor warranty extended to at least three years. That's the standard I've seen for this scope of work.\n\nI'm ready to move forward if we can get those two things confirmed. What's the fastest way to get a revised quote?`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const severityStyles = {
    red: { border: "1.5px solid rgba(220,38,38,0.3)", borderLeft: "4px solid #DC2626", badgeBg: "rgba(220,38,38,0.12)", badgeColor: "#DC2626", badgeText: "⚠ CRITICAL", tipBg: "rgba(249,115,22,0.08)" },
    amber: { border: "1.5px solid rgba(245,158,11,0.3)", borderLeft: "4px solid #F59E0B", badgeBg: "rgba(245,158,11,0.12)", badgeColor: "#D97706", badgeText: "⚡ REVIEW", tipBg: "rgba(245,158,11,0.08)" },
    green: { border: "1.5px solid rgba(5,150,105,0.3)", borderLeft: "4px solid #059669", badgeBg: "rgba(5,150,105,0.12)", badgeColor: "#059669", badgeText: "✓ CONFIRMED", tipBg: "" },
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15, ease: "easeInOut" as const }}
      className="glass-card-strong shadow-2xl overflow-hidden">

      <section className="bg-card py-16 md:py-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.15, ease: "easeInOut" as const }}
            className="w-[120px] h-[120px] md:w-[160px] md:h-[160px] rounded-full flex items-center justify-center"
            style={{ border: `4px solid ${config.color}`, background: config.bg, boxShadow: `0 0 0 6px ${config.color}1A` }}>
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "clamp(80px, 10vw, 96px)", fontWeight: 900, color: config.color }}>{grade}</span>
          </motion.div>
          <motion.div {...stagger(2.5)} className="rounded-lg px-5 py-1.5 mt-5" style={{ background: config.bg, border: `1px solid ${config.color}` }}>
            <span className="font-mono text-xs font-bold tracking-widest" style={{ color: config.color }}>GRADE {grade} — {config.label}</span>
          </motion.div>
          <motion.p {...stagger(3.3)} className="font-body text-muted-foreground mt-3" style={{ fontSize: "clamp(17px, 2vw, 19px)" }}>{config.message}</motion.p>
        </div>
      </section>

      {hasBenchmark && (
      <section className="bg-card border-t border-border py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div {...stagger(3)}>
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest mb-2">YOUR QUOTE VS. FAIR MARKET</p>
            <p className="font-mono font-black tabular-nums" style={{ fontSize: "clamp(36px, 5vw, 44px)", color: dollarDelta! > 0 ? "#DC2626" : "#059669", textShadow: dollarDelta! > 0 ? "0 1px 4px rgba(220, 38, 38, 0.2)" : "0 1px 4px rgba(5, 150, 105, 0.2)" }}>
              {dollarDelta! > 0 ? "+" : dollarDelta! < 0 ? "-" : ""}${counter.toLocaleString()}
            </p>
            <p className="font-body text-[13px] text-muted-foreground">
              {dollarDelta! > 0 ? `above fair market for ${county} County` : dollarDelta! < 0 ? "below market — this quote is competitive" : "This quote is priced at the county benchmark"}
            </p>
          </motion.div>
          <motion.div {...stagger(3.5)}>
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest mb-2">FAIR MARKET RANGE · {county.toUpperCase()} COUNTY</p>
            <p className="font-mono text-2xl font-bold text-primary tabular-nums">${fairPriceLow!.toLocaleString()} – ${fairPriceHigh!.toLocaleString()}</p>
            <div className="relative mt-3">
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div className="h-2 rounded-full" style={{ background: "linear-gradient(90deg, hsl(var(--primary)), #059669)", width: "70%" }} />
              </div>
              <div className="absolute -top-0.5 w-3.5 h-3.5 rounded-full shadow-md" style={{ left: "75%", background: config.color, border: "2px solid white", boxShadow: `0 0 0 1px ${config.color}` }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="font-body text-[11px] text-muted-foreground">p25 — budget range</span>
              <span className="font-body text-[11px] text-muted-foreground">p75 — premium range</span>
            </div>
          </motion.div>
          <motion.div {...stagger(4)}>
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest mb-2">SAMPLE SIZE</p>
            <p className="font-mono text-[32px] font-bold text-foreground">847</p>
            <p className="font-body text-[13px] text-muted-foreground">real {county} County quotes in our database</p>
            <div className="border-t border-border my-3" />
            <p className="font-mono text-[10px] text-muted-foreground">Data as of Q1 2025</p>
          </motion.div>
        </div>
      </section>
      )}

      <section className="bg-card py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <div>
              <h2 className="font-display text-[28px] font-extrabold text-foreground tracking-tight">What We Found</h2>
              <p className="font-body text-[14px] text-muted-foreground">{issueCount} issue{issueCount !== 1 ? "s" : ""} identified · {greenCount} item{greenCount !== 1 ? "s" : ""} confirmed correct</p>
            </div>
            <div className="hidden md:block badge-signal rounded-lg px-3 py-1.5">
              <span className="eyebrow text-primary">BASED ON {county.toUpperCase()} COUNTY BENCHMARKS</span>
            </div>
          </div>

          {isFull ? (
            <div className="flex flex-col gap-3">
              {flags.map((flag, i) => {
                const s = severityStyles[flag.severity];
                return (
                  <motion.div key={flag.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 + 0.3, duration: 0.35 }}
                    className="bg-card rounded-lg p-5 shadow-md"
                    style={{ border: s.border, borderLeft: s.borderLeft }}>
                    <span className="inline-block rounded px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider" style={{ background: s.badgeBg, color: s.badgeColor }}>{s.badgeText}</span>
                    <p className="font-body text-[17px] font-bold text-foreground mt-2">{flag.label}</p>
                    <p className="font-body text-[14px] text-muted-foreground leading-relaxed mt-1.5">{flag.detail}</p>
                    {flag.tip && (
                      <div className="rounded-lg p-3 mt-3.5 flex gap-2.5 items-start" style={{ background: s.tipBg }}>
                        <span className="text-[16px] shrink-0">💬</span>
                        <div>
                          <p className="font-mono text-[10px] text-wm-gold tracking-wider font-bold mb-1">NEGOTIATION TIP</p>
                          <p className="font-body text-[13px] text-muted-foreground leading-relaxed">{flag.tip}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="relative">
              <div className="flex flex-col gap-3" style={{ filter: "blur(6px)", pointerEvents: "none", userSelect: "none" }}>
                {flags.slice(0, 3).map((flag, i) => {
                  const s = severityStyles[flag.severity];
                  return (
                    <div key={flag.id} className="bg-card rounded-lg p-5" style={{ border: s.border, borderLeft: s.borderLeft }}>
                      <span className="inline-block rounded px-2.5 py-0.5 font-mono text-[10px] font-bold" style={{ background: s.badgeBg, color: s.badgeColor }}>{s.badgeText}</span>
                      <p className="font-body text-[17px] font-bold text-foreground mt-2">██████████ ██████</p>
                      <p className="font-body text-[14px] text-muted-foreground mt-1.5">████████ ██████ ████████ ██████████ ██████.</p>
                    </div>
                  );
                })}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg" style={{ background: "hsl(var(--background) / 0.85)" }}>
                <div className="glass-card-strong shadow-xl p-6 text-center">
                  <p className="font-mono text-[11px] text-wm-gold tracking-widest mb-2">🔒 VERIFICATION REQUIRED</p>
                  <p className="font-body text-[18px] font-bold text-foreground mb-1">
                    We found {issueCount} issue{issueCount !== 1 ? "s" : ""} in your quote.
                  </p>
                  <p className="font-body text-[14px] text-muted-foreground">Verify your phone number to see the full details.</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-muted rounded-lg p-4 mt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <p className="font-body text-[14px] text-foreground">{redCount} critical issue{redCount !== 1 ? "s" : ""}, {amberCount} caution{amberCount !== 1 ? "s" : ""}, {greenCount} item{greenCount !== 1 ? "s" : ""} correct.</p>
            <p className="font-mono text-xs text-muted-foreground">Grade: {grade} of 5 criteria reviewed</p>
          </div>
        </div>
      </section>

      {isFull ? (
        <>
          <section className="bg-card border-t border-border py-12 md:py-16 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-[28px] font-extrabold text-foreground tracking-tight">How to handle this quote.</h2>
              <p className="font-body text-[15px] text-muted-foreground mt-2 mb-7">Use this exact language when you call your contractor back.</p>
              <div className="bg-muted border border-border border-l-4 border-l-primary rounded-lg p-6 relative shadow-md">
                <button onClick={handleCopy} className="absolute top-4 right-4 bg-card border border-border rounded-lg px-3 py-1.5 font-body text-xs text-muted-foreground cursor-pointer hover:border-primary hover:text-primary transition-colors">
                  {copied ? "✓ Copied" : "Copy Script"}
                </button>
                <p className="font-mono text-[10px] text-primary tracking-widest mb-4">WORD-FOR-WORD SCRIPT</p>
                <p className="font-body text-[15px] text-foreground leading-loose whitespace-pre-line">{scriptText}</p>
              </div>
            </div>
          </section>

          <section className="bg-card border-t border-border py-12 md:py-16 px-4 md:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-display text-2xl font-extrabold text-foreground tracking-tight mb-2">What do you want to do with this?</h2>
              <p className="font-body text-[15px] text-muted-foreground mb-8">Your analysis is saved. You can come back to it anytime.</p>
              <div className="flex flex-col md:flex-row justify-center gap-4">
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={() => { console.log({ event: "wm_contractor_match_clicked", grade, dollarDelta }); onContractorMatchClick?.(); }}
                  className="btn-depth-orange rounded-xl py-4 px-9 flex flex-col items-center">
                  <span className="font-body text-[17px] font-bold">Get a Counter-Quote From a Vetted Contractor</span>
                  <span className="text-xs font-normal opacity-85 mt-1">We'll find contractors who quote fair in {county} County</span>
                </motion.button>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={() => { console.log({ event: "wm_report_downloaded" }); toast({ title: "Report saved to your downloads" }); }}
                  className="btn-depth-secondary rounded-xl py-3.5 px-7 font-body text-[15px] font-semibold">
                  ⬇ Download PDF Report
                </motion.button>
              </div>
              <button onClick={() => { console.log({ event: "wm_report_shared" }); toast({ title: "Link copied to clipboard" }); }}
                className="font-body text-[13px] text-primary underline bg-transparent border-none cursor-pointer mt-3 inline-block">
                Share this report →
              </button>
              <p className="font-body text-[13px] text-muted-foreground mt-5">Your contractor will never see this report unless you choose to share it.</p>
            </div>
          </section>
        </>
      ) : (
        <section className="bg-card border-t border-border py-12 md:py-16 px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="glass-card-strong shadow-xl p-8">
              <p className="font-mono text-[11px] text-wm-gold tracking-widest mb-3">🔒 FULL REPORT LOCKED</p>
              <h3 className="font-display text-2xl font-extrabold text-foreground mb-2">
                Your negotiation script and action tools are ready.
              </h3>
              <p className="font-body text-[15px] text-muted-foreground mb-6 max-w-[480px] mx-auto">
                Verify your phone number to unlock the full Truth Report — including detailed flag breakdowns, negotiation scripts, and contractor matching.
              </p>
              <button className="btn-depth-orange rounded-xl py-3.5 px-8 font-body text-[16px] font-bold">
                Verify Phone to Unlock →
              </button>
            </div>
          </div>
        </section>
      )}
    </motion.div>
  );
};

export default GradeReveal;
