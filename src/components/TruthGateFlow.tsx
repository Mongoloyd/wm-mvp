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
    className={`w-full text-center cursor-pointer transition-all duration-150 rounded-lg p-4 font-body text-[15px] font-semibold border-[1.5px] ${
      selected
        ? "bg-primary/10 border-primary text-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
        : "bg-card border-border text-foreground hover:border-primary hover:bg-primary/5 hover:text-primary"
    }`}
  >
    {label}
  </button>
);

const Spinner = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" className="animate-spin text-primary">
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
      const sessionId = crypto.randomUUID();
      const { error } = await supabase.from('leads').insert({
        session_id: sessionId,
        first_name: answers.firstName,
        email: answers.email,
        county: answers.county,
        project_type: answers.projectType,
        window_count: parseWindowCount(answers.windowCount),
        quote_range: answers.quoteRange,
        source: 'truth-gate',
      });

      if (error) throw error;

      if (funnel) {
        funnel.setSessionId(sessionId);
      }

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
          <p className="font-mono text-[15px] text-primary">
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
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
            <p className="font-mono text-xs text-primary tracking-widest">
              BASED ON YOUR ANSWERS
            </p>
            <p className="font-body text-[16px] text-foreground font-bold mt-2">
              Quotes in {selectedCounty} in the {selectedRange} range...
            </p>
            <p className="font-body text-[14px] text-muted-foreground mt-1.5">
              ...score between C and D on average. 67% contain at least one red flag.
            </p>
            <p className="font-body text-[13px] text-muted-foreground italic mt-2">
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
          <h2 className="display-secondary text-foreground mb-2" style={{ fontSize: "clamp(26px, 4vw, 32px)" }}>
            {cfg.question}
          </h2>
          <p className="font-body text-[14px] text-muted-foreground mb-7">
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

    // Step 5 — Lead Gate
    return (
      <motion.div
        key="lead-gate"
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.15 }}
      >
        <div className="inline-flex items-center mb-5 badge-signal rounded-lg px-3 py-1">
          <span className="eyebrow text-primary">✓ Your scan is configured</span>
        </div>

        <h2 className="display-secondary text-foreground mb-2" style={{ fontSize: "clamp(28px, 4vw, 34px)" }}>
          See What's In Your Quote.
        </h2>
        <p className="font-body text-[15px] text-muted-foreground mb-6">
          Enter your details to run the scan.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block font-mono text-[10px] text-muted-foreground tracking-widest mb-1.5">FIRST NAME</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Your first name"
                autoComplete="given-name"
                value={answers.firstName}
                onChange={(e) => setAnswers((p) => ({ ...p, firstName: e.target.value }))}
                className="w-full h-12 rounded-lg px-4 font-body text-[15px] text-foreground bg-card outline-none transition-all duration-150"
                style={{
                  border: `1.5px solid ${fieldStatus.firstName === "invalid" ? "hsl(var(--wm-orange))" : fieldStatus.firstName === "valid" ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
                  paddingRight: fieldStatus.firstName !== "untouched" ? 40 : 16,
                }}
                onFocus={handleInputFocus}
                onBlur={(e) => { handleInputBlur(e); handleFieldBlur("firstName", answers.firstName); }}
              />
              {fieldStatus.firstName === "valid" && <ValidationIcon valid />}
              {fieldStatus.firstName === "invalid" && <ValidationIcon valid={false} />}
            </div>
            {fieldStatus.firstName === "invalid" && (
              <p className="font-body text-xs text-wm-orange mt-1">Please enter your first name (2+ characters)</p>
            )}
          </div>

          <div>
            <label className="block font-mono text-[10px] text-muted-foreground tracking-widest mb-1.5">
              EMAIL ADDRESS <span className="font-normal text-muted-foreground/70">(your grade report is sent here)</span>
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                value={answers.email}
                onChange={(e) => setAnswers((p) => ({ ...p, email: e.target.value }))}
                className="w-full h-12 rounded-lg px-4 font-body text-[15px] text-foreground bg-card outline-none transition-all duration-150"
                style={{
                  border: `1.5px solid ${fieldStatus.email === "invalid" ? "hsl(var(--wm-orange))" : fieldStatus.email === "valid" ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
                  paddingRight: fieldStatus.email !== "untouched" ? 40 : 16,
                }}
                onFocus={handleInputFocus}
                onBlur={(e) => { handleInputBlur(e); handleFieldBlur("email", answers.email); }}
              />
              {fieldStatus.email === "valid" && <ValidationIcon valid />}
              {fieldStatus.email === "invalid" && <ValidationIcon valid={false} />}
            </div>
            {fieldStatus.email === "invalid" && (
              <p className="font-body text-xs text-wm-orange mt-1">Please enter a valid email address</p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={submitState === "submitting" || submitState === "success"}
            whileHover={submitState === "idle" || submitState === "error" ? { scale: 1.01 } : {}}
            whileTap={submitState === "idle" || submitState === "error" ? { scale: 0.98 } : {}}
            className={`btn-depth-primary w-full h-[54px] rounded-xl font-body text-[17px] font-bold mt-1 ${
              submitState === "submitting" ? "opacity-85 cursor-not-allowed" : ""
            } ${submitState === "error" ? "!bg-wm-orange" : ""}`}
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

        <p className="font-body text-xs text-muted-foreground leading-loose text-center mt-3.5">
          No contractor will be contacted without your permission.
          <br />
          No sales calls. Your report is yours — we just help you read it.
        </p>

        <div className="flex items-center gap-2 mt-3 p-2.5 bg-card rounded-lg border border-border">
          <span
            className="animate-pulse-dot w-2 h-2 bg-primary rounded-full inline-block shrink-0"
          />
          <span className="font-mono text-xs text-muted-foreground">
            {tickerToday} homeowners in {selectedCounty} found red flags today
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <section id="truth-gate" className="bg-muted">
      <div className={`mx-auto max-w-2xl px-4 md:px-8 py-16 md:py-24 transition-all duration-500 ${glowing ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''}`}>
        <p className="text-center mb-3 eyebrow text-primary">
          {eyebrowLabels[Math.min(currentStep - 1, 4)]}
        </p>
        <div className="w-full h-1 bg-border rounded mb-8">
          <motion.div
            className="h-1 bg-primary rounded"
            animate={{ width: progressWidth }}
            transition={{ duration: 0.15 }}
          />
        </div>

        <div
          className="glass-card-strong shadow-2xl overflow-hidden"
          style={{
            padding: "clamp(32px, 5vw, 40px)",
            minHeight: 280,
          }}
        >
          <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
        </div>
      </div>
    </section>
  );
};

const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--primary) / 0.15)";
  e.currentTarget.style.borderColor = "hsl(var(--primary))";
};

const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.boxShadow = "none";
};

const ValidationIcon = ({ valid }: { valid: boolean }) => (
  <span
    className={`absolute right-3 top-1/2 -translate-y-1/2 text-[16px] leading-none ${valid ? "text-primary" : "text-wm-orange"}`}
  >
    {valid ? "✓" : "✗"}
  </span>
);

export default TruthGateFlow;
