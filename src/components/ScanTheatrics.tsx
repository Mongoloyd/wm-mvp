import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScanPolling, ScanStatus } from "@/hooks/useScanPolling";
import { toast } from "sonner";
import type { AnalysisData } from "@/hooks/useAnalysisData";
import { usePhonePipeline } from "@/hooks/usePhonePipeline";
import type { PipelineStartResult } from "@/hooks/usePhonePipeline";
import { useScanFunnelSafe } from "@/state/scanFunnel";

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
  { label: "PRICING ANALYSIS", text: "Benchmarking against {county} county market data...", color: "#2563EB", delay: 0.5 },
  { label: "SPECIFICATION REVIEW", text: "Checking window brand, series, and glass specifications...", color: "#F97316", delay: 1.2 },
  { label: "WARRANTY AUDIT", text: "Reviewing labor and manufacturer warranty language...", color: "#2563EB", delay: 2.0 },
  { label: "PERMIT & FEE SCAN", text: "Verifying permit inclusion and installation fee structure...", color: "#F97316", delay: 2.8 },
];

type Phase = "scanning" | "cliffhanger" | "pillars" | "reveal";

const ScanTheatrics = ({ isActive, selectedCounty = "your", scanSessionId = null, grade: gradeProp = "C", analysisData = null, onRevealComplete, onInvalidDocument, onNeedsBetterUpload }: ScanTheatricsProps) => {
  const funnel = useScanFunnelSafe();
  const resolvedScanSessionId = scanSessionId ?? funnel?.scanSessionId ?? null;
  const pipeline = usePhonePipeline("validate_and_send_otp", {
    scanSessionId: resolvedScanSessionId,
    externalPhoneE164: funnel?.phoneE164 ?? null,
  });

  const autoSendGuardRef = useRef<Set<string>>(new Set());
  const activeGuardKeyRef = useRef<string | null>(null);
  const submitPhoneRef = useRef<(() => Promise<PipelineStartResult>) | null>(null);

  const [phase, setPhase] = useState<Phase>("scanning");
  const [activeLogIndex, setActiveLogIndex] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);
  const [pillarsDone, setPillarsDone] = useState<boolean[]>([false, false, false, false]);
  const [showGrade, setShowGrade] = useState(false);
  const [scanningMinDone, setScanningMinDone] = useState(false);
  const timersRef = useRef<number[]>([]);

  const { status: scanStatus, error: pollError } = useScanPolling({
    scanSessionId: isActive ? resolvedScanSessionId : null,
  });

  // Keep submitPhone stable for effect dependency discipline.
  useEffect(() => {
    submitPhoneRef.current = pipeline.submitPhone;
  }, [pipeline.submitPhone]);

  /**
   * OTP auto-send belongs upstream in theatrics.
   * Fires once per (scanSessionId, phoneE164) while theatrics is truly active.
   */
  useEffect(() => {
    if (!isActive) return;
    if (!funnel?.phoneE164 || !resolvedScanSessionId) return;
    const isValidQuote = scanStatus === "preview_ready" || scanStatus === "complete";
    if (!isValidQuote) return;
    if (funnel.phoneStatus !== "screened_valid") return;

    const guardKey = `${resolvedScanSessionId}|${funnel.phoneE164}`;
    if (autoSendGuardRef.current.has(guardKey)) return;
    autoSendGuardRef.current.add(guardKey);

    activeGuardKeyRef.current = guardKey;
    funnel.setPhoneStatus("sending_otp");

    (async () => {
      try {
        const result = await submitPhoneRef.current?.();
        if (!result) return;

        // Relevance guard: only write terminal state if this request
        // is still the active one (same scan session / phone key).
        if (activeGuardKeyRef.current !== guardKey) return;

        if (result.status === "otp_sent") {
          funnel.setPhoneStatus("otp_sent");
        } else {
          funnel.setPhoneStatus("send_failed");
        }
      } catch (err) {
        console.error("[ScanTheatrics] auto-send failed:", err);
        if (activeGuardKeyRef.current === guardKey) {
          funnel.setPhoneStatus("send_failed");
        }
      }
    })();

    // Intentionally no cleanup that suppresses terminal state writes.
    // The in-flight request writes otp_sent / send_failed via the
    // relevance guard (activeGuardKeyRef) even after unmount/handoff.
  }, [isActive, resolvedScanSessionId, scanStatus, funnel?.phoneE164, funnel?.setPhoneStatus]);

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
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#0A0A0A",
        zIndex: 9000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      <AnimatePresence mode="wait">
        {(phase === "scanning" || phase === "cliffhanger") && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              background: "#111111",
              border: "1px solid #1A1A1A",
              borderRadius: 0,
              padding: "48px 40px",
              maxWidth: 520,
              width: "100%",
              textAlign: "center",
            }}
          >
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#2563EB", letterSpacing: "0.1em", marginBottom: 32 }}>
              WINDOWMAN AI · ANALYZING QUOTE
            </p>

            <div style={{ textAlign: "left" }}>
              {logSteps.map((step, i) => {
                if (i > activeLogIndex) return null;
                const isComplete = i < activeLogIndex;
                const dotColor = isComplete ? "#2563EB" : "#F97316";
                const text = isComplete ? step.done : step.active.replace("{county}", county);

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2.5"
                    style={{ marginBottom: 8 }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: dotColor,
                        flexShrink: 0,
                        animation: !isComplete ? "pulse 1.5s infinite" : "none",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 13,
                        color: isComplete ? "#E5E7EB" : "#E5E5E5",
                      }}
                    >
                      {text}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            <div style={{ marginTop: 24, background: "#1A1A1A", height: 6, borderRadius: 0, overflow: "hidden" }}>
              <motion.div
                style={{
                  height: 6,
                  borderRadius: 0,
                  background: "linear-gradient(90deg, #2563EB, #F97316)",
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
                style={{ marginTop: 24 }}
              >
                {/* Proof of Read — truthful, evidence-based signals only */}
                {analysisData && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.5 }}
                    style={{
                      background: "#111111",
                      border: "1px solid #1A1A1A",
                      padding: "14px 18px",
                      marginBottom: 12,
                    }}
                  >
                    {/* Presence-based chips — only rendered when value is meaningful */}
                    <div className="flex flex-wrap gap-3 mb-3">
                      {analysisData.contractorName && (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9CA3AF" }}>
                          Contractor: {analysisData.contractorName}
                        </span>
                      )}
                      {analysisData.lineItemCount != null && analysisData.lineItemCount > 0 && (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9CA3AF" }}>
                          {analysisData.lineItemCount} line items detected
                        </span>
                      )}
                      {analysisData.openingCount != null && analysisData.openingCount > 0 && (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9CA3AF" }}>
                          {analysisData.openingCount} openings identified
                        </span>
                      )}
                      {analysisData.pageCount != null && analysisData.pageCount > 1 && (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9CA3AF" }}>
                          Multi-page document analyzed
                        </span>
                      )}
                      {analysisData.hasWarranty === true && (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9CA3AF" }}>
                          Warranty language found
                        </span>
                      )}
                      {analysisData.hasPermits === true && (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9CA3AF" }}>
                          Permit language found
                        </span>
                      )}
                      {analysisData.flagRedCount > 0 && (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9CA3AF" }}>
                          {analysisData.flagRedCount} critical flagged
                        </span>
                      )}
                      {analysisData.flagAmberCount > 0 && (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9CA3AF" }}>
                          {analysisData.flagAmberCount} warnings flagged
                        </span>
                      )}
                    </div>

                    {/* OCR Read Quality Badge */}
                    <OcrQualityBadge confidenceScore={analysisData.confidenceScore} data={analysisData} />
                  </motion.div>
                )}

                <p style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12,
                  color: "#F97316",
                  letterSpacing: "0.05em",
                }}>
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
            style={{ maxWidth: 520, width: "100%", textAlign: "center" }}
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
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 0,
                    background: `${GRADE_COLORS[gradeProp] || GRADE_COLORS.C}14`,
                    border: `3px solid ${GRADE_COLORS[gradeProp] || GRADE_COLORS.C}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 0 40px ${GRADE_COLORS[gradeProp] || GRADE_COLORS.C}4D`,
                  }}
                >
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 64, fontWeight: 900, color: GRADE_COLORS[gradeProp] || GRADE_COLORS.C }}>
                    {gradeProp}
                  </span>
                </div>

                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#E5E5E5", marginTop: 20 }}>
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
    style={{
      background: "#111111",
      border: "1px solid #1A1A1A",
      borderRadius: 0,
      padding: "16px 20px",
      marginBottom: 12,
      textAlign: "left",
    }}
  >
    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#E5E7EB", letterSpacing: "0.1em", marginBottom: 4 }}>
      {label}
    </p>
    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#E5E5E5", marginBottom: 8 }}>
      {isDone ? "Complete" : text}
    </p>
    <div style={{ background: "#1A1A1A", height: 4, borderRadius: 0, overflow: "hidden" }}>
      <motion.div
        initial={{ width: "0%" }}
        animate={{ width: isDone ? "100%" : "60%" }}
        transition={{ duration: isDone ? 0.15 : 1.2, ease: "easeOut" }}
        style={{ height: 4, borderRadius: 0, backgroundColor: color }}
      />
    </div>
    {isDone && (
      <div className="flex items-center gap-1.5 mt-1.5">
        <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#2563EB", display: "inline-block" }} />
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#2563EB" }}>Complete</span>
      </div>
    )}
  </motion.div>
);

/** OCR Read Quality Badge — always affirmative */
function OcrQualityBadge({ confidenceScore, data }: { confidenceScore: number | null; data: AnalysisData }) {
  // Derive quality from confidence + anchor presence
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
    else if (confidenceScore >= 55) { label = "Good"; color = "#2563EB"; }
    else { label = "Fair"; color = "#D97706"; }
  }

  return (
    <div className="flex items-center gap-2">
      <span style={{
        fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9CA3AF",
        letterSpacing: "0.08em",
      }}>
        OCR READ QUALITY
      </span>
      <span style={{
        fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700,
        color, background: `${color}1A`, padding: "2px 10px",
        letterSpacing: "0.06em",
      }}>
        {label.toUpperCase()}
      </span>
    </div>
  );
}

export default ScanTheatrics;
