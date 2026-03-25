import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "doc" | "scan" | "reveal" | "hook";

const SCAN_LINES: { text: string; danger?: boolean }[] = [
  { text: "Extracting line items..." },
  { text: "Checking county benchmarks..." },
  { text: "Scanning warranty language...", danger: true },
  { text: "Brand specification check...", danger: true },
  { text: "Calculating fair-market delta..." },
];

const SCANS = [
  {
    filename: "WindowQuote_SampleHome.pdf",
    meta: "Broward County · 14 Windows · $18,400",
    grade: "C",
    gradeColor: "text-wm-orange",
    gradeBg: "bg-wm-orange/10",
    gradeBorder: "border-wm-orange",
    delta: 4200,
    flag1Label: "⚑ CRITICAL",
    flag1Color: "text-destructive",
    flag1Bg: "bg-destructive/10",
    flag1Border: "border-l-destructive",
    flag1Title: "No Window Brand Specified",
    flag1Desc: "Your contractor can install any brand at any quality level.",
    flag2Label: "⚑ WARRANTY ISSUE",
    flag2Color: "text-wm-orange",
    flag2Bg: "bg-wm-orange/10",
    flag2Border: "border-l-wm-orange",
    flag2Title: "Labor Warranty Gap",
    hookCta: "Could you be overpaying $4,200+?",
  },
  {
    filename: "Estimate_Miami_Dade_2025.pdf",
    meta: "Miami-Dade County · 9 Windows · $12,150",
    grade: "B+",
    gradeColor: "text-emerald",
    gradeBg: "bg-emerald/10",
    gradeBorder: "border-emerald",
    delta: 450,
    flag1Label: "⚑ TERMS ISSUE",
    flag1Color: "text-wm-orange",
    flag1Bg: "bg-wm-orange/10",
    flag1Border: "border-l-wm-orange",
    flag1Title: "Vague Payment Schedule",
    flag1Desc: "Deposit exceeds standard 10%; lacks milestone definitions.",
    flag2Label: "⚑ MISSING DETAIL",
    flag2Color: "text-primary",
    flag2Bg: "bg-primary/10",
    flag2Border: "border-l-primary",
    flag2Title: 'Permit Fees "TBD"',
    hookCta: "How does your quote compare?",
  },
  {
    filename: "Proposal_PalmBeach_Glass.pdf",
    meta: "Palm Beach County · 22 Windows · $36,800",
    grade: "D",
    gradeColor: "text-destructive",
    gradeBg: "bg-destructive/10",
    gradeBorder: "border-destructive",
    delta: 8500,
    flag1Label: "⚑ COMPLIANCE RISK",
    flag1Color: "text-destructive",
    flag1Bg: "bg-destructive/10",
    flag1Border: "border-l-destructive",
    flag1Title: "Missing NOA Specifications",
    flag1Desc: "No Notice of Acceptance numbers listed for hurricane compliance.",
    flag2Label: "⚑ CONTRACT RISK",
    flag2Color: "text-wm-orange",
    flag2Bg: "bg-wm-orange/10",
    flag2Border: "border-l-wm-orange",
    flag2Title: "25% Cancellation Fee",
    hookCta: "Is yours worse than a D? Find out free.",
  },
];

const track = (event: string) => {
  console.log({ event, timestamp: new Date().toISOString() });
};

function useCounter(target: number, duration: number, active: boolean) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) { setVal(0); return; }
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setVal(Math.round(progress * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target, duration]);
  return val;
}

const MockDocument = ({ activeScan, phase, scanText, scanProgress, isDanger }: any) => {
  const isScanning = phase === "scan";

  return (
    <div className="relative w-full h-full rounded-xl border border-border bg-card p-6 flex flex-col overflow-hidden shadow-inner">
      <div className="absolute top-3 right-3 z-30">
        <span className="font-mono text-[9px] font-bold tracking-widest uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded-lg border border-border">
          Sample
        </span>
      </div>
      <div className="flex items-start justify-between border-b border-border pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-signal px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider">PDF</span>
            <p className="font-mono text-xs font-semibold text-foreground truncate max-w-[200px] sm:max-w-[300px]">{activeScan.filename}</p>
          </div>
          <p className="font-body text-[11px] text-muted-foreground">{activeScan.meta}</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-3">
        <div className="h-2.5 w-[85%] bg-muted rounded" />
        <div className="h-2.5 w-[92%] bg-muted rounded" />
        <div className="h-2.5 w-[78%] bg-muted rounded" />
        <div className="h-2.5 w-[88%] bg-muted rounded" />
        <div className="mt-4 border border-border rounded-lg overflow-hidden">
          <div className="h-8 bg-muted/30 border-b border-border" />
          <div className="h-8 border-b border-border" />
          <div className="h-8 bg-muted/30 border-b border-border" />
          <div className="h-8" />
        </div>
        <div className="mt-4 h-2.5 w-[40%] bg-muted rounded" />
        <div className="h-2.5 w-[60%] bg-muted rounded" />
      </div>

      {isScanning && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-primary/5 mix-blend-multiply" />
          <motion.div
            initial={{ top: "-10%" }}
            animate={{ top: "110%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" as const }}
            className={`absolute left-0 right-0 h-[2px] z-10 transition-colors duration-300 ${isDanger ? 'bg-destructive' : 'bg-primary'}`}
            style={{ boxShadow: isDanger ? 'var(--wm-glow-orange)' : 'var(--wm-glow-blue)' }}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-6 left-6 right-6 glass-card rounded-xl p-4 z-20 shadow-2xl border border-primary/30"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`font-mono text-[10px] font-bold tracking-widest uppercase animate-pulse ${isDanger ? 'text-destructive' : 'text-primary'} transition-colors duration-300`}>AI Engine Active</span>
              <span className="font-mono text-[10px] text-muted-foreground font-bold">{scanProgress}%</span>
            </div>
            <p className="font-mono text-[11px] text-foreground mb-3 h-4">{scanText}</p>
            <div className="h-1 w-full bg-muted rounded overflow-hidden">
              <div className={`h-full ${isDanger ? 'bg-destructive' : 'bg-primary'} ease-linear transition-all duration-300`} style={{ width: `${scanProgress}%`, transitionProperty: "width, background-color", transitionDuration: "1200ms, 300ms" }} />
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

interface InteractiveDemoScanProps {
  onScanClick?: () => void;
}

const InteractiveDemoScan = ({ onScanClick }: InteractiveDemoScanProps) => {
  const [phase, setPhase] = useState<Phase>("doc");
  const [currentScanIndex, setCurrentScanIndex] = useState(0);
  const [scanTextIndex, setScanTextIndex] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const activeScan = SCANS[currentScanIndex];

  useEffect(() => {
    track("wm_demo_scan_viewed");
    return () => { mountedRef.current = false; };
  }, []);

  const handleCtaClick = useCallback(() => {
    track("wm_demo_cta_clicked");
    if (onScanClick) {
      onScanClick();
    } else {
      document.getElementById("truth-gate")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [onScanClick]);

  useEffect(() => {
    const set = (p: Phase, ms: number) => {
      timerRef.current = setTimeout(() => {
        if (mountedRef.current) setPhase(p);
      }, ms);
    };

    if (phase === "doc") {
      setScanProgress(0);
      set("scan", 1500);
    } else if (phase === "scan") {
      requestAnimationFrame(() => setScanProgress(85));
      set("reveal", 3500);
    } else if (phase === "reveal") {
      track("wm_demo_reveal_seen");
      requestAnimationFrame(() => setScanProgress(100));
      set("hook", 3500);
    } else if (phase === "hook") {
      timerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setPhase("doc");
          setCurrentScanIndex((prev) => (prev + 1) % SCANS.length);
        }
      }, 6000);
    }

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase]);

  useEffect(() => {
    if (phase !== "scan") return;
    setScanTextIndex(0);
    const iv = setInterval(() => setScanTextIndex((p) => (p + 1) % SCAN_LINES.length), 1200);
    return () => clearInterval(iv);
  }, [phase]);

  const counter = useCounter(activeScan.delta, 1200, phase === "reveal" || phase === "hook");

  return (
    <section className="border-t border-b border-border py-14 px-4 md:py-20 md:px-8 wm-ambient">
      <div className="text-center mb-9">
        <p className="eyebrow mb-3">LIVE DEMO — WATCH A REAL SCAN</p>
        <h2 className="display-secondary text-foreground text-[28px] md:text-[34px] mb-1.5">See the AI at work.</h2>
        <p className="font-body text-[15px] text-muted-foreground">This runs automatically. No upload required.</p>
      </div>

      <div className="mx-auto max-w-[520px] glass-card-strong rounded-2xl p-6 md:p-8 min-h-[480px] flex flex-col relative" style={{ boxShadow: "var(--wm-shadow-focus)" }}>
        <AnimatePresence mode="wait">
          {(phase === "doc" || phase === "scan") && (
            <motion.div key="document-view" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.15, ease: "easeOut" as const }} className="w-full flex-1">
              <MockDocument activeScan={activeScan} phase={phase} scanText={SCAN_LINES[scanTextIndex]?.text} scanProgress={scanProgress} isDanger={!!SCAN_LINES[scanTextIndex]?.danger} />
            </motion.div>
          )}

          {(phase === "reveal" || phase === "hook") && (
            <motion.div key="results-view" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15, ease: "easeOut" as const }} className="w-full flex-1 flex flex-col">
              <div className="absolute top-4 right-4 z-30">
                <span className="font-mono text-[9px] font-bold tracking-widest uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded-lg border border-border">Sample</span>
              </div>

              <div className="flex items-center justify-between mb-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.15, ease: "easeInOut" as const }}
                  className={`flex h-16 w-16 items-center justify-center rounded-xl border-[2.5px] ${activeScan.gradeBorder} ${activeScan.gradeBg}`}>
                  <span className={`font-display text-[36px] font-black leading-none ${activeScan.gradeColor}`}>{activeScan.grade}</span>
                </motion.div>
                <div className="text-right">
                  <p className={`font-mono text-[26px] font-black ${activeScan.gradeColor}`}>+${counter.toLocaleString()}</p>
                  <p className="font-body text-[11px] text-muted-foreground mt-0.5">above fair market</p>
                </div>
              </div>

              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.4 }}
                className={`mt-2 w-full rounded-lg border-l-[3px] ${activeScan.flag1Border} ${activeScan.flag1Bg} p-4 text-left shadow-sm`}>
                <p className={`font-mono text-[10px] font-bold tracking-wider ${activeScan.flag1Color}`}>{activeScan.flag1Label}</p>
                <p className="font-body text-[14px] font-semibold text-foreground mt-1.5">{activeScan.flag1Title}</p>
                <p className="font-body text-[13px] text-muted-foreground mt-1">{activeScan.flag1Desc}</p>
              </motion.div>

              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.4 }}
                className={`mt-4 w-full rounded-lg border-l-[3px] ${activeScan.flag2Border} ${activeScan.flag2Bg} p-4 text-left shadow-sm cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => { track("wm_demo_unlock_clicked"); handleCtaClick(); }}
                role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") handleCtaClick(); }}>
                <p className={`font-mono text-[10px] font-bold tracking-wider ${activeScan.flag2Color}`}>{activeScan.flag2Label}</p>
                <p className="font-body text-[14px] font-semibold text-foreground mt-1.5">{activeScan.flag2Title}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  {Array.from({ length: 12 }).map((_, i) => (<div key={i} className="h-2 w-2 rounded-[1px] bg-muted-foreground/30" />))}
                  <span className="font-body text-[11px] text-primary ml-2 underline underline-offset-2">Upload yours to unlock →</span>
                </div>
              </motion.div>

              {phase === "reveal" && (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} onClick={handleCtaClick}
                  className="mt-4 w-full btn-depth-secondary rounded-xl px-5 py-2.5 font-body text-[13px] font-semibold cursor-pointer">
                  Scan My Quote — It's Free →
                </motion.button>
              )}

              <div className="flex-1" />

              <AnimatePresence>
                {phase === "hook" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
                    className="w-full pt-4 border-t border-border mt-4">
                    <p className="font-display text-[15px] italic text-foreground text-center mb-3">{activeScan.hookCta}</p>
                    <motion.button animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 2 }} onClick={handleCtaClick}
                      className="w-full btn-depth-orange rounded-xl px-7 py-3 font-body text-[14px] font-bold cursor-pointer border-none">
                      Upload My Real Quote — It's Free →
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default InteractiveDemoScan;
