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

// Terminal-format log steps (scanning phase)
const TERMINAL_STEPS = [
  { cmd: "> EXTRACT line_items from page_1", done: "> EXTRACT line_items from page_1... [OK]" },
  { cmd: "> ID brand_specs in document", done: "> ID brand_specs in document... [OK]" },
  { cmd: "> LOAD market_data/{county}", done: "> LOAD market_data/{county}... [OK]" },
  { cmd: "> SCAN warranty_blocks + permit_lang", done: "> SCAN warranty_blocks + permit_lang... [OK]" },
  { cmd: "> CALC market_delta", done: "> CALC market_delta... [OK]" },
  { cmd: "> COMPILE flag_report", done: "> COMPILE flag_report... [OK]" },
  { cmd: "> GENERATE grade_score", done: "> GENERATE grade_score... [OK]" },
];

// Forensic bounding box markers revealed on the document silhouette as each step completes
const FORENSIC_MARKERS: { x: number; y: number; w: number; h: number; label: string; color: string }[] = [
  { x: 8, y: 31, w: 54, h: 11, label: "LINE_ITEMS", color: "#F97316" },
  { x: 8, y: 13, w: 40, h: 10, label: "BRAND_SPEC", color: "#2563EB" },
  { x: 56, y: 48, w: 36, h: 15, label: "PRICING", color: "#F97316" },
  { x: 8, y: 61, w: 55, h: 11, label: "WARRANTY", color: "#2563EB" },
  { x: 56, y: 13, w: 36, h: 10, label: "TOTAL_COST", color: "#F97316" },
  { x: 8, y: 48, w: 42, h: 10, label: "RED_FLAGS", color: "#DC2626" },
  { x: 8, y: 77, w: 50, h: 10, label: "GRADE_CALC", color: "#059669" },
];

/** Number of milliseconds between each typed character in the forensic terminal. */
const TYPEWRITER_CHAR_DELAY_MS = 30;

/**
 * Total number of discrete signals checked across all 5 pillars.
 * Displayed in the cliffhanger findings counter ("X issues flagged across N signals").
 */
const TOTAL_SIGNALS_CHECKED = 37;

// Pulsar hotspot positions on the document (% of container width/height)
// Preset decorative positions on the stylised document silhouette (not real document coords).
const PULSAR_POSITIONS = [
  { x: 62, y: 36, label: "⚑ FLAG DETECTED" },
  { x: 28, y: 62, label: "⚠ REVIEW NEEDED" },
  { x: 74, y: 66, label: "⚑ FLAG DETECTED" },
];

// 5-pillar breakdown (Safety & Code Match, Install & Scope Clarity, Price Fairness, Fine Print, Warranty Value)
const pillars = [
  { label: "SAFETY & CODE MATCH", text: "Verifying NOA/DP rating compliance for {county}...", color: "#2563EB", delay: 0.3 },
  { label: "INSTALL & SCOPE CLARITY", text: "Checking installation scope and opening details...", color: "#F97316", delay: 0.8 },
  { label: "PRICE FAIRNESS", text: "Benchmarking against {county} county market data...", color: "#2563EB", delay: 1.4 },
  { label: "FINE PRINT & TRANSPARENCY", text: "Reviewing permit inclusion and payment schedule...", color: "#F97316", delay: 2.0 },
  { label: "WARRANTY VALUE", text: "Reviewing labor and manufacturer warranty language...", color: "#2563EB", delay: 2.6 },
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
  const [pillarsDone, setPillarsDone] = useState<boolean[]>([false, false, false, false, false]);
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
      setPillarsDone([false, false, false, false, false]);
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
    setPillarsDone([false, false, false, false, false]);
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

  const gradeColor = GRADE_COLORS[gradeProp] || GRADE_COLORS.C;
  const issueCount = analysisData
    ? Math.min(analysisData.flagRedCount + analysisData.flagAmberCount, 99)
    : 0;
  const pulsarCount = Math.min(issueCount, 3);

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
        padding: "24px 16px",
        overflowY: "auto",
      }}
    >
      <AnimatePresence mode="wait">
        {/* ── Phase 1 + 2: Scanning / Cliffhanger ─────────────────── */}
        {(phase === "scanning" || phase === "cliffhanger") && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ maxWidth: 720, width: "100%" }}
          >
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: "#2563EB",
              letterSpacing: "0.14em",
              marginBottom: 14,
              textAlign: "center",
            }}>
              WINDOWMAN AI · FORENSIC DOCUMENT ANALYSIS
            </p>

            {/* Two-panel layout: doc silhouette (left) + forensic terminal (right) */}
            <div className="flex flex-col md:flex-row" style={{ gap: 10, width: "100%" }}>
              <div className="flex justify-center md:block md:flex-shrink-0">
                <DocumentSilhouette
                  markerCount={phase === "scanning" ? activeLogIndex : FORENSIC_MARKERS.length}
                  showPulsars={phase === "cliffhanger"}
                  pulsarCount={pulsarCount}
                  dimmed={phase === "cliffhanger"}
                  isScanning={phase === "scanning"}
                />
              </div>
              <ForensicTerminal
                steps={TERMINAL_STEPS}
                activeIndex={activeLogIndex}
                county={county}
                progressWidth={progressWidth}
                isCliffhanger={phase === "cliffhanger"}
              />
            </div>

            {/* Cliffhanger: proof-of-read chips + findings counter */}
            {phase === "cliffhanger" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.3 }}
                style={{ marginTop: 12 }}
              >
                {/* Proof of Read — truthful, evidence-based signals only */}
                {analysisData && (
                  <div style={{
                    background: "#111111",
                    border: "1px solid #1A1A1A",
                    padding: "12px 16px",
                    marginBottom: 10,
                  }}>
                    {/* Signs of Reading — truthful chips from preview-safe data only */}
                    <div className="flex flex-wrap gap-3 mb-2">
                      {analysisData.documentType && (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9CA3AF" }}>
                          Detected: {analysisData.documentType.charAt(0).toUpperCase() + analysisData.documentType.slice(1)}
                        </span>
                      )}
                      {analysisData.contractorName && (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9CA3AF" }}>
                          Contractor: {analysisData.contractorName}
                        </span>
                      )}
                      {analysisData.lineItemCount != null && analysisData.lineItemCount > 0 && (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9CA3AF" }}>
                          {analysisData.lineItemCount} line item{analysisData.lineItemCount === 1 ? "" : "s"}
                        </span>
                      )}
                      {analysisData.openingCount != null && analysisData.openingCount > 0 && (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9CA3AF" }}>
                          {analysisData.openingCount} opening{analysisData.openingCount === 1 ? "" : "s"}
                        </span>
                      )}
                      {analysisData.pageCount != null && analysisData.pageCount > 1 && (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9CA3AF" }}>
                          {analysisData.pageCount}-page document
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      {/* OCR Read Quality Badge */}
                      <OcrQualityBadge confidenceScore={analysisData.confidenceScore} data={analysisData} />
                      {issueCount > 0 && <FindingsCounter issues={issueCount} signals={TOTAL_SIGNALS_CHECKED} />}
                    </div>
                  </div>
                )}
                <p style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: "#F97316",
                  letterSpacing: "0.06em",
                  textAlign: "center",
                }}>
                  Data extracted successfully. Analysis ready to compile.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Phase 3 + 4: Pillars / Grade reveal ─────────────────── */}
        {(phase === "pillars" || phase === "reveal") && (
          <motion.div
            key="pillars"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            style={{ maxWidth: 520, width: "100%", textAlign: "center" }}
          >
            <AnimatePresence mode="wait">
              {!showGrade ? (
                <motion.div
                  key="pillar-slices"
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                >
                  <p style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: "#4B5563",
                    letterSpacing: "0.12em",
                    marginBottom: 14,
                  }}>
                    DECONSTRUCTING DOCUMENT · 5 PILLARS
                  </p>
                  {pillars.map((pillar, i) => (
                    <PillarSlice
                      key={i}
                      index={i}
                      label={pillar.label}
                      text={pillar.text}
                      color={pillar.color}
                      delay={pillar.delay}
                      isDone={pillarsDone[i]}
                      county={county}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="grade-reveal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center"
                >
                  {/* Grade box with glitch materialisation */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.08, 1], opacity: [0, 1, 0.4, 1, 0.7, 1] }}
                    transition={{ duration: 0.45, times: [0, 0.5, 0.6, 0.7, 0.85, 1] }}
                    style={{ position: "relative" }}
                  >
                    {/* Radial glow pulse */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: [0, 0.35, 0], scale: [0.5, 2.2, 2.8] }}
                      transition={{ duration: 0.9, delay: 0.25 }}
                      style={{
                        position: "absolute",
                        inset: -40,
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${gradeColor}50, transparent 70%)`,
                        pointerEvents: "none",
                      }}
                    />
                    <motion.div
                      animate={{
                        boxShadow: [
                          `0 0 20px ${gradeColor}3D`,
                          `0 0 60px ${gradeColor}70`,
                          `0 0 30px ${gradeColor}4D`,
                        ],
                      }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 0,
                        background: `${gradeColor}14`,
                        border: `3px solid ${gradeColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <span style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 64,
                        fontWeight: 900,
                        color: gradeColor,
                      }}>
                        {gradeProp}
                      </span>
                    </motion.div>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.2 }}
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11,
                      color: "#F97316",
                      letterSpacing: "0.12em",
                      marginTop: 20,
                    }}
                  >
                    ANALYSIS COMPLETE — GRADE ASSIGNED
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── DocumentSilhouette ────────────────────────────────────────────────────────

const DocumentSilhouette = ({
  markerCount,
  showPulsars,
  pulsarCount,
  dimmed,
  isScanning,
}: {
  markerCount: number;
  showPulsars: boolean;
  pulsarCount: number;
  dimmed: boolean;
  isScanning: boolean;
}) => (
  <div style={{ width: 210 }}>
    <div style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: 8,
      color: "#374151",
      letterSpacing: "0.1em",
      marginBottom: 4,
      textAlign: "center",
    }}>
      DOCUMENT X-RAY
    </div>
    <motion.div
      animate={{ opacity: dimmed ? 0.35 : 1 }}
      transition={{ duration: 0.3 }}
      style={{
        background: "#0F0F0F",
        border: "1px solid #1E1E1E",
        position: "relative",
        height: 295,
        overflow: "hidden",
        padding: "12px 11px",
      }}
    >
      {/* Doc header skeleton */}
      <div style={{ marginBottom: 8, paddingBottom: 7, borderBottom: "1px solid #1A1A1A" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ height: 5, background: "#232323", width: "45%" }} />
          <div style={{ height: 5, background: "#1A1A1A", width: "20%" }} />
        </div>
        <div style={{ height: 3, background: "#1A1A1A", width: "30%", marginBottom: 3 }} />
        <div style={{ height: 3, background: "#1A1A1A", width: "22%" }} />
      </div>

      {/* Body text skeleton lines */}
      {[88, 75, 92, 68, 80, 72, 85, 60].map((w, i) => (
        <div key={i} style={{ height: 3, background: "#1A1A1A", width: `${w}%`, marginBottom: 5 }} />
      ))}

      {/* Table-like section */}
      <div style={{ marginTop: 6, border: "1px solid #1E1E1E" }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ display: "flex", borderBottom: i < 3 ? "1px solid #1A1A1A" : "none", height: 13 }}>
            <div style={{ flex: 2, borderRight: "1px solid #1A1A1A", background: i % 2 === 0 ? "#111" : "transparent" }} />
            <div style={{ flex: 1, background: i % 2 === 0 ? "#111" : "transparent" }} />
          </div>
        ))}
      </div>

      {/* Footer lines */}
      <div style={{ marginTop: 8 }}>
        <div style={{ height: 3, background: "#1A1A1A", width: "40%", marginBottom: 5 }} />
        <div style={{ height: 4, background: "#222", width: "55%", marginBottom: 3 }} />
        <div style={{ height: 3, background: "#1A1A1A", width: "28%" }} />
      </div>

      {/* Sweeping scan line */}
      {isScanning && (
        <motion.div
          initial={{ top: "-2%" }}
          animate={{ top: "102%" }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(90deg, transparent, #2563EB 30%, #F97316 70%, transparent)",
            boxShadow: "0 0 10px 3px rgba(37,99,235,0.35)",
            zIndex: 10,
          }}
        />
      )}

      {/* Forensic marker bounding boxes — revealed as steps complete */}
      {FORENSIC_MARKERS.slice(0, markerCount).map((marker, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          style={{
            position: "absolute",
            left: `${marker.x}%`,
            top: `${marker.y}%`,
            width: `${marker.w}%`,
            height: `${marker.h}%`,
            border: `1px dashed ${marker.color}60`,
            zIndex: 6,
            pointerEvents: "none",
          }}
        >
          <span style={{
            position: "absolute",
            top: -7,
            left: 1,
            fontFamily: "'DM Mono', monospace",
            fontSize: 6,
            color: marker.color,
            letterSpacing: "0.05em",
            background: "#0F0F0F",
            padding: "0 2px",
            lineHeight: 1,
          }}>
            {marker.label}
          </span>
        </motion.div>
      ))}

      {/* Flag pulsars (cliffhanger phase) */}
      {showPulsars && PULSAR_POSITIONS.slice(0, pulsarCount).map((pos, i) => (
        <FlagPulsar key={i} x={pos.x} y={pos.y} label={pos.label} />
      ))}
    </motion.div>
  </div>
);

// ── ForensicTerminal ──────────────────────────────────────────────────────────

const ForensicTerminal = ({
  steps,
  activeIndex,
  county,
  progressWidth,
  isCliffhanger,
}: {
  steps: typeof TERMINAL_STEPS;
  activeIndex: number;
  county: string;
  progressWidth: number;
  isCliffhanger: boolean;
}) => {
  const [typedText, setTypedText] = useState("");
  const intervalRef = useRef<number | null>(null);
  const prevStateRef = useRef<{ index: number; county: string } | null>(null);

  useEffect(() => {
    if (
      prevStateRef.current &&
      prevStateRef.current.index === activeIndex &&
      prevStateRef.current.county === county
    ) {
      return;
    }
    prevStateRef.current = { index: activeIndex, county };

    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTypedText("");

    if (activeIndex >= steps.length) return;

    const fullText = steps[activeIndex].cmd.replace("{county}", county);
    let charIndex = 0;

    intervalRef.current = window.setInterval(() => {
      charIndex++;
      setTypedText(fullText.slice(0, charIndex));
      if (charIndex >= fullText.length && intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, TYPEWRITER_CHAR_DELAY_MS);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeIndex, county, steps]);

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      {/* Terminal panel */}
      <div style={{
        background: "#0D0D0D",
        border: "1px solid #1F1F1F",
        padding: "10px 14px",
        fontFamily: "'DM Mono', monospace",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 200,
      }}>
        {/* macOS-style terminal titlebar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          marginBottom: 10,
          paddingBottom: 8,
          borderBottom: "1px solid #1A1A1A",
        }}>
          {(["#FF5F57", "#FFBD2E", "#28C840"] as const).map((c, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: c }} />
          ))}
          <span style={{ fontSize: 8, color: "#374151", marginLeft: 6, letterSpacing: "0.1em" }}>
            WINDOWMAN-AI · FORENSIC ENGINE
          </span>
        </div>

        {/* Log lines */}
        <div style={{ flex: 1 }}>
          {steps.map((step, i) => {
            // When cliffhanger starts, treat all steps as completed (effectiveIndex past the end).
            const effectiveIndex = isCliffhanger ? steps.length : activeIndex;
            if (i > effectiveIndex) return null;
            const isComplete = i < effectiveIndex;
            const isActiveStep = i === effectiveIndex;

            if (isComplete) {
              return (
                <div key={i} style={{
                  fontSize: 11,
                  color: "#2D3748",
                  marginBottom: 5,
                  letterSpacing: "0.02em",
                  lineHeight: 1.5,
                }}>
                  {step.done.replace("{county}", county)}
                </div>
              );
            }

            if (isActiveStep) {
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 5 }}>
                  <motion.span
                    animate={{ color: ["#F97316", "#FB923C", "#F97316"] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    style={{ fontSize: 11, letterSpacing: "0.02em", lineHeight: 1.5 }}
                  >
                    {typedText}
                  </motion.span>
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.7, repeat: Infinity }}
                    style={{ fontSize: 11, color: "#F97316", marginLeft: 1 }}
                  >
                    ▋
                  </motion.span>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>

      {/* Progress bar below terminal */}
      <div style={{ marginTop: 6, background: "#1A1A1A", height: 4, overflow: "hidden" }}>
        <motion.div
          style={{
            height: 4,
            background: "linear-gradient(90deg, #2563EB, #F97316)",
            width: `${progressWidth}%`,
          }}
          animate={isCliffhanger ? { opacity: [0.6, 1, 0.6] } : {}}
          transition={isCliffhanger ? { duration: 1.2, repeat: Infinity } : {}}
        />
      </div>
    </div>
  );
};

// ── FlagPulsar ────────────────────────────────────────────────────────────────

const FlagPulsar = ({ x, y, label }: { x: number; y: number; label: string }) => {
  const ringBase: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 16,
    height: 16,
    marginTop: -8,
    marginLeft: -8,
    borderRadius: "50%",
    border: "1px solid #DC2626",
  };

  return (
    <div style={{
      position: "absolute",
      left: `${x}%`,
      top: `${y}%`,
      transform: "translate(-50%, -50%)",
      zIndex: 20,
      width: 16,
      height: 16,
    }}>
      <motion.div
        animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        style={ringBase}
      />
      <motion.div
        animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
        style={ringBase}
      />
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: 5,
        height: 5,
        marginTop: -2.5,
        marginLeft: -2.5,
        borderRadius: "50%",
        backgroundColor: "#DC2626",
        zIndex: 1,
      }} />
      <div style={{
        position: "absolute",
        top: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        marginTop: 8,
        fontFamily: "'DM Mono', monospace",
        fontSize: 6,
        color: "#DC2626",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
        background: "rgba(10,10,10,0.9)",
        padding: "1px 3px",
        zIndex: 2,
      }}>
        {label}
      </div>
    </div>
  );
};

// ── PillarSlice ───────────────────────────────────────────────────────────────

const PillarSlice = ({
  index,
  label,
  text,
  color,
  delay,
  isDone,
  county,
}: {
  index: number;
  label: string;
  text: string;
  color: string;
  delay: number;
  isDone: boolean;
  county: string;
}) => (
  <motion.div
    layoutId={`pillar-slice-${index}`}
    initial={{ opacity: 0, y: -24 + index * 6, scaleY: 0.85 }}
    animate={{ opacity: 1, y: 0, scaleY: 1 }}
    exit={{ opacity: 0, scaleX: 0 }}
    transition={{ duration: 0.2, delay }}
    style={{
      background: "#111111",
      border: "1px solid #1A1A1A",
      borderLeft: `3px solid ${color}`,
      borderRadius: 0,
      padding: "12px 16px",
      marginBottom: 8,
      textAlign: "left",
      position: "relative",
      overflow: "hidden",
    }}
  >
    {/* Slice highlight strip */}
    <div style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 1,
      background: `linear-gradient(90deg, ${color}40, transparent)`,
    }} />

    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
      <p style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 8,
        color: "#4B5563",
        letterSpacing: "0.1em",
      }}>
        PILLAR {index + 1} / 5
      </p>
      {isDone && (
        <motion.span
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8,
            color,
            background: `${color}1A`,
            padding: "1px 7px",
            letterSpacing: "0.08em",
          }}
        >
          ✓ COMPLETE
        </motion.span>
      )}
    </div>

    <p style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: 9,
      color: "#E5E7EB",
      letterSpacing: "0.1em",
      marginBottom: 5,
    }}>
      {label}
    </p>

    <p style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 12,
      color: isDone ? "#4B5563" : "#9CA3AF",
      marginBottom: 7,
    }}>
      {isDone ? "Analysis complete" : text.replace("{county}", county)}
    </p>

    <div style={{ background: "#1A1A1A", height: 3, borderRadius: 0, overflow: "hidden" }}>
      <motion.div
        initial={{ width: "0%" }}
        animate={{ width: isDone ? "100%" : "55%" }}
        transition={{ duration: isDone ? 0.2 : 1.5, ease: "easeOut" }}
        style={{ height: 3, backgroundColor: color }}
      />
    </div>
  </motion.div>
);

// ── FindingsCounter ───────────────────────────────────────────────────────────

const FindingsCounter = ({ issues, signals }: { issues: number; signals: number }) => {
  const [displayIssues, setDisplayIssues] = useState(0);
  const [displaySignals, setDisplaySignals] = useState(0);

  useEffect(() => {
    const totalSteps = 24;
    let step = 0;
    const id = window.setInterval(() => {
      step++;
      const pct = step / totalSteps;
      setDisplayIssues(Math.round(pct * issues));
      setDisplaySignals(Math.round(pct * signals));
      if (step >= totalSteps) clearInterval(id);
    }, 35);
    return () => clearInterval(id);
  }, [issues, signals]);

  return (
    <span style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: 10,
      color: "#6B7280",
      letterSpacing: "0.04em",
    }}>
      <span style={{ color: "#DC2626", fontWeight: 700 }}>{displayIssues}</span>
      {" issues flagged across "}
      <span style={{ color: "#E5E7EB" }}>{displaySignals}</span>
      {" signals"}
    </span>
  );
};

// ── OcrQualityBadge ───────────────────────────────────────────────────────────

/** OCR Read Quality Badge — reflects actual read fidelity */
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
    if (confidenceScore >= 90 || (confidenceScore >= 85 && anchorCount >= 3)) { label = "Excellent"; color = "#059669"; }
    else if (confidenceScore >= 70) { label = "Great"; color = "#059669"; }
    else if (confidenceScore >= 55) { label = "Good"; color = "#2563EB"; }
    else { label = "Fair"; color = "#D97706"; }
  } else if (anchorCount >= 3) {
    // No confidence score but strong structural signal (e.g. digital PDF)
    label = "Excellent";
    color = "#059669";
  }

  return (
    <div className="flex items-center gap-2">
      <span style={{
        fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9CA3AF",
        letterSpacing: "0.08em",
      }}>
        READ QUALITY
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
