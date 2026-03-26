import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isValidEmail, isValidName } from "@/utils/formatPhone";
import { Check } from "lucide-react";
import { useTickerStats } from "@/hooks/useTickerStats";
import { supabase } from "@/integrations/supabase/client";
import { useScanFunnelSafe } from "@/state/scanFunnel";

const stepConfig = [
  {
    question: "How many windows are in your project?",
    sub: "We use this to calibrate the market comparison.",
    key: "windowCount",
    options: ["1–5 windows", "6–10 windows", "11–20 windows", "20+ windows"],
  },
  {
    question: "What type of project is this?",
    sub: "This helps the AI focus on the right benchmarks for your scope.",
    key: "projectType",
    options: ["Full home replacement", "Partial replacement", "New construction", "Single room / addition"],
  },
  {
    question: "Which Florida county is the project in?",
    sub: "We have pricing benchmarks for every major Florida county.",
    key: "county",
    options: ["Miami-Dade", "Broward", "Palm Beach", "Other Florida county"],
  },
  {
    question: "What's your approximate quote total?",
    sub: "This is how we calculate your dollar overage against fair market.",
    key: "quoteRange",
    options: ["Under $10,000", "$10,000–$20,000", "$20,000–$35,000", "$35,000+"],
  },
];

const eyebrowLabels = [
  "STEP 1 OF 4 · CONFIGURE YOUR SCAN",
  "STEP 2 OF 4 · CONFIGURE YOUR SCAN",
  "STEP 3 OF 4 · CONFIGURE YOUR SCAN",
  "STEP 4 OF 4 · CONFIGURE YOUR SCAN",
  "STEP 4 OF 4 · SCAN CONFIGURED",
];

type Answers = {
  windowCount: string;
  projectType: string;
  county: string;
  quoteRange: string;
  firstName: string;
  email: string;
};

type TransitionState = "idle" | "loading" | "estimate" | "done";
type SubmitState = "idle" | "submitting" | "success" | "error";
type FieldStatus = "untouched" | "valid" | "invalid";

const slideVariants = {
  enter: { x: 40, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -40, opacity: 0 },
};

const parseWindowCount = (val: string): number | null => {
  if (val.includes("1–5")) return 5;
  if (val.includes("6–10")) return 10;
  if (val.includes("11–20")) return 20;
  if (val.includes("20+")) return 25;
  return null;
};

const OptionButton = ({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-between p-4 border transition-all group text-left ${
      selected
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-border bg-background hover:border-primary/50 hover:bg-primary/[0.03] text-foreground'
    }`}
    style={{ borderRadius: 0, boxShadow: selected ? '0 0 0 3px rgba(37,99,235,0.15)' : 'none' }}
  >
    <span className="font-body text-wm-body-soft">{label}</span>
    <span className={`text-base transition-colors ${selected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}>→</span>
  </button>
);

const Spinner = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" className="animate-spin" style={{ color: "#2563EB" }}>
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.25" />
    <path d="M10 2a8 8 0 0 1 8 8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

const TruthGateFlow = ({ onLeadCaptured, onStepChange, highlight, onHighlightDone }: { onLeadCaptured?: (sessionId: string) => void; onStepChange?: (step: number, county: string) => void; highlight?: boolean; onHighlightDone?: () => void }) => {
  const [glowing, setGlowing] = useState(false);
  const { today: tickerToday } = useTickerStats();
  useEffect(() => {
    if (highlight) {
      setGlowing(true);
      const timer = setTimeout(() => {
        setGlowing(false);
        onHighlightDone?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [highlight, onHighlightDone]);
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({
    windowCount: "",
    projectType: "",
    county: "",
    quoteRange: "",
    firstName: "",
    email: "",
  });
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [transitionState, setTransitionState] = useState<TransitionState>("idle");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [fieldStatus, setFieldStatus] = useState<Record<string, FieldStatus>>({
    firstName: "untouched",
    email: "untouched",
  });
  const funnel = useScanFunnelSafe();

  const selectedCounty = answers.county || "your county";
  const selectedRange = answers.quoteRange || "your";

  const handleOptionClick = useCallback(
    (key: string, value: string) => {
      setSelectedOption(value);
      const newAnswers = { ...answers, [key]: value };
      setAnswers((prev) => ({ ...prev, [key]: value }));

      if (currentStep < 4) {
        setTimeout(() => {
          setSelectedOption("");
          setCurrentStep((s) => {
            const next = s + 1;
            onStepChange?.(next - 1, newAnswers.county || "your county");
            return next;
          });
        }, 300);
      } else {
        setTimeout(() => {
          setTransitionState("loading");
          setTimeout(() => {
            setTransitionState("estimate");
            setTimeout(() => {
              setTransitionState("done");
              setCurrentStep(5);
            }, 1500);
          }, 500);
        }, 400);
      }
    },
    [currentStep]
  );

  const validateField = useCallback((field: string, value: string) => {
    switch (field) {
      case "firstName": return isValidName(value) ? "valid" : "invalid";
      case "email": return isValidEmail(value) ? "valid" : "invalid";
      default: return "untouched";
    }
  }, []);

  const handleFieldBlur = useCallback((field: string, value: string) => {
    if (value.trim().length > 0) {
      setFieldStatus(prev => ({ ...prev, [field]: validateField(field, value) }));
    }
  }, [validateField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameValid = isValidName(answers.firstName);
    const emailValid = isValidEmail(answers.email);

    setFieldStatus({
      firstName: nameValid ? "valid" : "invalid",
      email: emailValid ? "valid" : "invalid",
    });

    if (!nameValid || !emailValid) return;

    setSubmitState("submitting");

    try {
      // Insert lead row — phone is captured later at LockedOverlay (Just-in-Time OTP)
      const sessionId = crypto.randomUUID();
      const { error } = await supabase.from('leads').insert({
        session_id: sessionId,
        first_name: answers.firstName,
        email: answers.email,
        // phone_e164 intentionally omitted — captured at LockedOverlay after scan
        county: answers.county,
        project_type: answers.projectType,
        window_count: parseWindowCount(answers.windowCount),
        quote_range: answers.quoteRange,
        source: 'truth-gate',
      });

      if (error) throw error;

      // Write to ScanFunnelContext (persist sessionId)
      if (funnel) {
        funnel.setSessionId(sessionId);
      }

      // Analytics: track lead capture (no OTP at this stage)
      supabase.from("event_logs").insert({
        event_name: "lead_captured_no_phone",
        session_id: sessionId,
        metadata: {
          first_name: answers.firstName,
          county: answers.county,
          timestamp: new Date().toISOString(),
        },
      }).then(({ error: evtErr }) => {
        if (evtErr) console.warn("event_log insert failed:", evtErr);
      });

      setSubmitState("success");
      onLeadCaptured?.(sessionId);
    } catch (err) {
      console.error('Lead capture error:', err);

      // Analytics: track upstream failure
      supabase.from("event_logs").insert({
        event_name: "lead_capture_failed",
        session_id: funnel?.sessionId || null,
        metadata: {
          error_message: err instanceof Error ? err.message : String(err),
          stage: "lead_capture",
          timestamp: new Date().toISOString(),
        },
      }).then(({ error: evtErr }) => {
        if (evtErr) console.warn("event_log insert failed:", evtErr);
      });

      setSubmitState("error");
    }
  };

  const progressWidth = currentStep <= 4 ? `${currentStep * 25}%` : "100%";

  const renderStepContent = () => {
    if (transitionState === "loading") {
      return (
        <motion.div
          key="loading"
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.15 }}
          className="flex flex-col items-center justify-center py-12 gap-4"
        >
          <Spinner />
          <p className="font-mono text-wm-body-soft text-primary">
            Configuring your analysis...
          </p>
        </motion.div>
      );
    }

    if (transitionState === "estimate") {
      return (
        <motion.div
          key="estimate"
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.15 }}
        >
          <div className="bg-primary/5 border border-primary/20 p-5" style={{ borderRadius: 0 }}>
            <p className="font-mono text-wm-body-soft text-primary uppercase tracking-widest mb-2">
              BASED ON YOUR ANSWERS
            </p>
            <p className="font-body text-wm-label text-foreground mb-1">
              Quotes in {selectedCounty} in the {selectedRange} range...
            </p>
            <p className="font-body text-wm-body-soft text-muted-foreground">
              ...score between C and D on average. 67% contain at least one red flag.
            </p>
            <p className="font-body text-wm-body-soft text-muted-foreground italic mt-3">
              Your actual grade requires your quote. But you're in a high-risk range.
            </p>
          </div>
        </motion.div>
      );
    }

    if (currentStep >= 1 && currentStep <= 4) {
      const cfg = stepConfig[currentStep - 1];
      return (
        <motion.div
          key={`step-${currentStep}`}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.15 }}
        >
          <h2
            className="font-display font-black uppercase leading-tight text-foreground"
            style={{
              fontSize: "clamp(22px, 4vw, 30px)",
              letterSpacing: "0.02em",
              marginBottom: 8,
            }}
          >
            {cfg.question}
          </h2>
          <p className="font-body text-wm-body-soft text-muted-foreground mb-7">
            {cfg.sub}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {cfg.options.map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={selectedOption === opt}
                onClick={() => handleOptionClick(cfg.key, opt)}
              />
            ))}
          </div>
        </motion.div>
      );
    }

    // Step 5 — Lead Gate (name + email only, phone captured later at LockedOverlay)
    return (
      <motion.div
        key="lead-gate"
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.15 }}
      >
        <div
          className="inline-flex items-center mb-5 px-3 py-1 bg-primary/10 border border-primary"
          style={{ borderRadius: 0, fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#2563EB" }}
        >
          ✓ Your scan is configured
        </div>

        <h2
          className="font-display font-black uppercase leading-tight text-foreground"
          style={{
            fontSize: "clamp(24px, 4vw, 32px)",
            letterSpacing: "0.02em",
            marginBottom: 8,
          }}
        >
          See What's In Your Quote.
        </h2>
        <p className="font-body text-wm-body-soft text-muted-foreground mb-6">
          Enter your details to run the scan.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label style={labelStyle}>FIRST NAME</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Your first name"
                autoComplete="given-name"
                value={answers.firstName}
                onChange={(e) => setAnswers((p) => ({ ...p, firstName: e.target.value }))}
                style={{
                  ...inputStyle,
                  borderColor: fieldStatus.firstName === "invalid" ? "#F97316" : fieldStatus.firstName === "valid" ? "hsl(var(--primary))" : "hsl(var(--border))",
                  paddingRight: fieldStatus.firstName !== "untouched" ? 40 : 16,
                }}
                onFocus={handleInputFocus}
                onBlur={(e) => { handleInputBlur(e); handleFieldBlur("firstName", answers.firstName); }}
              />
              {fieldStatus.firstName === "valid" && <ValidationIcon valid />}
              {fieldStatus.firstName === "invalid" && <ValidationIcon valid={false} />}
            </div>
            {fieldStatus.firstName === "invalid" && (
              <p style={errorTextStyle}>Please enter your first name (2+ characters)</p>
            )}
          </div>

          <div>
            <label style={labelStyle}>
              EMAIL ADDRESS <span className="text-muted-foreground font-normal">(your grade report is sent here)</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                value={answers.email}
                onChange={(e) => setAnswers((p) => ({ ...p, email: e.target.value }))}
                style={{
                  ...inputStyle,
                  borderColor: fieldStatus.email === "invalid" ? "#F97316" : fieldStatus.email === "valid" ? "hsl(var(--primary))" : "hsl(var(--border))",
                  paddingRight: fieldStatus.email !== "untouched" ? 40 : 16,
                }}
                onFocus={handleInputFocus}
                onBlur={(e) => { handleInputBlur(e); handleFieldBlur("email", answers.email); }}
              />
              {fieldStatus.email === "valid" && <ValidationIcon valid />}
              {fieldStatus.email === "invalid" && <ValidationIcon valid={false} />}
            </div>
            {fieldStatus.email === "invalid" && (
              <p style={errorTextStyle}>Please enter a valid email address</p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={submitState === "submitting" || submitState === "success"}
            whileHover={submitState === "idle" || submitState === "error" ? { scale: 1.01 } : {}}
            whileTap={submitState === "idle" || submitState === "error" ? { scale: 0.98 } : {}}
            className="btn-depth-primary w-full"
            style={{
              height: 54,
              fontSize: 18,
              background: submitState === "error" ? "linear-gradient(135deg,#F97316 0%,#EA580C 100%)" : undefined,
              boxShadow:
                submitState === "error"
                  ? "0 10px 25px rgba(249,115,22,0.35), 0 0 0 1px rgba(234,88,12,0.9)"
                  : undefined,
              marginTop: 4,
            }}
          >
            {submitState === "idle" && "Upload My Quote →"}
            {submitState === "submitting" && (
              <span className="inline-flex items-center gap-2">
                <Spinner /> Saving...
              </span>
            )}
            {submitState === "success" && (
              <span className="inline-flex items-center gap-2">
                <Check size={18} /> Ready — Upload Below
              </span>
            )}
            {submitState === "error" && "Something went wrong — Try Again"}
          </motion.button>
        </form>

        <p className="font-body text-wm-body-soft text-muted-foreground leading-relaxed text-center mt-4">
          No contractor will be contacted without your permission.
          <br />
          No sales calls. Your report is yours — we just help you read it.
        </p>

        <div
          className="flex items-center gap-2 mt-3 px-3 py-2.5 bg-card border border-border"
          style={{ borderRadius: 0 }}
        >
          <span
            className="animate-pulse-dot shrink-0"
            style={{ width: 8, height: 8, backgroundColor: "#2563EB", borderRadius: "50%", display: "inline-block" }}
          />
          <span className="font-mono text-[11px] text-muted-foreground">
            {tickerToday} homeowners in {selectedCounty} found red flags today
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <section id="truth-gate" className="bg-background">
      <div className={`mx-auto max-w-2xl px-4 md:px-8 py-16 md:py-24 transition-all duration-500 ${glowing ? 'ring-2 ring-cobalt shadow-lg shadow-cobalt/20' : ''}`}>
        <p
          className="text-center mb-3 font-mono text-[11px] text-primary tracking-[0.1em]"
        >
          {eyebrowLabels[Math.min(currentStep - 1, 4)]}
        </p>
        <div className="w-full h-1 bg-muted mb-8">
          <motion.div
            className="h-1 bg-primary"
            animate={{ width: progressWidth }}
            transition={{ duration: 0.15 }}
          />
        </div>

        <div
          className="glass-card-strong transform -translate-y-1"
          style={{
            padding: "clamp(28px, 5vw, 40px)",
            minHeight: 280,
            overflow: "hidden",
          }}
        >
          <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
        </div>
      </div>
    </section>
  );
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'DM Mono', monospace",
  fontSize: 10,
  color: "hsl(var(--muted-foreground))",
  letterSpacing: "0.08em",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 48,
  border: "1.5px solid hsl(var(--border))",
  borderRadius: 0,
  padding: "0 16px",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 15,
  color: "hsl(var(--foreground))",
  background: "hsl(var(--background))",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  boxSizing: "border-box",
};

const errorTextStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 12,
  color: "#F97316",
  marginTop: 4,
};

const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.15)";
  e.currentTarget.style.borderColor = "#2563EB";
};

const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.boxShadow = "none";
};

const ValidationIcon = ({ valid }: { valid: boolean }) => (
  <span
    style={{
      position: "absolute",
      right: 12,
      top: "50%",
      transform: "translateY(-50%)",
      fontSize: 16,
      lineHeight: 1,
      color: valid ? "#2563EB" : "#F97316",
    }}
  >
    {valid ? "✓" : "✗"}
  </span>
);

export default TruthGateFlow;
