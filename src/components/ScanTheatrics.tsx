import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScanPolling } from "@/hooks/useScanPolling";
import { toast } from "sonner";
import type { AnalysisData } from "@/hooks/useAnalysisData";

const GRADE_COLORS: Record<string, string> = {
  A: "#059669", // Emerald 600
  B: "#84CC16", // Lime 500
  C: "#F97316", // Orange 500
  D: "#DC2626", // Red 600
  F: "#991B1B", // Red 900
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
  { active: "Extracting line items...", done: "✓ Line items extracted" },
  { active: "Identifying brand specs...", done: "✓ Brand specs analyzed" },
  { active: "Checking {county} benchmarks...", done: "✓ Benchmarks loaded" },
  { active: "Scanning warranty language...", done: "✓ Fine print reviewed" },
  { active: "Calculating market delta...", done: "✓ Delta calculated" },
  { active: "Compiling red flag report...", done: "✓ Flags identified" },
  { active: "Generating grade...", done: "✓ Grade generated" },
];

const pillars = [
  { label: "PRICING ANALYSIS", text: "Benchmarking against {county} data...", color: "#2563EB", delay: 0.2 },
  { label: "SPECIFICATION REVIEW", text: "Checking brand and glass specs...", color: "#F97316", delay: 0.6 },
  { label: "WARRANTY AUDIT", text: "Reviewing labor and warranty terms...", color: "#2563EB", delay: 1.0 },
  { label: "PERMIT & FEE SCAN", text: "Verifying permit and install fees...", color: "#F97316", delay: 1.4 },
];

type Phase = "scanning" | "cliffhanger" | "pillars" | "reveal";

const ScanTheatrics = ({
  isActive,
  selectedCounty = "your",
  scanSessionId = null,
  grade: gradeProp = "C",
  analysisData = null,
  onRevealComplete,
  onInvalidDocument,
  onNeedsBetterUpload,
}: ScanTheatricsProps) => {
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
      toast.error("Invalid quote detected. Please upload a real contractor quote.");
      clearTimers();
      onInvalidDocument?.();
      return;
    }
    if (scanStatus === "needs_better_upload") {
      toast.error("Low quality scan. Please upload a clearer photo.");
      clearTimers();
      onNeedsBetterUpload?.();
      return;
    }
    if (scanStatus === "error") {
      toast.error("Scan error. Please try again.");
      clearTimers();
      onNeedsBetterUpload?.();
      return;
    }
    if ((scanStatus === "preview_ready" || scanStatus === "complete") && scanningMinDone && phase === "scanning") {
      setActiveLogIndex(6);
      setProgressWidth(100);
      setPhase("cliffhanger");
      addTimer(() => startPillars(), 1800);
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
      const pct = Math.min((elapsed / 7000) * 99, 99);
      setProgressWidth(pct);
      if (pct < 99) requestAnimationFrame(animateProgress);
    };
    requestAnimationFrame(animateProgress);

    for (let i = 1; i <= 6; i++) {
      addTimer(() => setActiveLogIndex(i), i * 1000);
    }
    addTimer(() => setScanningMinDone(true), 7000);
  };

  const startPillars = () => {
    setPhase("pillars");
    setPillarsDone([false, false, false, false]);
    setShowGrade(false);
    pillars.forEach((p, i) => {
      addTimer(
        () => {
          setPillarsDone((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        },
        (p.delay + 0.8) * 1000,
      );
    });
    addTimer(() => setShowGrade(true), 4000);
    addTimer(() => {
      onRevealComplete?.();
    }, 6000);
  };

  const county = selectedCounty;
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[9000] flex flex-col items-center justify-center p-6 bg-background/95 backdrop-blur-xl">
      <AnimatePresence mode="wait">
        {(phase === "scanning" || phase === "cliffhanger") && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="glass-card-strong shadow-2xl text-center max-w-[480px] w-full relative overflow-hidden"
            style={{ padding: "40px" }}
          >
            {/* The Holographic Scanning Beam */}
            <div className="absolute inset-x-0 top-0 h-48 overflow-hidden pointer-events-none opacity-20 -z-10">
              <motion.div
                animate={{ top: ["-10%", "110%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-[2px] bg-primary shadow-[0_0_15px_#2563EB]"
              />
            </div>

            <p className="font-mono text-[10px] font-bold text-primary tracking-[0.2em] mb-8 uppercase">
              WindowMan AI Intelligence · Scan In Progress
            </p>

            <div className="text-left space-y-2.5 mb-8">
              {logSteps.map((step, i) => {
                if (i > activeLogIndex) return null;
                const isComplete = i < activeLogIndex;
                const dotColor = isComplete ? "#059669" : "#F97316"; // Emerald vs Orange
                const text = isComplete ? step.done : step.active.replace("{county}", county);

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: dotColor,
                        boxShadow: `0 0 8px ${dotColor}`,
                        animation: !isComplete ? "pulse 1.5s infinite" : "none",
                      }}
                    />
                    <span
                      className={`font-mono text-[12px] ${isComplete ? "text-muted-foreground" : "text-foreground font-medium"}`}
                    >
                      {text}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Progress Bar with Depth */}
            <div className="relative h-1.5 w-full bg-muted rounded-full overflow-hidden shadow-inner border border-border/50">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #2563EB, #F97316)",
                  width: `${progressWidth}%`,
                  boxShadow: "0 0 10px rgba(37, 99, 235, 0.4)",
                }}
                animate={phase === "cliffhanger" ? { opacity: [0.6, 1, 0.6] } : {}}
                transition={phase === "cliffhanger" ? { duration: 1.5, repeat: Infinity } : {}}
              />
            </div>

            {phase === "cliffhanger" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 pt-6 border-t border-border/50"
              >
                {analysisData && (
                  <div className="bg-primary/[0.03] border border-primary/10 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                        Document Intel
                      </span>
                      <div className="flex gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-primary animate-ping" />
                        <span className="w-1 h-1 rounded-full bg-primary" />
                      </div>
                    </div>
                    <OcrQualityBadge confidenceScore={analysisData.confidenceScore} data={analysisData} />
                  </div>
                )}
                <p className="font-mono text-[11px] text-wm-orange font-bold uppercase tracking-widest animate-pulse">
                  Ready to compile report...
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
            className="max-w-[480px] w-full text-center"
          >
            {!showGrade && (
              <div className="space-y-3">
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
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center"
              >
                <div
                  className="w-[140px] h-[140px] rounded-full flex items-center justify-center relative shadow-2xl"
                  style={{
                    background: "white",
                    border: `4px solid ${GRADE_COLORS[gradeProp] || GRADE_COLORS.C}`,
                  }}
                >
                  {/* Subtle Ambient Glow behind grade */}
                  <div
                    className="absolute inset-0 rounded-full -z-10 blur-2xl opacity-40"
                    style={{ backgroundColor: GRADE_COLORS[gradeProp] || GRADE_COLORS.C }}
                  />
                  <span
                    className="tabular-nums"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 72,
                      fontWeight: 900,
                      color: GRADE_COLORS[gradeProp] || GRADE_COLORS.C,
                    }}
                  >
                    {gradeProp}
                  </span>
                </div>

                <p className="font-body text-[18px] font-bold text-foreground mt-8">Analysis Complete.</p>
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-2">
                  Building your dashboard
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
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="glass-card shadow-md text-left p-5 border-border/50 bg-white/50"
  >
    <div className="flex justify-between items-start mb-2">
      <p className="font-mono text-[10px] font-bold text-foreground tracking-widest uppercase">{label}</p>
      {isDone && <span className="font-mono text-[10px] text-primary font-bold">DONE</span>}
    </div>
    <p className="font-body text-[13px] text-muted-foreground mb-3 leading-relaxed">
      {isDone ? "Data verified and processed." : text}
    </p>
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <motion.div
        initial={{ width: "0%" }}
        animate={{ width: isDone ? "100%" : "65%" }}
        transition={{ duration: isDone ? 0.3 : 2, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}33` }}
      />
    </div>
  </motion.div>
);

function OcrQualityBadge({ confidenceScore, data }: { confidenceScore: number | null; data: AnalysisData }) {
  let anchorCount = 0;
  if (data.documentType) anchorCount++;
  if (data.contractorName) anchorCount++;
  if (data.lineItemCount != null && data.lineItemCount > 0) anchorCount++;
  if (data.pageCount != null) anchorCount++;

  let label = "Good";
  let color = "#059669";
  if (confidenceScore != null) {
    if (confidenceScore >= 85 && anchorCount >= 3) {
      label = "Excellent";
      color = "#059669";
    } else if (confidenceScore >= 70) {
      label = "Great";
      color = "#059669";
    } else if (confidenceScore >= 55) {
      label = "Good";
      color = "#2563EB";
    } else {
      label = "Fair";
      color = "#D97706";
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">OCR Read Quality</span>
      <span
        className="font-mono text-[11px] font-black px-3 py-1 rounded-lg tracking-tighter shadow-sm"
        style={{ color: "white", backgroundColor: color }}
      >
        {label.toUpperCase()}
      </span>
    </div>
  );
}

export default ScanTheatrics;
