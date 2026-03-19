import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePhoneInput } from "@/hooks/usePhoneInput";
import { isValidEmail, isValidName } from "@/utils/formatPhone";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import "@fontsource/dm-mono/500.css";

const priceData: Record<string, Record<string, [number, number]>> = {
  "Miami-Dade": { "1–5 windows": [5800, 7200], "6–10 windows": [10400, 12800], "11–20 windows": [18600, 22400], "20+ windows": [28000, 34000] },
  Broward: { "1–5 windows": [5400, 6800], "6–10 windows": [9800, 12200], "11–20 windows": [17200, 21000], "20+ windows": [26000, 31500] },
  "Palm Beach": { "1–5 windows": [6200, 7600], "6–10 windows": [11200, 13600], "11–20 windows": [19800, 24000], "20+ windows": [30000, 36000] },
  Other: { "1–5 windows": [5600, 7000], "6–10 windows": [10000, 12400], "11–20 windows": [18000, 21800], "20+ windows": [27000, 32500] },
};

const getRange = (county: string, windows: string): [number, number] => {
  const key = county === "Other Florida County" ? "Other" : county;
  return priceData[key]?.[windows] ?? [12400, 14800];
};

const parseWindowCount = (val: string): number | null => {
  if (val.includes("1–5")) return 5;
  if (val.includes("6–10")) return 10;
  if (val.includes("11–20")) return 20;
  if (val.includes("20+")) return 25;
  return null;
};

const stepLabels = ["Location", "Project Scope", "Window Type"];
const steps = [
  { question: "Which Florida county is your project in?", sub: "We have benchmark pricing data for all major Florida counties.", key: "county", options: ["Miami-Dade", "Broward", "Palm Beach", "Other Florida County"] },
  { question: "How many windows are you looking to replace?", sub: "Larger projects change the per-window benchmark significantly.", key: "windowCount", options: ["1–5 windows", "6–10 windows", "11–20 windows", "20+ windows"] },
  { question: "What type of windows are you replacing?", sub: "Impact vs. standard windows have very different market price ranges.", key: "windowType", options: ["🛡 Impact Windows (Hurricane)", "Standard Windows", "Impact + Doors", "Not sure yet"] },
];

type Step = 1 | 2 | 3 | "calc" | "gate" | "reveal";
const slideVariants = { enter: { x: 40, opacity: 0 }, center: { x: 0, opacity: 1 }, exit: { x: -40, opacity: 0 } };

const OptionButton = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
  <button onClick={onClick} style={{ background: selected ? "hsl(160 84% 39% / 0.12)" : "hsl(0 0% 7%)", border: `1px solid ${selected ? "hsl(160 84% 39%)" : "hsl(0 0% 15%)"}`, borderRadius: 0, padding: "18px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: selected ? "hsl(160 84% 39%)" : "hsl(0 0% 91%)", textAlign: "center", cursor: "pointer", transition: "all 0.15s ease", boxShadow: selected ? "0 0 0 3px hsla(160 84% 39% / 0.15)" : "none" }}
    onMouseEnter={(e) => { if (!selected) { e.currentTarget.style.borderColor = "hsl(160 84% 39%)"; e.currentTarget.style.background = "hsl(160 84% 39% / 0.12)"; e.currentTarget.style.color = "hsl(160 84% 39%)"; } }}
    onMouseLeave={(e) => { if (!selected) { e.currentTarget.style.borderColor = "hsl(0 0% 15%)"; e.currentTarget.style.background = "hsl(0 0% 7%)"; e.currentTarget.style.color = "hsl(0 0% 91%)"; } }}>
    {label}
  </button>
);

const useCounter = (target: number, duration: number, active: boolean) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) { setValue(0); return; }
    const start = performance.now();
    const step = (now: number) => { const t = Math.min((now - start) / duration, 1); setValue(Math.floor(t * target)); if (t < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }, [target, duration, active]);
  return value;
};

interface MarketBaselineToolProps {
  onLeadCaptured?: (answers: { county: string; windowCount: string; windowType: string }) => void;
  onBaselineRevealed?: () => void;
  onStepComplete?: (step: number, answer: string) => void;
  onChecklistClick?: () => void;
  onReminderClick?: () => void;
}

const MarketBaselineTool = ({ onLeadCaptured, onBaselineRevealed, onStepComplete, onChecklistClick, onReminderClick }: MarketBaselineToolProps) => {
  const [step, setStep] = useState<Step>(1);
  const [answers, setAnswers] = useState({ county: "", windowCount: "", windowType: "" });
  const [selected, setSelected] = useState("");
  const [form, setForm] = useState({ firstName: "", email: "", phone: "" });
  const [blurAmount, setBlurAmount] = useState(7);
  const [showOverlay, setShowOverlay] = useState(true);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [fieldStatus, setFieldStatus] = useState<Record<string, "untouched" | "valid" | "invalid">>({ firstName: "untouched", email: "untouched", phone: "untouched" });
  const [tcpaConsent, setTcpaConsent] = useState(false);
  const phoneInput = usePhoneInput();
  const calcCounterActive = step === "calc";
  const calcCount = useCounter(427, 800, calcCounterActive);

  const progressPercent = typeof step === "number" ? ((step - 1) / 3) * 100 + "%" : "100%";
  const priceRange = getRange(answers.county, answers.windowCount);
  const countyShort = answers.county === "Other Florida County" ? "FL" : answers.county;
  const avgOverage = Math.round((priceRange[1] - priceRange[0]) * 1.6);

  const handleOptionClick = useCallback((key: string, value: string) => {
    setSelected(value);
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);
    const stepNum = step as number;
    onStepComplete?.(stepNum, value);
    if (stepNum < 3) { setTimeout(() => { setSelected(""); setStep((stepNum + 1) as Step); }, 300); }
    else { setTimeout(() => { setStep("calc"); setTimeout(() => setStep("gate"), 800); }, 400); }
  }, [step, answers, onStepComplete]);

  const validateField = useCallback((field: string, value: string) => {
    switch (field) { case "firstName": return isValidName(value) ? "valid" : "invalid"; case "email": return isValidEmail(value) ? "valid" : "invalid"; case "phone": return phoneInput.isValid ? "valid" : "invalid"; default: return "untouched" as const; }
  }, [phoneInput.isValid]);

  const handleFieldBlur = useCallback((field: string, value: string) => {
    if (value.trim().length > 0) setFieldStatus(prev => ({ ...prev, [field]: validateField(field, value) }));
  }, [validateField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameValid = isValidName(form.firstName);
    const emailValid = isValidEmail(form.email);
    const phoneValid = phoneInput.isValid;
    setFieldStatus({ firstName: nameValid ? "valid" : "invalid", email: emailValid ? "valid" : "invalid", phone: phoneValid ? "valid" : "invalid" });
    if (!nameValid || !emailValid || !phoneValid || !tcpaConsent) return;

    setSubmitState("submitting");
    try {
      const sessionId = crypto.randomUUID();
      const { error } = await supabase.from('leads').insert({
        session_id: sessionId,
        first_name: form.firstName,
        email: form.email,
        phone_e164: phoneInput.e164,
        county: answers.county,
        project_type: answers.windowType,
        window_count: parseWindowCount(answers.windowCount),
        source: 'market-baseline',
      });
      if (error) throw error;

      setSubmitState("success");
      onLeadCaptured?.(answers);
      setShowOverlay(false);
      setTimeout(() => {
        const animStart = performance.now();
        const animBlur = (now: number) => {
          const t = Math.min((now - animStart) / 800, 1);
          setBlurAmount(7 * (1 - t));
          if (t < 1) requestAnimationFrame(animBlur);
          else { setStep("reveal"); onBaselineRevealed?.(); }
        };
        requestAnimationFrame(animBlur);
      }, 400);
    } catch (err) {
      console.error('Lead capture error:', err);
      setSubmitState("error");
    }
  };

  return (
    <section id="market-baseline" style={{ backgroundColor: "hsl(0 0% 4%)" }}>
      <div className="mx-auto max-w-2xl px-4 py-16 md:px-8 md:py-24">
        <p className="text-center mb-3" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "hsl(192 100% 37%)", letterSpacing: "0.1em" }}>FAIR-MARKET BASELINE GENERATOR</p>
        <h2 className="text-center" style={{ fontFamily: "'Jost', sans-serif", fontSize: "clamp(30px, 4vw, 38px)", fontWeight: 800, letterSpacing: "-0.02em", color: "hsl(0 0% 100%)", marginBottom: 10 }}>Don't Walk Into a Sales Pitch Unarmed.</h2>
        <p className="text-center" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "hsl(0 0% 91%)", lineHeight: 1.7, marginBottom: 8 }}>Generate your county-specific pricing baseline so you know the fair price before they even open their briefcase.</p>

        {step !== "reveal" && (
          <>
            <p className="text-center" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "hsl(220 9% 46%)", marginBottom: 32 }}>
              {typeof step === "number" ? `Step ${step} of 3 — ${stepLabels[step - 1]}` : step === "calc" ? "Calculating baseline…" : "Step 3 of 3 — Complete"}
            </p>
            <div style={{ height: 4, background: "hsl(0 0% 12%)", borderRadius: 2, marginBottom: 32, overflow: "hidden" }}>
              <motion.div style={{ height: "100%", background: "hsl(36 77% 47%)", borderRadius: 2 }} animate={{ width: progressPercent }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
            </div>
          </>
        )}

        <div style={{ background: "hsl(0 0% 7%)", border: "1px solid hsl(0 0% 10%)", borderRadius: 0, padding: "clamp(24px, 4vw, 40px)", boxShadow: "0 0 30px rgba(56, 182, 255, 0.1), 0 0 60px rgba(56, 182, 255, 0.05)", minHeight: 260, overflow: "hidden" }}>
          <AnimatePresence mode="wait">
            {typeof step === "number" && (
              <motion.div key={`step-${step}`} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <h3 style={{ fontFamily: "'Jost', sans-serif", fontSize: "clamp(26px, 3.5vw, 32px)", fontWeight: 800, letterSpacing: "-0.02em", color: "hsl(0 0% 100%)", marginBottom: 8 }}>{steps[step - 1].question}</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "hsl(220 9% 46%)", marginBottom: 28 }}>{steps[step - 1].sub}</p>
                <div className="grid grid-cols-2 gap-3">
                  {steps[step - 1].options.map((opt) => (<OptionButton key={opt} label={opt} selected={selected === opt} onClick={() => handleOptionClick(steps[step - 1].key, opt)} />))}
                </div>
              </motion.div>
            )}

            {step === "calc" && (
              <motion.div key="calc" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="flex flex-col items-center justify-center py-8" style={{ background: "hsl(192 100% 37% / 0.08)", borderRadius: 0, margin: -8, padding: 40 }}>
                <div className="mb-4" style={{ width: 48, height: 48, borderRadius: "50%", background: "hsl(192 100% 37%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M16.36 16.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M16.36 7.64l1.42-1.42" /></svg>
                  </motion.div>
                </div>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "hsl(192 100% 37%)", letterSpacing: "0.05em" }}>Searching {countyShort || "Florida"} County database…</p>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 24, fontWeight: 700, color: "hsl(192 100% 37%)", marginTop: 8 }}>{calcCount}</p>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "hsl(192 100% 37%)", marginTop: 4 }}>comparable projects found.</p>
              </motion.div>
            )}

            {step === "gate" && (
              <motion.div key="gate" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="inline-flex items-center gap-2 mb-5" style={{ background: "hsl(192 100% 37% / 0.08)", border: "1px solid hsl(192 100% 37%)", borderRadius: 0, padding: "5px 14px" }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "hsl(192 100% 37%)" }}>✓ BASELINE CALCULATED · {countyShort.toUpperCase()} COUNTY · 427 PROJECTS</span>
                </div>
                <h3 style={{ fontFamily: "'Jost', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: "hsl(0 0% 100%)", marginBottom: 4 }}>Your Baseline is Ready.</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "hsl(220 9% 46%)", marginBottom: 24 }}>"Get the data you need to negotiate like a pro. Unlock your price range and the Forensic Checklist now." — free.</p>

                <div className="relative overflow-hidden mb-6" style={{ background: "hsl(0 0% 7%)", borderRadius: 0, padding: "16px 20px" }}>
                  <div style={{ filter: `blur(${blurAmount}px)`, pointerEvents: "none" }}>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "hsl(220 9% 46%)", letterSpacing: "0.1em", marginBottom: 4 }}>FAIR MARKET RANGE · {countyShort.toUpperCase()} CO.</p>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 26, fontWeight: 900, color: "hsl(192 100% 37%)" }}>${priceRange[0].toLocaleString()} – ${priceRange[1].toLocaleString()}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "hsl(220 9% 46%)", marginTop: 4 }}>For {answers.windowCount} · {countyShort} County · Q1 2025</p>
                  </div>
                  {showOverlay && (
                    <motion.div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: "hsla(0 0% 4% / 0.8)" }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                      <span style={{ fontSize: 20 }}>🔒</span>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "hsl(0 0% 100%)", marginTop: 8 }}>Enter your details below to unlock</p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "hsl(220 9% 46%)" }}>Free · No contractor contact</p>
                    </motion.div>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <div>
                    <label style={formLabelStyle}>FIRST NAME</label>
                    <div style={{ position: "relative" }}>
                      <input type="text" autoComplete="given-name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v.target.value })} placeholder="Your first name" required
                        style={{ ...formInputStyle, borderColor: fieldStatus.firstName === "invalid" ? "#EF4444" : fieldStatus.firstName === "valid" ? "#059669" : "hsl(220 13% 91%)", paddingRight: fieldStatus.firstName !== "untouched" ? 40 : 16 }}
                        onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px hsla(160 84% 39% / 0.12)"; }}
                        onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; handleFieldBlur("firstName", form.firstName); }} />
                      {fieldStatus.firstName === "valid" && <MBValidationIcon valid />}
                      {fieldStatus.firstName === "invalid" && <MBValidationIcon valid={false} />}
                    </div>
                    {fieldStatus.firstName === "invalid" && <p style={formErrorStyle}>Please enter your first name (2+ characters)</p>}
                  </div>
                  <div>
                    <label style={formLabelStyle}>EMAIL <span style={{ color: "hsl(220 9% 64%)", fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "normal" }}>(your baseline + checklist sent here)</span></label>
                    <div style={{ position: "relative" }}>
                      <input type="email" autoComplete="email" value={form.email} onChange={(v) => setForm({ ...form, email: v.target.value })} placeholder="your@email.com" required
                        style={{ ...formInputStyle, borderColor: fieldStatus.email === "invalid" ? "#EF4444" : fieldStatus.email === "valid" ? "#059669" : "hsl(220 13% 91%)", paddingRight: fieldStatus.email !== "untouched" ? 40 : 16 }}
                        onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px hsla(160 84% 39% / 0.12)"; }}
                        onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; handleFieldBlur("email", form.email); }} />
                      {fieldStatus.email === "valid" && <MBValidationIcon valid />}
                      {fieldStatus.email === "invalid" && <MBValidationIcon valid={false} />}
                    </div>
                    {fieldStatus.email === "invalid" && <p style={formErrorStyle}>Please enter a valid email address</p>}
                  </div>
                  <div>
                    <label style={formLabelStyle}>MOBILE NUMBER <span style={{ color: "hsl(220 9% 64%)", fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "normal" }}>(for quote reminder when you're ready)</span></label>
                    <div style={{ position: "relative" }}>
                      <input type="tel" inputMode="numeric" autoComplete="tel" value={phoneInput.displayValue}
                        onChange={(e) => { phoneInput.handleChange(e); setForm({ ...form, phone: e.target.value }); }} placeholder="(555) 000-0000" required
                        style={{ ...formInputStyle, borderColor: fieldStatus.phone === "invalid" ? "#EF4444" : fieldStatus.phone === "valid" ? "#059669" : "hsl(220 13% 91%)", paddingRight: fieldStatus.phone !== "untouched" ? 40 : 16 }}
                        onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px hsla(160 84% 39% / 0.12)"; }}
                        onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; handleFieldBlur("phone", phoneInput.rawDigits); }} />
                      {fieldStatus.phone === "valid" && <MBValidationIcon valid />}
                      {fieldStatus.phone === "invalid" && <MBValidationIcon valid={false} />}
                    </div>
                    {fieldStatus.phone === "invalid" && <p style={formErrorStyle}>Please enter a valid 10-digit US phone number</p>}
                  </div>
                  <label className="flex items-start gap-2.5 cursor-pointer" style={{ marginTop: 4 }}>
                    <input type="checkbox" checked={tcpaConsent} onChange={(e) => setTcpaConsent(e.target.checked)} style={{ width: 16, height: 16, marginTop: 2, accentColor: "#059669", flexShrink: 0 }} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "hsl(220 9% 46%)", lineHeight: 1.5 }}>By providing your number, you consent to receive one call regarding your quote analysis.</span>
                  </label>
                  <motion.button type="submit" disabled={submitState === "submitting" || submitState === "success"}
                    whileHover={submitState === "idle" || submitState === "error" ? { scale: 1.01 } : {}} whileTap={submitState === "idle" || submitState === "error" ? { scale: 0.98 } : {}}
                    style={{ width: "100%", height: 54, background: submitState === "success" ? "#047857" : submitState === "error" ? "#DC2626" : "hsl(160 84% 39%)", color: "hsl(0 0% 100%)", fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 700, borderRadius: 0, border: "none", boxShadow: "0 4px 16px hsla(160 84% 39% / 0.35)", cursor: submitState === "submitting" ? "not-allowed" : "pointer", marginTop: 8, opacity: submitState === "submitting" ? 0.85 : 1, transition: "background 0.2s, opacity 0.2s" }}>
                    {submitState === "idle" && "Unlock My Baseline + Checklist →"}
                    {submitState === "submitting" && "Analyzing..."}
                    {submitState === "success" && (<span className="inline-flex items-center gap-2"><Check size={18} /> Unlocked!</span>)}
                    {submitState === "error" && "Something went wrong — Try Again"}
                  </motion.button>
                </form>
                <p className="text-center mt-3.5" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "hsl(220 9% 64%)", lineHeight: 1.8 }}>
                  You'll Receive Your Fair-Market Baseline and the Forensic Question Checklist Instantly.<br />When You Have a Quote, Return Here to Scan It.
                </p>
              </motion.div>
            )}

            {step === "reveal" && (
              <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <RevealedBaseline county={countyShort} windowCount={answers.windowCount} priceRange={priceRange} avgOverage={avgOverage} onChecklistClick={onChecklistClick} onReminderClick={onReminderClick} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

const formLabelStyle: React.CSSProperties = { fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9CA3AF", letterSpacing: "0.08em", display: "block", marginBottom: 5 };
const formInputStyle: React.CSSProperties = { width: "100%", height: 48, border: "1.5px solid #1A1A1A", borderRadius: 0, padding: "0 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#FFFFFF", background: "#0A0A0A", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box" };
const formErrorStyle: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#EF4444", marginTop: 4 };

const MBValidationIcon = ({ valid }: { valid: boolean }) => (
  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, lineHeight: 1, color: valid ? "#059669" : "#EF4444" }}>{valid ? "✓" : "✗"}</span>
);

const RevealedBaseline = ({ county, windowCount, priceRange, avgOverage, onChecklistClick, onReminderClick }: { county: string; windowCount: string; priceRange: [number, number]; avgOverage: number; onChecklistClick?: () => void; onReminderClick?: () => void }) => {
  const [displayLow, setDisplayLow] = useState(0);
  const [displayHigh, setDisplayHigh] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const dur = 1000;
    const step = (now: number) => { const t = Math.min((now - start) / dur, 1); const ease = 1 - Math.pow(1 - t, 3); setDisplayLow(Math.floor(ease * priceRange[0])); setDisplayHigh(Math.floor(ease * priceRange[1])); if (t < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }, [priceRange]);

  return (
    <div>
      <div style={{ background: "hsl(192 100% 37% / 0.08)", border: "1px solid hsl(192 100% 37%)", borderRadius: 0, padding: "24px 20px" }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "hsl(192 100% 37%)", letterSpacing: "0.1em", marginBottom: 8 }}>YOUR FAIR-MARKET BASELINE</p>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 32, fontWeight: 900, color: "hsl(192 100% 37%)" }}>${displayLow.toLocaleString()} – ${displayHigh.toLocaleString()}</p>
        <div className="flex flex-col gap-1 mt-3" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "hsl(0 0% 91%)" }}>
          <p>For {windowCount} in {county} County</p>
          <p>Based on 427 comparable projects · Q1 2025 data</p>
          <p style={{ fontStyle: "italic", color: "hsl(220 9% 46%)" }}>Any quote significantly above ${priceRange[1].toLocaleString()} should trigger a full audit.</p>
        </div>
        <div style={{ marginTop: 16, padding: "12px 16px", background: "hsl(0 0% 7%)", borderRadius: 0 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "hsl(0 72% 51%)" }}>⚠ The average quote in {county} County comes in ${avgOverage.toLocaleString()} above this range.</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "hsl(220 9% 46%)", marginTop: 4 }}>Now you'll know if yours does too.</p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-3 mt-6">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { onChecklistClick?.(); }}
          style={{ background: "hsl(36 77% 47%)", color: "hsl(0 0% 100%)", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, padding: "14px 24px", borderRadius: 0, border: "none", cursor: "pointer" }}>
          View My Forensic Checklist →
        </motion.button>
        <button onClick={onReminderClick} style={{ background: "hsl(0 0% 7%)", border: "1px solid hsl(0 0% 10%)", color: "hsl(0 0% 91%)", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: "12px 20px", borderRadius: 0, cursor: "pointer" }}>
          Set My Quote Reminder →
        </button>
      </div>
    </div>
  );
};

export default MarketBaselineTool;
