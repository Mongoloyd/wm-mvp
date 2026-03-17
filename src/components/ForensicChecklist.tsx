import { useState } from "react";
import { motion } from "framer-motion";
import "@fontsource/dm-mono/500.css";

const questions = [
  { id: 1, severity: "critical" as const, question: "Is the window brand, product line, and series specified by name in the contract?", label: "⚑ CRITICAL — MOST COMMONLY MISSED", labelColor: "hsl(0 72% 51%)", circleBg: "hsl(0 93% 97%)", circleBorder: "hsl(0 72% 51%)", why: `"Impact windows" is not a brand. PGT WinGuard Series 500, SGT Impact Plus, or Lawson LP Impact are brands. If your contract says only "impact windows," your contractor can legally install any brand at any quality level — and charge premium prices for a budget product.`, askLabel: "SAY EXACTLY THIS:", askColor: "hsl(0 72% 51%)", askBorder: "hsl(0 72% 51%)", askText: `"What specific brand, product line, and series of window will you be installing? I need that language in the contract before I sign."` },
  { id: 2, severity: "critical" as const, question: "Does the labor warranty period match the manufacturer's product warranty?", label: "⚑ HIGH RISK — FINANCIAL EXPOSURE", labelColor: "hsl(0 72% 51%)", circleBg: "hsl(0 93% 97%)", circleBorder: "hsl(0 72% 51%)", why: `Many contractors offer a 1-year labor warranty on windows that carry a 10-year or lifetime manufacturer warranty. Industry standard is a minimum 3-year labor warranty.`, askLabel: "SAY EXACTLY THIS:", askColor: "hsl(0 72% 51%)", askBorder: "hsl(0 72% 51%)", askText: `"What is your labor warranty period for this installation? And does it remain valid if I file a manufacturer warranty claim?"` },
  { id: 3, severity: "important" as const, question: "Are permit fees listed as a separate line item, or 'included' in the total price?", label: "⚡ IMPORTANT — LEVERAGE POINT", labelColor: "hsl(40 96% 40%)", circleBg: "hsl(48 96% 95%)", circleBorder: "hsl(45 93% 47%)", why: `The word "included" is one of the most expensive words in a window contract. Permit costs should always be a line item with a real dollar amount.`, askLabel: "SAY EXACTLY THIS:", askColor: "hsl(40 96% 40%)", askBorder: "hsl(45 93% 47%)", askText: `"Can you show me the permit fee as a separate line item with a dollar amount?"` },
  { id: 4, severity: "important" as const, question: "What is the NOA (Notice of Acceptance) number for the specific windows being installed?", label: "⚡ IMPORTANT — LEVERAGE POINT", labelColor: "hsl(40 96% 40%)", circleBg: "hsl(48 96% 95%)", circleBorder: "hsl(45 93% 47%)", why: `Every legitimate impact window has a NOA. If your contractor cannot provide it, they may be installing a product that doesn't meet Florida Building Code.`, askLabel: "SAY EXACTLY THIS:", askColor: "hsl(40 96% 40%)", askBorder: "hsl(45 93% 47%)", askText: `"What is the Miami-Dade NOA number for the windows you're installing?"` },
  { id: 5, severity: "technical" as const, question: "Is the installation method specified — buck frame, fin, or flush installation?", label: "◎ TECHNICAL — QUALITY ASSURANCE", labelColor: "hsl(192 100% 37%)", circleBg: "hsl(192 76% 94%)", circleBorder: "hsl(192 100% 37%)", why: `If the method isn't specified, you don't know what you're getting. Contractors who don't specify it are protecting their flexibility, not your home.`, askLabel: "SAY EXACTLY THIS:", askColor: "hsl(192 100% 37%)", askBorder: "hsl(192 100% 37%)", askText: `"Is this a fin installation, buck frame, or full frame replacement? Can you add the installation method to the contract language?"` },
];

interface ForensicChecklistProps { onUploadQuote?: () => void; onSetReminder?: () => void; }

const ForensicChecklist = ({ onUploadQuote, onSetReminder }: ForensicChecklistProps) => {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const checkedCount = Object.values(checked).filter(Boolean).length;

  const toggleCheck = (id: number) => {
    const newChecked = { ...checked, [id]: !checked[id] };
    setChecked(newChecked);
  };

  return (
    <section id="forensic-checklist" style={{ backgroundColor: "hsl(210 17% 98%)", borderTop: "1px solid hsl(220 13% 91%)" }}>
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-8 md:py-24">
        <div className="relative overflow-hidden" style={{ background: "hsl(0 0% 100%)", border: "1.5px solid hsl(220 13% 91%)", borderRadius: 16, boxShadow: "0 4px 24px hsla(213 57% 14% / 0.10)" }}>
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none" style={{ zIndex: 0 }}>
            <div style={{ transform: "rotate(-35deg)", opacity: 0.03, fontFamily: "'DM Mono', monospace", fontSize: 24, color: "hsl(213 57% 14%)", whiteSpace: "nowrap", lineHeight: 2.5 }}>
              {Array.from({ length: 12 }).map((_, i) => (<div key={i}>WINDOWMAN FORENSIC &nbsp;&nbsp;&nbsp; WINDOWMAN FORENSIC &nbsp;&nbsp;&nbsp; WINDOWMAN FORENSIC</div>))}
            </div>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ background: "hsl(213 57% 14%)", padding: "18px 28px" }}>
            <div className="shrink-0"><p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "hsl(36 77% 47%)", fontWeight: 700, letterSpacing: "0.15em" }}>WINDOWMAN.PRO</p><p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "hsl(220 9% 46%)" }}>Forensic Intelligence Division</p></div>
            <div className="text-left sm:text-center flex-1"><p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "hsl(0 0% 100%)", fontWeight: 700 }}>HOMEOWNER'S FORENSIC CHECKLIST</p><p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "hsl(220 9% 46%)" }}>Pre-Quote Site Visit Edition</p></div>
            <div className="shrink-0"><div style={{ background: "hsla(0 72% 51% / 0.15)", border: "1px solid hsla(0 72% 51% / 0.3)", borderRadius: 6, padding: "5px 10px" }}><p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "hsl(0 72% 51%)", fontWeight: 700, letterSpacing: "0.08em" }}>CONFIDENTIAL</p></div></div>
          </div>

          <div className="relative z-10 flex gap-4 items-start" style={{ padding: "28px 28px 20px", borderBottom: "1px solid hsl(220 13% 91%)" }}>
            <div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 700, color: "hsl(213 57% 14%)" }}>5 Questions Contractors Hope You Never Ask</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "hsl(220 9% 30%)", lineHeight: 1.75, marginTop: 6 }}>These questions expose the information asymmetry in every impact window sales pitch. Bring this checklist to your site visit.</p>
            </div>
          </div>

          <div className="relative z-10" style={{ padding: "0 28px" }}>
            {questions.map((q) => (
              <div key={q.id} style={{ padding: "24px 0", borderBottom: "1px solid hsl(210 20% 97%)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "50%", background: q.circleBg, border: `1.5px solid ${q.circleBorder}` }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 900, color: q.circleBorder }}>{q.id}</span>
                    </div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "hsl(213 57% 14%)", lineHeight: 1.4, paddingTop: 4 }}>{q.question}</p>
                  </div>
                  <button onClick={() => toggleCheck(q.id)} className="shrink-0"
                    style={{ width: 24, height: 24, borderRadius: 4, border: `2px solid ${checked[q.id] ? "hsl(160 84% 39%)" : "hsl(220 13% 83%)"}`, background: checked[q.id] ? "hsl(160 84% 39%)" : "hsl(0 0% 100%)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease", marginTop: 4 }}>
                    {checked[q.id] && (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>)}
                  </button>
                </div>
                <div style={{ marginTop: 12, background: "hsl(210 20% 98%)", borderRadius: 8, padding: "14px 16px" }}>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: q.labelColor, marginBottom: 8 }}>{q.label}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "hsl(220 9% 30%)", lineHeight: 1.7 }}>{q.why}</p>
                </div>
                <div style={{ marginTop: 12, background: "hsl(0 0% 100%)", borderLeft: `3px solid ${q.askBorder}`, borderRadius: 4, padding: "10px 14px" }}>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: q.askColor, letterSpacing: "0.08em", marginBottom: 4 }}>{q.askLabel}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "hsl(213 57% 14%)", fontStyle: "italic", fontWeight: 500, lineHeight: 1.6 }}>{q.askText}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative z-10" style={{ padding: "24px 28px", borderTop: "1px solid hsl(220 13% 91%)", background: "hsl(210 20% 98%)" }}>
            <div className="flex items-center gap-3 mb-3">
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "hsl(220 9% 46%)" }}>{checkedCount} of 5 reviewed</p>
              <div className="flex-1" style={{ height: 4, background: "hsl(220 13% 91%)", borderRadius: 2, overflow: "hidden" }}>
                <motion.div style={{ height: "100%", background: "hsl(160 84% 39%)", borderRadius: 2 }} animate={{ width: `${(checkedCount / 5) * 100}%` }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
              </div>
            </div>
            {checkedCount === 5 && (
              <>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "hsl(160 84% 39%)" }}>✓ All 5 confirmed. Upload your final contract for a full AI grade before you sign.</p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onUploadQuote?.()} className="mt-3"
                  style={{ background: "hsl(36 77% 47%)", color: "hsl(0 0% 100%)", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, padding: "14px 28px", borderRadius: 8, border: "none", cursor: "pointer" }}>
                  Upload My Quote for a Full Grade →
                </motion.button>
              </>
            )}
            <button onClick={() => { window.print(); }} className="mt-4" style={{ background: "hsl(0 0% 100%)", border: "1.5px solid hsl(220 13% 91%)", borderRadius: 8, padding: "12px 24px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "hsl(220 9% 30%)", cursor: "pointer", display: "block" }}>
              ⬇ Save Checklist as PDF
            </button>
          </div>
        </div>

        <div className="text-center" style={{ background: "hsl(0 0% 100%)", padding: "40px 28px", borderRadius: 16, marginTop: 32 }}>
          <h3 style={{ fontFamily: "'Jost', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: "hsl(213 57% 14%)" }}>Now set the reminder.</h3>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "hsl(220 9% 30%)", marginTop: 8 }}>When is your contractor visiting? We'll text you 15 minutes after they leave.</p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onSetReminder} className="mt-5 inline-block"
            style={{ background: "hsl(36 77% 47%)", color: "hsl(0 0% 100%)", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, padding: "14px 32px", borderRadius: 10, border: "none", boxShadow: "0 4px 14px hsla(36 77% 47% / 0.35)", cursor: "pointer" }}>
            Set My Quote Reminder →
          </motion.button>
        </div>
      </div>
    </section>
  );
};

export default ForensicChecklist;
