import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScanPolling, ScanStatus } from "@/hooks/useScanPolling";
import { toast } from "sonner";
import type { AnalysisData } from "@/hooks/useAnalysisData";

const GRADE_COLORS: Record<string, string> = {
  A: "#059669",
  B: "#84CC16",
  C: "#F97316",
  D: "#DC2626",
  F: "#991B1B",
};

const GRADE_MESSAGES: Record<string, string> = {
  A: "Your quote scored an A.",
  B: "Your quote scored a B.",
  C: "Your quote scored a C.",
  D: "Your quote scored a D.",
  F: "Your quote scored an F.",
};

interface ScanTheatricsProps {
  isActive: boolean;
  selectedCounty?: string;
  scanSessionId?: string | null;
  grade?: string;
  analysisData?: AnalysisData | null;
  onRevealComplete?: () => void;
  onInvalidDocument?: () => void;
  onNeedsBetterUpload?: () => void;
}

const logSteps = [
  { active: "Extracting line items from uploaded document...", done: "✓ Line items extracted" },
  { active: "Identifying window brand specifications...", done: "✓ Brand specs analyzed" },
  { active: "Checking {county} county pricing benchmarks...", done: "✓ Benchmarks loaded" },
  { active: "Scanning warranty and permit language...", done: "✓ Fine print reviewed" },
  { active: "Calculating fair market delta...", done: "✓ Delta calculated" },
  { active: "Compiling red flag report...", done: "✓ Flags identified" },
  { active: "Generating grade...", done: "✓ Grade generated" },
];

const pillars = [
  { label: "PRICING ANALYSIS", text: "Benchmarking against {county} county market data...", color: "#0891B2", delay: 0.5 },
  { label: "SPECIFICATION REVIEW", text: "Checking window brand, series, and glass specifications...", color: "#EA580C", delay: 1.2 },
  { label: "WARRANTY AUDIT", text: "Reviewing labor and manufacturer warranty language...", color: "#0891B2", delay: 2.0 },
  { label: "PERMIT & FEE SCAN", text: "Verifying permit inclusion and installation fee structure...", color: "#EA580C", delay: 2.8 },
];

type Phase = "scanning" | "cliffhanger" | "pillars" | "reveal";

const ScanTheatrics = ({ isActive, selectedCounty = "your", scanSessionId = null, grade: gradeProp = "C", analysisData = null, onRevealComplete, onInvalidDocument, onNeedsBetterUpload }: ScanTheatricsProps) => {
  const [phase, setPhase] = useState<Phase>("scanning");
  const [activeLogIndex, setActiveLogIndex] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);
  const [pillarsDone, setPillarsDone] = useState<boolean[]>([false, false, false, false]);
  const [showGrade, setShowGrade] = useState(false);
  const [scanningMinDone, setScanningMinDone] = useState(false);
  const timersRef = useRef<number[]>([]);

  const { status: scanStatus, error: pollError } = useScanPolling({
    scanSessionId: isActive ? scanSessionId : null,
  });

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const addTimer = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => {
    if (!isActive) {
      clearTimers();
      setPhase("scanning");
      setActiveLogIndex(0);
      setProgressWidth(0);
      setPillarsDone([false, false, false, false]);
      setShowGrade(false);
      setScanningMinDone(false);
      return;
    }
    startScanning();
    return clearTimers;
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    if (scanStatus === "invalid_document") {
      toast.error("This doesn't appear to be an impact window or door quote. Please upload a contractor quote.");
      clearTimers();
      onInvalidDocument?.();
      return;
    }
    if (scanStatus === "needs_better_upload") {
      toast.error("We couldn't read this file clearly enough. Please upload a higher quality scan or photo.");
      clearTimers();
      onNeedsBetterUpload?.();
      return;
    }
    if (scanStatus === "error") {
      toast.error("Something went wrong with the scan. Please try again.");
      clearTimers();
      onNeedsBetterUpload?.();
      return;
    }
    if ((scanStatus === "preview_ready" || scanStatus === "complete") && scanningMinDone && phase === "scanning") {
      setActiveLogIndex(6);
      setProgressWidth(100);
      setPhase("cliffhanger");
      addTimer(() => startPillars(), 2000);
    }
  }, [scanStatus, scanningMinDone, phase, isActive]);

  useEffect(() => {
    if (pollError) toast.error(pollError);
  }, [pollError]);

  const startScanning = () => {
    setPhase("scanning");
    setActiveLogIndex(0);
    setProgressWidth(0);
    setScanningMinDone(false);

    const startTime = performance.now();
    const animateProgress = () => {
      const elapsed = performance.now() - startTime;
      const pct = Math.min((elapsed / 8000) * 99, 99);
      setProgressWidth(pct);
      if (pct < 99) requestAnimationFrame(animateProgress);
    };
    requestAnimationFrame(animateProgress);

    for (let i = 1; i <= 6; i++) {
      addTimer(() => setActiveLogIndex(i), i * 1200);
    }
    addTimer(() => setScanningMinDone(true), 8000);
  };

  const startPillars = () => {
    setPhase("pillars");
    setPillarsDone([false, false, false, false]);
    setShowGrade(false);
    pillars.forEach((p, i) => {
      addTimer(() => {
        setPillarsDone((prev) => { const next = [...prev]; next[i] = true; return next; });
      }, (p.delay + 1.2) * 1000);
    });
    addTimer(() => setShowGrade(true), 5000);
    addTimer(() => { console.log({ event: "wm_grade_revealed" }); onRevealComplete?.(); }, 7000);
  };

  const county = selectedCounty;
  if (!isActive) return null;

  return (
    <div
      className="fixed inset-0 z-[9000] flex flex-col items-center justify-center p-8 bg-background/95 backdrop-blur-md"
    >
      <AnimatePresence mode="wait">
        {(phase === "scanning" || phase === "cliffhanger") && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="glass-card-strong shadow-2xl text-center max-w-[520px] w-full"
            style={{ padding: "48px 40px" }}
          >
            <p className="eyebrow text-primary mb-8">
              WINDOWMAN AI · ANALYZING QUOTE
            </p>

            <div className="text-left">
              {logSteps.map((step, i) => {
                if (i > activeLogIndex) return null;
                const isComplete = i < activeLogIndex;
                const dotColor = isComplete ? "hsl(var(--primary))" : "hsl(var(--wm-orange))";
                const text = isComplete ? step.done : step.active.replace("{county}", county);

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2.5 mb-2"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: dotColor,
                        animation: !isComplete ? "pulse 1.5s infinite" : "none",
                      }}
                    />
                    <span className="font-mono text-[13px] text-foreground">
                      {text}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-6 bg-border/50 h-1.5 rounded-full overflow-hidden">
              <motion.div
                className="h-1.5 rounded-full"
                style={{
                  background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--wm-orange)))",
                  width: `${progressWidth}%`,
                }}
                animate={phase === "cliffhanger" ? { opacity: [0.7, 1, 0.7] } : {}}
                transition={phase === "cliffhanger" ? { duration: 1.2, repeat: Infinity } : {}}
              />
            </div>

            {phase === "cliffhanger" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="mt-6"
              >
                <div className="text-left mb-4">
                  {[
                    { label: "Document structure detected", done: true },
                    { label: "Text readability confirmed", done: true },
                    { label: "Quote layout identified", done: true },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15, delay: i * 0.15 }}
                      className="flex items-center gap-2 mb-1.5"
                    >
                      <span className="font-mono text-xs text-emerald-600">✓</span>
                      <span className="font-mono text-xs text-muted-foreground">{item.label}</span>
                    </motion.div>
                  ))}
                </div>

                {analysisData && (analysisData.analysisStatus === "preview_ready" || analysisData.analysisStatus === "complete") && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.5 }}
                    className="bg-card border border-border rounded-lg p-3.5 mb-3"
                  >
                    <div className="flex flex-wrap gap-3 mb-3">
                      {analysisData.pageCount != null && (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          Multi-page document analyzed
                        </span>
                      )}
                      {analysisData.lineItemCount != null && analysisData.lineItemCount > 0 && (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {analysisData.pageCount != null ? "·" : ""} Detailed line items detected
                        </span>
                      )}
                      {analysisData.contractorName && (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          · Contractor information identified
                        </span>
                      )}
                    </div>

                    <OcrQualityBadge confidenceScore={analysisData.confidenceScore} data={analysisData} />
                  </motion.div>
                )}

                <p className="font-mono text-xs text-wm-orange tracking-wider">
                  Data extracted successfully. Analysis ready to compile.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {(phase === "pillars" || phase === "reveal") && (
          <motion.div
            key="pillars"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="max-w-[520px] w-full text-center"
          >
            {!showGrade && (
              <div>
                {pillars.map((pillar, i) => (
                  <PillarCard
                    key={i}
                    label={pillar.label}
                    text={pillar.text.replace("{county}", county)}
                    color={pillar.color}
                    delay={pillar.delay}
                    isDone={pillarsDone[i]}
                  />
                ))}
              </div>
            )}

            {showGrade && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center"
              >
                <div
                  className="w-[120px] h-[120px] rounded-full flex items-center justify-center"
                  style={{
                    background: `${GRADE_COLORS[gradeProp] || GRADE_COLORS.C}14`,
                    border: `3px solid ${GRADE_COLORS[gradeProp] || GRADE_COLORS.C}`,
                    boxShadow: `0 0 40px ${GRADE_COLORS[gradeProp] || GRADE_COLORS.C}4D`,
                  }}
                >
                  <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 64, fontWeight: 800, color: GRADE_COLORS[gradeProp] || GRADE_COLORS.C }}>
                    {gradeProp}
                  </span>
                </div>

                <p className="font-body text-[16px] text-foreground mt-5">
                  Your grade is ready.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PillarCard = ({
  label,
  text,
  color,
  delay,
  isDone,
}: {
  label: string;
  text: string;
  color: string;
  delay: number;
  isDone: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.15, delay }}
    className="glass-card shadow-lg text-left mb-3 p-4"
  >
    <p className="font-mono text-[10px] text-foreground tracking-widest mb-1">
      {label}
    </p>
    <p className="font-body text-[14px] text-muted-foreground mb-2">
      {isDone ? "Complete" : text}
    </p>
    <div className="bg-border/50 h-1 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: "0%" }}
        animate={{ width: isDone ? "100%" : "60%" }}
        transition={{ duration: isDone ? 0.15 : 1.2, ease: "easeOut" }}
        className="h-1 rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
    {isDone && (
      <div className="flex items-center gap-1.5 mt-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
        <span className="font-mono text-[10px] text-primary">Complete</span>
      </div>
    )}
  </motion.div>
);

/** OCR Read Quality Badge — always affirmative */
function OcrQualityBadge({ confidenceScore, data }: { confidenceScore: number | null; data: AnalysisData }) {
  let anchorCount = 0;
  if (data.documentType) anchorCount++;
  if (data.contractorName) anchorCount++;
  if (data.lineItemCount != null && data.lineItemCount > 0) anchorCount++;
  if (data.pageCount != null) anchorCount++;

  let label = "Good";
  let color = "#059669";
  if (confidenceScore != null) {
    if (confidenceScore >= 85 && anchorCount >= 3) { label = "Excellent"; color = "#059669"; }
    else if (confidenceScore >= 70) { label = "Great"; color = "#059669"; }
    else if (confidenceScore >= 55) { label = "Good"; color = "#0891B2"; }
    else { label = "Fair"; color = "#D97706"; }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
        OCR READ QUALITY
      </span>
      <span
        className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded tracking-wider"
        style={{ color, background: `${color}1A` }}
      >
        {label.toUpperCase()}
      </span>
    </div>
  );
}

export default ScanTheatrics;
