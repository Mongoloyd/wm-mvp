
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { INITIAL_ANSWERS, getRoutingTier, getOutcomeContent } from "../../lib/qualificationLogic.js";
import { PAGE_CONFIG } from "../../config/page.config.js";
import CalendlyEmbed from "../ui/CalendlyEmbed.jsx";
import StepCard from "./StepCard.jsx";
import OptionButton from "./OptionButton.jsx";

export default function QualificationFlow({ isOpen, onClose, onQualified, onDisqualified }) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState(INITIAL_ANSWERS);
  const [tier, setTier] = useState(null);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) { document.body.style.overflow = "hidden"; } else { document.body.style.overflow = ""; }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape" && isOpen) onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (step === 5) {
      const timer = setTimeout(() => {
        const computedTier = getRoutingTier(answers);
        setTier(computedTier);
        if (computedTier === "HIGH" || computedTier === "MID") { onQualified?.(computedTier, answers); }
        else { onDisqualified?.(computedTier, answers); }
        setStep("outcome");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, answers, onQualified, onDisqualified]);

  if (!isOpen) return null;

  const handleBack = (prevStep) => { setDirection(-1); setStep(prevStep); };
  const handleNext = (nextStep) => { setDirection(1); setStep(nextStep); };
  const resetFlow = () => { setDirection(-1); setStep(1); setTier(null); setAnswers(INITIAL_ANSWERS); setEmail(""); setEmailSubmitted(false); };
  const handleEmailSubmit = (e) => { e.preventDefault(); if (email.trim()) { setEmailSubmitted(true); } };

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <StepCard step={1} totalSteps={4}>
            <h2 className="mb-6 text-2xl font-bold text-white">Quick check before we show you access</h2>
            <p className="mb-4 text-sm font-medium text-white/60">Are you currently installing windows or doors?</p>
            <div className="flex flex-col gap-3">
              <OptionButton label="Yes — we install regularly" selected={answers.installVolume === "regular"} onClick={() => { setAnswers({ ...answers, installVolume: "regular" }); handleNext(2); }} />
              <OptionButton label="Yes — smaller volume" selected={answers.installVolume === "small"} onClick={() => { setAnswers({ ...answers, installVolume: "small" }); handleNext(2); }} />
              <OptionButton label="No — just exploring" selected={answers.installVolume === "exploring"} onClick={() => { setAnswers({ ...answers, installVolume: "exploring" }); handleNext(2); }} />
            </div>
          </StepCard>
        );
      case 2:
        const canContinue2 = answers.serviceArea.trim() !== "" && answers.jobSize !== null;
        return (
          <StepCard step={2} totalSteps={4}>
            <h2 className="mb-6 text-2xl font-bold text-white">Your market & jobs</h2>
            <div className="mb-6 flex flex-col gap-2">
              <label className="text-sm font-medium text-white/60">City or county you serve</label>
              <input type="text" value={answers.serviceArea} onChange={(e) => setAnswers({ ...answers, serviceArea: e.target.value })} placeholder="e.g. Seattle Metro"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none focus:ring-0" />
            </div>
            <div className="mb-8 flex flex-col gap-2">
              <label className="text-sm font-medium text-white/60">Average Job Size</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <OptionButton label="Under $8k" selected={answers.jobSize === "under8k"} onClick={() => setAnswers({ ...answers, jobSize: "under8k" })} />
                <OptionButton label="$8k – $15k" selected={answers.jobSize === "8to15k"} onClick={() => setAnswers({ ...answers, jobSize: "8to15k" })} />
                <OptionButton label="$15k – $25k" selected={answers.jobSize === "15to25k"} onClick={() => setAnswers({ ...answers, jobSize: "15to25k" })} />
                <OptionButton label="$25k+" selected={answers.jobSize === "25plus"} onClick={() => setAnswers({ ...answers, jobSize: "25plus" })} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => handleBack(1)} className="text-sm font-medium text-white/50 hover:text-white">Back</button>
              <button onClick={() => handleNext(3)} disabled={!canContinue2} className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black disabled:opacity-50">Continue</button>
            </div>
          </StepCard>
        );
      case 3:
        const canContinue3 = answers.responseSpeed !== null && answers.followUpBehavior !== null;
        return (
          <StepCard step={3} totalSteps={4}>
            <h2 className="mb-6 text-2xl font-bold text-white">How you handle opportunities</h2>
            <div className="mb-6 flex flex-col gap-2">
              <label className="text-sm font-medium text-white/60">How quickly can you call a new lead?</label>
              <div className="flex flex-col gap-3">
                <OptionButton label="Under 15 minutes" selected={answers.responseSpeed === "under15min"} onClick={() => setAnswers({ ...answers, responseSpeed: "under15min" })} />
                <OptionButton label="Within a few hours" selected={answers.responseSpeed === "fewhours"} onClick={() => setAnswers({ ...answers, responseSpeed: "fewhours" })} />
                <OptionButton label="Same day" selected={answers.responseSpeed === "sameday"} onClick={() => setAnswers({ ...answers, responseSpeed: "sameday" })} />
                <OptionButton label="Next day or later" selected={answers.responseSpeed === "nextday"} onClick={() => setAnswers({ ...answers, responseSpeed: "nextday" })} />
              </div>
            </div>
            <div className="mb-8 flex flex-col gap-2">
              <label className="text-sm font-medium text-white/60">Do you actively follow up?</label>
              <div className="flex flex-col gap-3">
                <OptionButton label="Yes, consistent follow up" selected={answers.followUpBehavior === "consistent"} onClick={() => setAnswers({ ...answers, followUpBehavior: "consistent" })} />
                <OptionButton label="Sometimes" selected={answers.followUpBehavior === "sometimes"} onClick={() => setAnswers({ ...answers, followUpBehavior: "sometimes" })} />
                <OptionButton label="Rarely, we rely on them calling back" selected={answers.followUpBehavior === "rarely"} onClick={() => setAnswers({ ...answers, followUpBehavior: "rarely" })} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => handleBack(2)} className="text-sm font-medium text-white/50 hover:text-white">Back</button>
              <button onClick={() => handleNext(4)} disabled={!canContinue3} className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black disabled:opacity-50">Continue</button>
            </div>
          </StepCard>
        );
      case 4:
        return (
          <StepCard step={4} totalSteps={4}>
            <h2 className="mb-4 text-2xl font-bold text-white">This is different from normal lead gen</h2>
            <ul className="mb-8 flex flex-col gap-3 text-sm text-white/70">
              <li className="flex gap-3"><span className="text-white/40">•</span> You will get fewer opportunities than typical sources</li>
              <li className="flex gap-3"><span className="text-white/40">•</span> Each buyer already has quotes from competing contractors</li>
              <li className="flex gap-3"><span className="text-white/40">•</span> They are closer to deciding — not at the top of the funnel</li>
            </ul>
            <div className="mb-4 flex flex-col gap-2">
              <label className="mb-2 text-sm font-medium text-white/60">Does this align with what you're looking for?</label>
              <div className="flex flex-col gap-3">
                <OptionButton label="Yes — I want quality over volume" selected={answers.expectationAlignment === "quality"} onClick={() => { setAnswers({ ...answers, expectationAlignment: "quality" }); handleNext(5); }} />
                <OptionButton label="Not sure yet" selected={answers.expectationAlignment === "unsure"} onClick={() => { setAnswers({ ...answers, expectationAlignment: "unsure" }); handleNext(5); }} />
                <OptionButton label="No — I need volume" selected={answers.expectationAlignment === "volume"} onClick={() => { setAnswers({ ...answers, expectationAlignment: "volume" }); handleNext(5); }} />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button onClick={() => handleBack(3)} className="text-sm font-medium text-white/50 hover:text-white">Back</button>
            </div>
          </StepCard>
        );
      case 5:
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-6 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-white" />
            <h2 className="text-xl font-bold text-white">Checking territory availability...</h2>
            <p className="mt-2 text-sm text-white/60">Scoring responses and verifying service area.</p>
          </div>
        );
      case "outcome":
        const content = getOutcomeContent(tier);
        return (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111111] shadow-2xl">
            <div className="flex flex-col items-center justify-center border-b border-white/[0.08] bg-white/[0.02] p-8 text-center">
              <h2 className="mb-3 text-2xl font-bold text-white">{content.headline}</h2>
              <p className="text-base text-white/60">{content.subhead}</p>
            </div>
            <div className="p-8">
              {content.bullets && (
                <ul className="mb-8 flex flex-col gap-3">
                  {content.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-white/80">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs text-white">✓</span>{bullet}
                    </li>
                  ))}
                </ul>
              )}
              {content.showCalendly && (
                <div className="mb-6">
                  <CalendlyEmbed url={PAGE_CONFIG.calendly.url} height={400} />
                  {content.note && <p className="mt-4 text-center text-sm text-white/50">{content.note}</p>}
                </div>
              )}
              {content.showPhone && (
                <div className="flex flex-col items-center justify-center rounded-xl bg-white/[0.03] p-4">
                  <span className="mb-1 text-xs uppercase tracking-widest text-white/40">Or Call Directly</span>
                  <a href={PAGE_CONFIG.phone.href} className="text-lg font-bold text-white hover:text-white/80">{PAGE_CONFIG.phone.display}</a>
                </div>
              )}
              {content.showEmailCapture && !emailSubmitted && (
                <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-white/60">Email</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email"
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none" />
                  </div>
                  <button type="submit" className="w-full rounded-full bg-white py-3 text-sm font-bold text-black transition-colors hover:bg-white/90">{content.ctaLabel}</button>
                </form>
              )}
              {content.showEmailCapture && emailSubmitted && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
                  <p className="text-sm font-medium text-emerald-400">Got it. We'll be in touch if things change.</p>
                </div>
              )}
              {content.showClose && !content.showEmailCapture && (
                <button onClick={onClose} className="w-full rounded-full bg-white/10 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20">Close Window</button>
              )}
              <div className="mt-8 flex justify-center">
                <button onClick={resetFlow} className="text-xs text-white/40 hover:text-white/80 transition-colors">Start Over</button>
              </div>
            </div>
          </motion.div>
        );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex w-full max-w-lg items-center justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={step} custom={direction}
            variants={step !== "outcome" && step !== 5 ? variants : {}}
            initial={step !== "outcome" && step !== 5 ? "enter" : false}
            animate={step !== "outcome" && step !== 5 ? "center" : false}
            exit={step !== "outcome" && step !== 5 ? "exit" : false}
            transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full">
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}