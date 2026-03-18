import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScanPolling, ScanStatus } from "@/hooks/useScanPolling";
import { toast } from "sonner";

interface ScanTheatricsProps {
  isActive: boolean;
  selectedCounty?: string;
  scanSessionId?: string | null;
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
  { label: "PRICING ANALYSIS", text: "Benchmarking against {county} county market data...", color: "#0099BB", delay: 0.5 },
  { label: "SPECIFICATION REVIEW", text: "Checking window brand, series, and glass specifications...", color: "#C8952A", delay: 1.2 },
  { label: "WARRANTY AUDIT", text: "Reviewing labor and manufacturer warranty language...", color: "#7C3AED", delay: 2.0 },
  { label: "PERMIT & FEE SCAN", text: "Verifying permit inclusion and installation fee structure...", color: "#059669", delay: 2.8 },
];

type Phase = "scanning" | "cliffhanger" | "otp" | "pillars" | "reveal";

const ScanTheatrics = ({ isActive, selectedCounty = "your", scanSessionId = null, onRevealComplete, onInvalidDocument, onNeedsBetterUpload }: ScanTheatricsProps) => {
  const [phase, setPhase] = useState<Phase>("scanning");
  const [activeLogIndex, setActiveLogIndex] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [pillarsDone, setPillarsDone] = useState<boolean[]>([false, false, false, false]);
  const [showGrade, setShowGrade] = useState(false);
  const [skippedOtp, setSkippedOtp] = useState(false);
  const [scanningMinDone, setScanningMinDone] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timersRef = useRef<number[]>([]);

  // Real polling — drives phase transitions
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
      setOtpValues(["", "", "", "", "", ""]);
      setPillarsDone([false, false, false, false]);
      setShowGrade(false);
      setSkippedOtp(false);
      setScanningMinDone(false);
      return;
    }
    startScanning();
    return clearTimers;
  }, [isActive]);

  // React to real scan status changes
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

    // When scan is done (preview_ready/complete), transition from scanning to cliffhanger→otp
    // but only after the minimum scanning animation has played
    if ((scanStatus === "preview_ready" || scanStatus === "complete") && scanningMinDone && phase === "scanning") {
      setActiveLogIndex(6);
      setProgressWidth(100);
      setPhase("cliffhanger");
      addTimer(() => setPhase("otp"), 2000);
    }
  }, [scanStatus, scanningMinDone, phase, isActive]);

  // Poll error handling
  useEffect(() => {
    if (pollError) {
      toast.error(pollError);
    }
  }, [pollError]);

  const startScanning = () => {
    setPhase("scanning");
    setActiveLogIndex(0);
    setProgressWidth(0);

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

    addTimer(() => {
      setActiveLogIndex(6);
      setPhase("cliffhanger");
    }, 8000);

    addTimer(() => setPhase("otp"), 10000);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newVals = [...otpValues];
    newVals[index] = value;
    setOtpValues(newVals);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (value && index === 5) {
      addTimer(() => handleOtpSubmit(), 300);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = () => {
    console.log({ event: "wm_phone_verified" });
    setSkippedOtp(false);
    startPillars(false);
  };

  const handleOtpSkip = () => {
    console.log({ event: "wm_otp_skipped" });
    setSkippedOtp(true);
    startPillars(true);
  };

  const startPillars = (skipped: boolean) => {
    setPhase("pillars");
    setPillarsDone([false, false, false, false]);
    setShowGrade(false);

    pillars.forEach((p, i) => {
      addTimer(() => {
        setPillarsDone((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, (p.delay + 1.2) * 1000);
    });

    addTimer(() => setShowGrade(true), 5000);

    if (!skipped) {
      addTimer(() => {
        console.log({ event: "wm_grade_revealed" });
        onRevealComplete?.();
      }, 7000);
    }
  };

  const county = selectedCounty;

  if (!isActive) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#0F1F35",
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
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 20,
              padding: "48px 40px",
              maxWidth: 520,
              width: "100%",
              textAlign: "center",
            }}
          >
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#0099BB", letterSpacing: "0.1em", marginBottom: 32 }}>
              WINDOWMAN AI · ANALYZING QUOTE
            </p>

            <div style={{ textAlign: "left" }}>
              {logSteps.map((step, i) => {
                if (i > activeLogIndex) return null;
                const isComplete = i < activeLogIndex;
                const dotColor = isComplete ? "#059669" : "#0099BB";
                const text = isComplete ? step.done : step.active.replace("{county}", county);

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
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
                        color: isComplete ? "#94A3B8" : "#E2E8F0",
                      }}
                    >
                      {text}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            <div style={{ marginTop: 24, background: "rgba(255,255,255,0.08)", height: 6, borderRadius: 3, overflow: "hidden" }}>
              <motion.div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: "linear-gradient(90deg, #0099BB, #C8952A)",
                  width: `${progressWidth}%`,
                }}
                animate={phase === "cliffhanger" ? { opacity: [0.7, 1, 0.7] } : {}}
                transition={phase === "cliffhanger" ? { duration: 1.2, repeat: Infinity } : {}}
              />
            </div>

            {phase === "cliffhanger" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12,
                  color: "#C8952A",
                  letterSpacing: "0.05em",
                  marginTop: 16,
                }}
              >
                Data extracted successfully. Analysis ready to compile.
              </motion.p>
            )}
          </motion.div>
        )}

        {phase === "otp" && (
          <motion.div
            key="otp"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            style={{
              background: "#FFFFFF",
              borderRadius: 16,
              padding: "32px 28px",
              maxWidth: 400,
              width: "100%",
              boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 16 }}>📱</div>
            <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 700, color: "#0F1F35" }}>
              Enter the code we sent to your mobile.
            </h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
              We use this to secure your report.
            </p>

            <div className="flex justify-center gap-2 mb-6">
              {otpValues.map((val, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  style={{
                    width: 48,
                    height: 56,
                    border: "1.5px solid #E5E7EB",
                    borderRadius: 8,
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#0F1F35",
                    textAlign: "center",
                    outline: "none",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#C8952A";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(200,149,42,0.15)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#E5E7EB";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOtpSubmit}
              style={{
                width: "100%",
                height: 50,
                background: "#059669",
                color: "#FFFFFF",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 16,
                fontWeight: 700,
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
              }}
            >
              Unlock My Grade Report →
            </motion.button>

            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9CA3AF", marginTop: 12, lineHeight: 1.7 }}>
              Enter the code to unlock your full analysis — or{" "}
              <button
                onClick={handleOtpSkip}
                style={{ fontFamily: "inherit", fontSize: "inherit", color: "#6B7280", background: "none", border: "none", textDecoration: "underline", cursor: "pointer" }}
              >
                skip for now
              </button>{" "}
              and access a partial summary.
            </p>

            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6B7280", marginTop: 8 }}>
              Didn't receive it?{" "}
              <button
                onClick={() => console.log({ event: "wm_otp_resend" })}
                style={{ fontFamily: "inherit", fontSize: "inherit", color: "#0099BB", background: "none", border: "none", textDecoration: "none", cursor: "pointer" }}
              >
                Resend code
              </button>
            </p>
          </motion.div>
        )}

        {(phase === "pillars" || phase === "reveal") && (
          <motion.div
            key="pillars"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="flex flex-col items-center"
              >
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    background: "#FFF7ED",
                    border: "3px solid #F97316",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 40px rgba(249,115,22,0.4)",
                  }}
                >
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 64, fontWeight: 900, color: "#F97316" }}>
                    C
                  </span>
                </div>

                {skippedOtp ? (
                  <>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, color: "#FFFFFF", marginTop: 20 }}>
                      Your quote scored a C.
                    </p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#94A3B8", marginTop: 8, maxWidth: 360, lineHeight: 1.6 }}>
                      This is a basic score. Verify your phone to unlock your full report with line-by-line pricing breakdown, red flags, and negotiation tips.
                    </p>
                    <div className="flex flex-col gap-3 mt-6 w-full" style={{ maxWidth: 320 }}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSkippedOtp(false);
                          setShowGrade(false);
                          setPhase("otp");
                        }}
                        style={{
                          width: "100%",
                          height: 48,
                          background: "#059669",
                          color: "#FFFFFF",
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 15,
                          fontWeight: 700,
                          borderRadius: 10,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        🔓 Unlock Full Report
                      </motion.button>
                      <button
                        onClick={() => {
                          console.log({ event: "wm_grade_revealed", skipped: true });
                          onRevealComplete?.();
                        }}
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 13,
                          color: "#6B7280",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Continue with basic score →
                      </button>
                    </div>
                  </>
                ) : (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#FFFFFF", marginTop: 20 }}>
                    Your grade is ready.
                  </p>
                )}
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
    transition={{ duration: 0.35, delay }}
    style={{
      background: "rgba(255,255,255,0.06)",
      borderRadius: 12,
      padding: "16px 20px",
      marginBottom: 12,
      textAlign: "left",
    }}
  >
    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#94A3B8", letterSpacing: "0.1em", marginBottom: 4 }}>
      {label}
    </p>
    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#E2E8F0", marginBottom: 8 }}>
      {isDone ? "Complete" : text}
    </p>
    <div style={{ background: "rgba(255,255,255,0.08)", height: 4, borderRadius: 2, overflow: "hidden" }}>
      <motion.div
        initial={{ width: "0%" }}
        animate={{ width: isDone ? "100%" : "60%" }}
        transition={{ duration: isDone ? 0.3 : 1.2, ease: "easeOut" }}
        style={{ height: 4, borderRadius: 2, backgroundColor: color }}
      />
    </div>
    {isDone && (
      <div className="flex items-center gap-1.5 mt-1.5">
        <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#059669", display: "inline-block" }} />
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#059669" }}>Complete</span>
      </div>
    )}
  </motion.div>
);

export default ScanTheatrics;
