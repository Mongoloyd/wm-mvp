import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePhoneInput } from "@/hooks/usePhoneInput";
import { isValidEmail, isValidName } from "@/utils/formatPhone";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  phone: string;
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
    style={{
      background: selected ? "#FDF3E3" : "#FFFFFF",
      border: `1.5px solid ${selected ? "#C8952A" : "#E5E7EB"}`,
      borderRadius: 10,
      padding: "18px 16px",
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 15,
      fontWeight: 600,
      color: selected ? "#C8952A" : "#374151",
      textAlign: "center",
      cursor: "pointer",
      transition: "all 0.15s ease",
      boxShadow: selected ? "0 0 0 3px rgba(200,149,42,0.15)" : "none",
    }}
    onMouseEnter={(e) => {
      if (!selected) {
        e.currentTarget.style.borderColor = "#C8952A";
        e.currentTarget.style.background = "#FDF3E3";
        e.currentTarget.style.color = "#C8952A";
      }
    }}
    onMouseLeave={(e) => {
      if (!selected) {
        e.currentTarget.style.borderColor = "#E5E7EB";
        e.currentTarget.style.background = "#FFFFFF";
        e.currentTarget.style.color = "#374151";
      }
    }}
  >
    {label}
  </button>
);

const Spinner = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" className="animate-spin" style={{ color: "#0099BB" }}>
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.25" />
    <path d="M10 2a8 8 0 0 1 8 8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

const TruthGateFlow = ({ onLeadCaptured, onStepChange, highlight, onHighlightDone }: { onLeadCaptured?: (sessionId: string) => void; onStepChange?: (step: number, county: string) => void; highlight?: boolean; onHighlightDone?: () => void }) => {
  const [glowing, setGlowing] = useState(false);

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
    phone: "",
  });
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [transitionState, setTransitionState] = useState<TransitionState>("idle");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [fieldStatus, setFieldStatus] = useState<Record<string, FieldStatus>>({
    firstName: "untouched",
    email: "untouched",
    phone: "untouched",
  });
  const [tcpaConsent, setTcpaConsent] = useState(false);
  const phoneInput = usePhoneInput();

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
      case "phone": return phoneInput.isValid ? "valid" : "invalid";
      default: return "untouched";
    }
  }, [phoneInput.isValid]);

  const handleFieldBlur = useCallback((field: string, value: string) => {
    if (value.trim().length > 0) {
      setFieldStatus(prev => ({ ...prev, [field]: validateField(field, value) }));
    }
  }, [validateField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameValid = isValidName(answers.firstName);
    const emailValid = isValidEmail(answers.email);
    const phoneValid = phoneInput.isValid;

    setFieldStatus({
      firstName: nameValid ? "valid" : "invalid",
      email: emailValid ? "valid" : "invalid",
      phone: phoneValid ? "valid" : "invalid",
    });

    if (!nameValid || !emailValid || !phoneValid || !tcpaConsent) return;

    setSubmitState("submitting");

    try {
      const sessionId = crypto.randomUUID();
      const { error } = await supabase.from('leads').insert({
        session_id: sessionId,
        first_name: answers.firstName,
        email: answers.email,
        phone_e164: phoneInput.e164,
        county: answers.county,
        project_type: answers.projectType,
        window_count: parseWindowCount(answers.windowCount),
        quote_range: answers.quoteRange,
        source: 'truth-gate',
      });

      if (error) throw error;

      setSubmitState("success");
      onLeadCaptured?.(sessionId);
    } catch (err) {
      console.error('Lead capture error:', err);
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
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center justify-center py-12 gap-4"
        >
          <Spinner />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#0099BB" }}>
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
          transition={{ duration: 0.25 }}
        >
          <div style={{ background: "#E8F7FB", borderRadius: 10, padding: 20 }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#0099BB", letterSpacing: "0.1em" }}>
              BASED ON YOUR ANSWERS
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#0F1F35", fontWeight: 700, marginTop: 8 }}>
              Quotes in {selectedCounty} in the {selectedRange} range...
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#374151", marginTop: 6 }}>
              ...score between C and D on average. 67% contain at least one red flag.
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6B7280", fontStyle: "italic", marginTop: 8 }}>
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
          transition={{ duration: 0.25 }}
        >
          <h2
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: "clamp(26px, 4vw, 32px)",
              color: "#0F1F35",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}
          >
            {cfg.question}
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7280", marginBottom: 28 }}>
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
        transition={{ duration: 0.25 }}
      >
        <div
          className="inline-flex items-center mb-5"
          style={{
            background: "#ECFDF5",
            border: "1px solid #059669",
            borderRadius: 6,
            padding: "4px 12px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: "#059669",
          }}
        >
          ✓ Your scan is configured
        </div>

        <h2
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: "clamp(28px, 4vw, 34px)",
            color: "#0F1F35",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            marginBottom: 8,
          }}
        >
          See What's In Your Quote.
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#6B7280", marginBottom: 24 }}>
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
                  borderColor: fieldStatus.firstName === "invalid" ? "#EF4444" : fieldStatus.firstName === "valid" ? "#059669" : "#E5E7EB",
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
              EMAIL ADDRESS <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(your grade report is sent here)</span>
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
                  borderColor: fieldStatus.email === "invalid" ? "#EF4444" : fieldStatus.email === "valid" ? "#059669" : "#E5E7EB",
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

          <div>
            <label style={labelStyle}>
              MOBILE NUMBER <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(one-time code to unlock your report)</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="(555) 000-0000"
                value={phoneInput.displayValue}
                onChange={(e) => {
                  phoneInput.handleChange(e);
                  setAnswers((p) => ({ ...p, phone: e.target.value }));
                }}
                style={{
                  ...inputStyle,
                  borderColor: fieldStatus.phone === "invalid" ? "#EF4444" : fieldStatus.phone === "valid" ? "#059669" : "#E5E7EB",
                  paddingRight: fieldStatus.phone !== "untouched" ? 40 : 16,
                }}
                onFocus={handleInputFocus}
                onBlur={(e) => { handleInputBlur(e); handleFieldBlur("phone", phoneInput.rawDigits); }}
              />
              {fieldStatus.phone === "valid" && <ValidationIcon valid />}
              {fieldStatus.phone === "invalid" && <ValidationIcon valid={false} />}
            </div>
            {fieldStatus.phone === "invalid" && (
              <p style={errorTextStyle}>Please enter a valid 10-digit US phone number</p>
            )}
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer" style={{ marginTop: 4 }}>
            <input
              type="checkbox"
              checked={tcpaConsent}
              onChange={(e) => setTcpaConsent(e.target.checked)}
              style={{ width: 16, height: 16, marginTop: 2, accentColor: "#059669", flexShrink: 0 }}
            />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>
              By providing your number, you consent to receive one call regarding your quote analysis.
              No spam, no contractor contact without permission.
            </span>
          </label>

          <motion.button
            type="submit"
            disabled={submitState === "submitting" || submitState === "success"}
            whileHover={submitState === "idle" || submitState === "error" ? { scale: 1.01, backgroundColor: "#047857" } : {}}
            whileTap={submitState === "idle" || submitState === "error" ? { scale: 0.98 } : {}}
            style={{
              width: "100%",
              height: 54,
              background: submitState === "success" ? "#047857" : submitState === "error" ? "#DC2626" : "#059669",
              color: "#FFFFFF",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 17,
              fontWeight: 700,
              borderRadius: 10,
              border: "none",
              boxShadow: "0 4px 16px rgba(5, 150, 105, 0.35)",
              cursor: submitState === "submitting" ? "not-allowed" : "pointer",
              marginTop: 4,
              opacity: submitState === "submitting" ? 0.85 : 1,
              transition: "background 0.2s, opacity 0.2s",
            }}
          >
            {submitState === "idle" && "Show Me My Grade →"}
            {submitState === "submitting" && (
              <span className="inline-flex items-center gap-2">
                <Spinner /> Analyzing...
              </span>
            )}
            {submitState === "success" && (
              <span className="inline-flex items-center gap-2">
                <Check size={18} /> Report Sent!
              </span>
            )}
            {submitState === "error" && "Something went wrong — Try Again"}
          </motion.button>
        </form>

        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: "#9CA3AF",
            lineHeight: 1.8,
            textAlign: "center",
            marginTop: 14,
          }}
        >
          No contractor will be contacted without your permission.
          <br />
          No sales calls. Your report is yours — we just help you read it.
        </p>

        <div
          className="flex items-center gap-2"
          style={{
            marginTop: 12,
            padding: "10px 14px",
            background: "#F9FAFB",
            borderRadius: 8,
            border: "1px solid #E5E7EB",
          }}
        >
          <span
            className="animate-pulse-dot"
            style={{
              width: 8,
              height: 8,
              backgroundColor: "#059669",
              borderRadius: "50%",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#6B7280" }}>
            14 homeowners in {selectedCounty} found red flags today
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <section id="truth-gate" style={{ backgroundColor: "#FAFAFA" }}>
      <div className={`mx-auto max-w-2xl px-4 md:px-8 py-16 md:py-24 transition-all duration-500 rounded-xl ${glowing ? 'ring-2 ring-gold shadow-lg shadow-gold/20' : ''}`}>
        <p
          className="text-center mb-3"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: "#0099BB",
            letterSpacing: "0.1em",
          }}
        >
          {eyebrowLabels[Math.min(currentStep - 1, 4)]}
        </p>
        <div style={{ width: "100%", height: 4, backgroundColor: "#E5E7EB", borderRadius: 2, marginBottom: 32 }}>
          <motion.div
            style={{ height: 4, backgroundColor: "#C8952A", borderRadius: 2 }}
            animate={{ width: progressWidth }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>

        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #E5E7EB",
            borderRadius: 16,
            padding: "clamp(32px, 5vw, 40px)",
            boxShadow: "0 4px 24px rgba(15, 31, 53, 0.08)",
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
  color: "#6B7280",
  letterSpacing: "0.08em",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 48,
  border: "1.5px solid #E5E7EB",
  borderRadius: 8,
  padding: "0 16px",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 15,
  color: "#0F1F35",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  boxSizing: "border-box",
};

const errorTextStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 12,
  color: "#EF4444",
  marginTop: 4,
};

const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(200,149,42,0.12)";
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
      color: valid ? "#059669" : "#EF4444",
    }}
  >
    {valid ? "✓" : "✗"}
  </span>
);

export default TruthGateFlow;
