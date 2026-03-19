import { useState } from "react";
import { motion } from "framer-motion";
import "@fontsource/dm-mono/500.css";

// Keep existing questions array with modifications as specified.
const questions = [
  { id: 1, severity: "critical" as const, question: "Is the window brand, product line, and series specified by name in the contract?", label: "⚑ CRITICAL — MOST COMMONLY MISSED", labelColor: "#F97316", circleBg: "rgba(249,115,22,0.08)", circleBorder: "#F97316", why: `"Impact windows" is not a brand. PGT WinGuard Series 500, SGT Impact Plus, or Lawson LP Impact are brands. If your contract says only "impact windows," your contractor can legally install any brand at any quality level — and charge premium prices for a budget product.`, askLabel: "SAY EXACTLY THIS:", askColor: "#F97316", askBorder: "#F97316", askText: `"What specific brand, product line, and series of window will you be installing? I need that language in the contract before I sign."` },
  { id: 2, severity: "critical" as const, question: "Does the labor warranty period match the manufacturer's product warranty?", label: "⚑ HIGH RISK — FINANCIAL EXPOSURE", labelColor: "#F97316", circleBg: "rgba(249,115,22,0.08)", circleBorder: "#F97316", why: `Many contractors offer a 1-year labor warranty on windows that carry a 10-year or lifetime manufacturer warranty. Industry standard is a minimum 3-year labor warranty.`, askLabel: "SAY EXACTLY THIS:", askColor: "#F97316", askBorder: "#F97316", askText: `"What is your labor warranty period for this installation? And does it remain valid if I file a manufacturer warranty claim?"` },
  { id: 3, severity: "important" as const, question: "Are permit fees listed as a separate line item, or 'included' in the total price?", label: "⚡ IMPORTANT — LEVERAGE POINT", labelColor: "#2563EB", circleBg: "rgba(37,99,235,0.08)", circleBorder: "#2563EB", why: `The word "included" is one of the most expensive words in a window contract. Permit costs should always be a line item with a real dollar amount.`, askLabel: "SAY EXACTLY THIS:", askColor: "#2563EB", askBorder: "#2563EB", askText: `"Can you show me the permit fee as a separate line item with a dollar amount?"` },
  { id: 4, severity: "important" as const, question: "What is the NOA (Notice of Acceptance) number for the specific windows being installed?", label: "⚡ IMPORTANT — LEVERAGE POINT", labelColor: "#2563EB", circleBg: "rgba(37,99,235,0.08)", circleBorder: "#2563EB", why: `Every legitimate impact window has a NOA. If your contractor cannot provide it, they may be installing a product that doesn't meet Florida Building Code.`, askLabel: "SAY EXACTLY THIS:", askColor: "#2563EB", askBorder: "#2563EB", askText: `"What is the Miami-Dade NOA number for the windows you're installing?"` },
  { id: 5, severity: "technical" as const, question: "Is the installation method specified — buck frame, fin, or flush installation?", label: "◎ TECHNICAL — QUALITY ASSURANCE", labelColor: "#2563EB", circleBg: "rgba(37,99,235,0.08)", circleBorder: "#2563EB", why: `If the method isn't specified, you don't know what you're getting. Contractors who don't specify it are protecting their flexibility, not your home.`, askLabel: "SAY EXACTLY THIS:", askColor: "#2563EB", askBorder: "#2563EB", askText: `"Is this a fin installation, buck frame, or full frame replacement? Can you add the installation method to the contract language?"` },
];

interface ForensicChecklistProps { onUploadQuote?: () => void; onSetReminder?: () => void; }

const ForensicChecklist = ({ onUploadQuote, onSetReminder }: ForensicChecklistProps) => {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const toggleCheck = (id: number) => setChecked({ ...checked, [id]: !checked[id] });

  return (
    <section id="forensic-checklist" style={{ backgroundColor: "#0A0A0A", borderTop: "1px solid #1A1A1A" }}>
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-8 md:py-24">
        <div className="relative overflow-hidden" style={{ background: "#111111", border: "1px solid #1A1A1A", borderRadius: 0, boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none" style={{ zIndex: 0 }}>
            <div style={{ transform: "rotate(-35deg)", opacity: 0.03, fontFamily: "'DM Mono', monospace", fontSize: 24, color: "#E5E5E5", whiteSpace: "nowrap", lineHeight: 2.5 }}>
              {Array.from({ length: 12 }).map((_, i) => (<div key={i}>WINDOWMAN FORENSIC &nbsp;&nbsp;&nbsp; WINDOWMAN FORENSIC &nbsp;&nbsp;&nbsp; WINDOWMAN FORENSIC</div>))}
            </div>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ background: "#0A0A0A", padding: "18px 28px", borderBottom: "1px solid #1A1A1A" }}>
            <div className="shrink-0"><p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#F97316", fontWeight: 700, letterSpacing: "0.15em" }}>WINDOWMAN.PRO</p><p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#6B7280" }}>Forensic Intelligence Division</p></div>
            <div className="text-left sm:text-center flex-1"><p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#E5E5E5", fontWeight: 700 }}>HOMEOWNER'S FORENSIC CHECKLIST</p><p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#6B7280" }}>Pre-Quote Site Visit Edition</p></div>
            <div className="shrink-0"><div style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 0, padding: "5px 10px" }}><p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#F97316", fontWeight: 700, letterSpacing: "0.08em" }}>CONFIDENTIAL</p></div></div>
          </div>

          <div className="relative z-10 flex gap-4 items-start" style={{ padding: "28px 28px 20px", borderBottom: "1px solid #1A1A1A" }}>
            <div>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: "#E5E5E5", textTransform: "uppercase" }}>5 Questions Contractors Hope You Never Ask</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#E5E7EB", lineHeight: 1.75, marginTop: 6 }}>These questions expose the information asymmetry in every impact window sales pitch. Bring this checklist to your site visit.</p>
            </div>
          </div>

          <div className="relative z-10" style={{ padding: "0 28px" }}>
            {questions.map((q) => (
              <div key={q.id} style={{ padding: "24px 0", borderBottom: "1px solid #1A1A1A" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 0, background: q.circleBg, border: `1.5px solid ${q.circleBorder}` }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 900, color: q.circleBorder }}>{q.id}</span>
                    </div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#E5E5E5", lineHeight: 1.4, paddingTop: 4 }}>{q.question}</p>
                  </div>
                  <button onClick={() => toggleCheck(q.id)} className="shrink-0"
                    style={{ width: 24, height: 24, borderRadius: 0, border: `2px solid ${checked[q.id] ? "#2563EB" : "#1A1A1A"}`, background: checked[q.id] ? "#2563EB" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease", marginTop: 4 }}>
                    {checked[q.id] && (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>)}
                  </button>
                </div>
                <div style={{ marginTop: 12, background: "#0A0A0A", borderRadius: 0, padding: "14px 16px" }}>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: q.labelColor, marginBottom: 8 }}>{q.label}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#E5E7EB", lineHeight: 1.7 }}>{q.why}</p>
                </div>
                <div style={{ marginTop: 12, background: "#111111", borderLeft: `3px solid ${q.askBorder}`, borderRadius: 0, padding: "10px 14px" }}>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: q.askColor, letterSpacing: "0.08em", marginBottom: 4 }}>{q.askLabel}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#E5E5E5", fontStyle: "italic", fontWeight: 500, lineHeight: 1.6 }}>{q.askText}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative z-10" style={{ padding: "24px 28px", borderTop: "1px solid #1A1A1A", background: "#0A0A0A" }}>
            <div className="flex items-center gap-3 mb-3">
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#E5E7EB" }}>{checkedCount} of 5 reviewed</p>
              <div className="flex-1" style={{ height: 4, background: "#1A1A1A", borderRadius: 0, overflow: "hidden" }}>
                <motion.div style={{ height: "100%", background: "#2563EB", borderRadius: 0 }} animate={{ width: `${(checkedCount / 5) * 100}%` }} transition={{ duration: 0.15 }} />
              </div>
            </div>
            {checkedCount === 5 && (
              <>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "#2563EB" }}>✓ All 5 confirmed. Upload your final contract for a full AI grade before you sign.</p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onUploadQuote?.()} className="mt-3"
                  style={{ background: "#2563EB", color: "#FFFFFF", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, padding: "14px 28px", borderRadius: 0, border: "none", cursor: "pointer" }}>
                  Upload My Quote for a Full Grade →
                </motion.button>
              </>
            )}
            <button onClick={() => { window.print(); }} className="mt-4" style={{ background: "#111111", border: "1px solid #1A1A1A", borderRadius: 0, padding: "12px 24px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "#E5E5E5", cursor: "pointer", display: "block" }}>
              ⬇ Save Checklist as PDF
            </button>
          </div>
        </div>

        <div className="text-center" style={{ background: "#111111", border: "1px solid #1A1A1A", padding: "40px 28px", borderRadius: 0, marginTop: 32 }}>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: "0.02em", color: "#E5E5E5", textTransform: "uppercase" }}>Now set the reminder.</h3>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#E5E7EB", marginTop: 8 }}>When is your contractor visiting? We'll text you 15 minutes after they leave.</p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onSetReminder} className="mt-5 inline-block"
            style={{ background: "#2563EB", color: "#FFFFFF", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, padding: "14px 32px", borderRadius: 0, border: "none", boxShadow: "0 4px 14px rgba(37,99,235,0.35)", cursor: "pointer" }}>
            Set My Quote Reminder →
          </motion.button>
        </div>
      </div>
    </section>
  );
};

export default ForensicChecklist;
