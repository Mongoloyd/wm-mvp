import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "doc" | "scan" | "reveal" | "hook";

const SCAN_LINES = [
  "Extracting line items...",
  "Checking county benchmarks...",
  "Scanning warranty language...",
  "Brand specification check...",
  "Calculating fair-market delta...",
];

const SCANS = [
  {
    filename: "WindowQuote_SampleHome.pdf",
    meta: "Broward County · 14 Windows · $18,400",
    grade: "C",
    gradeColor: "text-warning",
    gradeBg: "bg-gold-light",
    gradeBorder: "border-warning",
    delta: 4200,
    flag1Label: "⚑ CRITICAL",
    flag1Color: "text-danger",
    flag1Bg: "bg-danger-light",
    flag1Border: "border-l-danger",
    flag1Title: "No Window Brand Specified",
    flag1Desc: "Your contractor can install any brand at any quality level.",
    flag2Label: "⚑ WARRANTY ISSUE",
    flag2Color: "text-warning",
    flag2Bg: "bg-gold-light",
    flag2Border: "border-l-gold",
    flag2Title: "Labor Warranty Gap",
    hookCta: "Could you be overpaying $4,200+?",
  },
  {
    filename: "Estimate_Miami_Dade_2025.pdf",
    meta: "Miami-Dade County · 9 Windows · $12,150",
    grade: "B+",
    gradeColor: "text-emerald-text",
    gradeBg: "bg-emerald-light",
    gradeBorder: "border-emerald",
    delta: 450,
    flag1Label: "⚑ TERMS ISSUE",
    flag1Color: "text-warning",
    flag1Bg: "bg-gold-light",
    flag1Border: "border-l-gold",
    flag1Title: "Vague Payment Schedule",
    flag1Desc: "Deposit exceeds standard 10%; lacks milestone definitions.",
    flag2Label: "⚑ MISSING DETAIL",
    flag2Color: "text-cyan-text",
    flag2Bg: "bg-cyan-light",
    flag2Border: "border-l-cyan",
    flag2Title: 'Permit Fees "TBD"',
    hookCta: "How does your quote compare?",
  },
  {
    filename: "Proposal_PalmBeach_Glass.pdf",
    meta: "Palm Beach County · 22 Windows · $36,800",
    grade: "D",
    gradeColor: "text-danger",
    gradeBg: "bg-danger-light",
    gradeBorder: "border-danger",
    delta: 8500,
    flag1Label: "⚑ COMPLIANCE RISK",
    flag1Color: "text-danger",
    flag1Bg: "bg-danger-light",
    flag1Border: "border-l-danger",
    flag1Title: "Missing NOA Specifications",
    flag1Desc: "No Notice of Acceptance numbers listed for hurricane compliance.",
    flag2Label: "⚑ CONTRACT RISK",
    flag2Color: "text-warning",
    flag2Bg: "bg-gold-light",
    flag2Border: "border-l-gold",
    flag2Title: "25% Cancellation Fee",
    hookCta: "Is yours worse than a D? Find out free.",
  },
];

const track = (event: string) => {
  console.log({ event, timestamp: new Date().toISOString() });
};

/* ── Animated counter hook ─────────────────────────────────── */
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

/* ── Mock Document ─────────────────────────────────────────── */
const MockDocument = ({ activeScan, phase, scanText, scanProgress }: any) => {
  const isScanning = phase === "scan";

  return (
    <div className="relative w-full h-full rounded-xl border border-border bg-background p-6 flex flex-col overflow-hidden shadow-inner">
      {/* Sample badge */}
      <div className="absolute top-3 right-3 z-30">
        <span className="font-mono text-[9px] font-bold tracking-widest uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border">
          Sample
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between border-b border-border pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-cyan-light text-cyan-text px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider">
              PDF
            </span>
            <p className="font-mono text-xs font-semibold text-foreground truncate max-w-[200px] sm:max-w-[300px]">
              {activeScan.filename}
            </p>
          </div>
          <p className="font-body text-[11px] text-muted-foreground">{activeScan.meta}</p>
        </div>
      </div>

      {/* Contract Skeletons */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="h-2.5 w-[85%] bg-muted rounded-full" />
        <div className="h-2.5 w-[92%] bg-muted rounded-full" />
        <div className="h-2.5 w-[78%] bg-muted rounded-full" />
        <div className="h-2.5 w-[88%] bg-muted rounded-full" />
        <div className="mt-4 border border-border rounded-md overflow-hidden">
          <div className="h-8 bg-muted/30 border-b border-border" />
          <div className="h-8 border-b border-border" />
          <div className="h-8 bg-muted/30 border-b border-border" />
          <div className="h-8" />
        </div>
        <div className="mt-4 h-2.5 w-[40%] bg-muted rounded-full" />
        <div className="h-2.5 w-[60%] bg-muted rounded-full" />
      </div>

      {/* Scanning Overlays */}
      {isScanning && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-cyan/5 mix-blend-multiply"
          />
          <motion.div
            initial={{ top: "-10%" }}
            animate={{ top: "110%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-[2px] bg-cyan shadow-[0_0_20px_4px_rgba(0,153,187,0.4)] z-10"
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-6 left-6 right-6 bg-card/95 backdrop-blur-md border border-cyan/30 shadow-2xl rounded-lg p-4 z-20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] text-cyan-text font-bold tracking-widest uppercase animate-pulse">
                AI Engine Active
              </span>
              <span className="font-mono text-[10px] text-muted-foreground font-bold">{scanProgress}%</span>
            </div>
            <p className="font-mono text-[11px] text-foreground mb-3 h-4">{scanText}</p>
            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan ease-linear"
                style={{ width: `${scanProgress}%`, transitionProperty: "width", transitionDuration: "1200ms" }}
              />
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

/* ── Main component ────────────────────────────────────────── */
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

  // Phase machine — always auto-advances
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

  // Scan text cycling
  useEffect(() => {
    if (phase !== "scan") return;
    setScanTextIndex(0);
    const iv = setInterval(() => setScanTextIndex((p) => (p + 1) % SCAN_LINES.length), 1200);
    return () => clearInterval(iv);
  }, [phase]);

  const counter = useCounter(activeScan.delta, 1200, phase === "reveal" || phase === "hook");

  return (
    <section className="border-t border-b border-border bg-background py-14 px-4 md:py-20 md:px-8">
      <div className="text-center mb-9">
        <p className="font-mono text-[13px] text-cyan-text tracking-[0.1em] mb-3">LIVE DEMO — WATCH A REAL SCAN</p>
        <h2 className="font-display text-[28px] md:text-[34px] font-bold text-navy mb-1.5">See the AI at work.</h2>
        <p className="font-body text-[15px] text-foreground">This runs automatically. No upload required.</p>
      </div>

      <div
        className="mx-auto max-w-[520px] rounded-2xl border-[1.5px] border-border bg-card p-6 md:p-8 shadow-[0_4px_24px_rgba(0,242,255,0.12),0_16px_48px_rgba(0,242,255,0.06),0_2px_8px_rgba(0,0,0,0.08)] min-h-[480px] flex flex-col relative"
      >
        <AnimatePresence mode="wait">
          {/* ── PHASES 1 & 2: Document & Scan ───────── */}
          {(phase === "doc" || phase === "scan") && (
            <motion.div
              key="document-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4 }}
              className="w-full flex-1"
            >
              <MockDocument
                activeScan={activeScan}
                phase={phase}
                scanText={SCAN_LINES[scanTextIndex]}
                scanProgress={scanProgress}
              />
            </motion.div>
          )}

          {/* ── PHASES 3 & 4: Results Reveal & Hook ───────── */}
          {(phase === "reveal" || phase === "hook") && (
            <motion.div
              key="results-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full flex-1 flex flex-col"
            >
              {/* Sample badge */}
              <div className="absolute top-4 right-4 z-30">
                <span className="font-mono text-[9px] font-bold tracking-widest uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border">
                  Sample
                </span>
              </div>

              <div className="flex items-center justify-between mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.1 }}
                  className={`flex h-16 w-16 items-center justify-center rounded-full border-[2.5px] ${activeScan.gradeBorder} ${activeScan.gradeBg}`}
                >
                  <span className={`font-display text-[36px] font-black leading-none ${activeScan.gradeColor}`}>
                    {activeScan.grade}
                  </span>
                </motion.div>
                <div className="text-right">
                  <p className={`font-mono text-[26px] font-black ${activeScan.gradeColor}`}>
                    +${counter.toLocaleString()}
                  </p>
                  <p className="font-body text-[11px] text-muted-foreground mt-0.5">above fair market</p>
                </div>
              </div>

              {/* Flag 1 */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className={`mt-2 w-full rounded-md border-l-[3px] ${activeScan.flag1Border} ${activeScan.flag1Bg} p-4 text-left shadow-sm`}
              >
                <p className={`font-mono text-[10px] font-bold tracking-wider ${activeScan.flag1Color}`}>
                  {activeScan.flag1Label}
                </p>
                <p className="font-body text-[14px] font-semibold text-navy mt-1.5">{activeScan.flag1Title}</p>
                <p className="font-body text-[13px] text-muted-foreground mt-1">{activeScan.flag1Desc}</p>
              </motion.div>

              {/* Flag 2 (Masked — clickable) */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className={`mt-4 w-full rounded-md border-l-[3px] ${activeScan.flag2Border} ${activeScan.flag2Bg} p-4 text-left shadow-sm cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => {
                  track("wm_demo_unlock_clicked");
                  handleCtaClick();
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") handleCtaClick(); }}
              >
                <p className={`font-mono text-[10px] font-bold tracking-wider ${activeScan.flag2Color}`}>
                  {activeScan.flag2Label}
                </p>
                <p className="font-body text-[14px] font-semibold text-navy mt-1.5">{activeScan.flag2Title}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="h-2 w-2 rounded-[1px] bg-muted-foreground/30" />
                  ))}
                  <span className="font-body text-[11px] text-cyan-text ml-2 underline underline-offset-2">
                    Upload yours to unlock →
                  </span>
                </div>
              </motion.div>

              {/* Persistent mini-CTA during reveal phase */}
              {phase === "reveal" && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  onClick={handleCtaClick}
                  className="mt-4 w-full rounded-lg border border-border bg-muted px-5 py-2.5 font-body text-[13px] font-semibold text-foreground cursor-pointer hover:bg-accent transition-colors"
                >
                  Scan My Quote — It's Free →
                </motion.button>
              )}

              {/* Flexible spacer */}
              <div className="flex-1" />

              {/* Hook Phase — dynamic CTA */}
              <AnimatePresence>
                {phase === "hook" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full pt-4 border-t border-border mt-4"
                  >
                    <p className="font-display text-[15px] italic text-navy text-center mb-3">
                      {activeScan.hookCta}
                    </p>
                    <motion.button
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      onClick={handleCtaClick}
                      className="w-full rounded-lg bg-gold px-7 py-3 font-body text-[14px] font-bold text-navy shadow-[0_3px_14px_rgba(245,158,11,0.35)] cursor-pointer border-none"
                    >
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
