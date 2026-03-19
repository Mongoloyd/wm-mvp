import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addMinutes } from "date-fns";
import "@fontsource/dm-mono/500.css";

const scanTexts = ["Extracting line items...", "Checking county benchmarks...", "Scanning warranty language...", "Calculating fair-market delta..."];

const ScanPreview = () => {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [scanTextIdx, setScanTextIdx] = useState(0);

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>, t2: ReturnType<typeof setTimeout>, interval: ReturnType<typeof setInterval>;
    const runCycle = () => {
      setPhase(1); setScanTextIdx(0);
      t1 = setTimeout(() => {
        setPhase(2); let idx = 0;
        interval = setInterval(() => { idx = (idx + 1) % scanTexts.length; setScanTextIdx(idx); }, 500);
        t2 = setTimeout(() => { clearInterval(interval); setPhase(3); }, 2000);
      }, 1500);
    };
    runCycle();
    const loop = setInterval(runCycle, 5500);
    return () => { clearInterval(loop); clearTimeout(t1); clearTimeout(t2); clearInterval(interval); };
  }, []);

  return (
    <div className="mx-auto relative overflow-hidden" style={{ maxWidth: 480, background: "#111111", border: "1px solid #1A1A1A", borderRadius: 0, padding: "32px 28px", minHeight: 200 }}>
      <AnimatePresence mode="wait">
        {phase === 1 && (<motion.div key="p1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col items-center"><span style={{ fontSize: 64, lineHeight: 1 }}>📄</span><p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#E5E7EB", marginTop: 12 }}>Your quote.pdf</p></motion.div>)}
        {phase === 2 && (<motion.div key="p2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col items-center"><span style={{ fontSize: 64, lineHeight: 1 }}>📄</span><p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#2563EB", letterSpacing: "0.08em", marginTop: 16, minHeight: 18 }}>{scanTexts[scanTextIdx]}</p></motion.div>)}
        {phase === 3 && (<motion.div key="p3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col items-center"><div className="flex items-center gap-4"><motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }} className="flex items-center justify-center" style={{ width: 80, height: 80, borderRadius: 0, border: "3px solid #F97316", background: "rgba(249,115,22,0.08)" }}><span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 44, fontWeight: 900, color: "#F97316" }}>C</span></motion.div><div><p style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, color: "#F97316" }}>+$4,200</p><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#E5E7EB" }}>above fair market</p></div></div><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#2563EB", marginTop: 16 }}>⚡ 2 red flags identified</p></motion.div>)}
      </AnimatePresence>
    </div>
  );
};

const addFifteenMin = (time: string): string => { if (!time) return ""; const [h, m] = time.split(":").map(Number); const d = new Date(2000, 0, 1, h, m); return format(addMinutes(d, 15), "h:mm a"); };
const formatTime12 = (time: string): string => { if (!time) return ""; const [h, m] = time.split(":").map(Number); return format(new Date(2000, 0, 1, h, m), "h:mm a"); };
const formatDateDisplay = (dateStr: string): string => { if (!dateStr) return ""; return format(new Date(dateStr + "T12:00:00"), "EEEE, MMMM d, yyyy"); };

interface QuoteWatcherProps { onSwitchToFlowA?: () => void; onViewChecklist?: () => void; onReminderSet?: (date: string, time: string) => void; }

const QuoteWatcher = ({ onSwitchToFlowA, onViewChecklist, onReminderSet }: QuoteWatcherProps) => {
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const todayStr = new Date().toISOString().split("T")[0];
  const bothFilled = appointmentDate && appointmentTime;
  const reminderTime = addFifteenMin(appointmentTime);

  const handleSubmit = () => { if (!bothFilled) return; setSubmitted(true); onReminderSet?.(appointmentDate, appointmentTime); };

  return (
    <section id="quote-watcher" style={{ backgroundColor: "#0A0A0A" }}>
      <div className="mx-auto max-w-4xl px-4 pt-20 md:px-8 md:pt-28 text-center">
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#2563EB", letterSpacing: "0.1em", marginBottom: 20 }}>WHAT HAPPENS WHEN YOU UPLOAD YOUR QUOTE</p>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(32px, 4.5vw, 42px)", fontWeight: 800, letterSpacing: "0.02em", color: "#E5E5E5", marginBottom: 40, textTransform: "uppercase" }}>This is what will happen to your quote once you get it.</h2>
        <ScanPreview />
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-20 md:px-8 md:pb-28" style={{ marginTop: 48 }}>
        <div className="mx-auto" style={{ maxWidth: 500, background: "#111111", borderRadius: 0, border: "1px solid #1A1A1A", padding: "clamp(24px, 4vw, 40px) clamp(20px, 4vw, 36px)", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div key="form" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <div className="inline-flex items-center gap-2 mb-5" style={{ background: "rgba(37,99,235,0.1)", border: "1px solid #2563EB", borderRadius: 0, padding: "5px 14px" }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#2563EB" }}>SET YOUR QUOTE REMINDER</span>
                </div>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: "0.02em", color: "#E5E5E5", textTransform: "uppercase" }}>When is your contractor visiting?</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#E5E7EB", marginTop: 8, marginBottom: 28 }}>We'll text you 15 minutes after they leave.</p>
                <div className="mb-3">
                  <label style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#E5E7EB", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>APPOINTMENT DATE</label>
                  <input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} min={todayStr}
                    style={{ width: "100%", height: 48, border: "1.5px solid #1A1A1A", borderRadius: 0, padding: "0 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#E5E5E5", background: "#0A0A0A", outline: "none" }} />
                </div>
                <div className="mb-4">
                  <label style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#E5E7EB", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>APPROXIMATE APPOINTMENT TIME</label>
                  <input type="time" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)}
                    style={{ width: "100%", height: 48, border: "1.5px solid #1A1A1A", borderRadius: 0, padding: "0 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#E5E5E5", background: "#0A0A0A", outline: "none" }} />
                </div>
                <AnimatePresence>
                  {bothFilled && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="flex items-start gap-2.5 mb-4" style={{ background: "rgba(37,99,235,0.08)", borderRadius: 0, padding: "12px 16px" }}>
                      <span className="shrink-0" style={{ fontSize: 16, color: "#2563EB" }}>🔔</span>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#E5E5E5" }}>We'll send you an SMS at approximately {reminderTime} on {formatDateDisplay(appointmentDate)}.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.button whileHover={bothFilled ? { scale: 1.01 } : {}} whileTap={bothFilled ? { scale: 0.98 } : {}} onClick={handleSubmit} disabled={!bothFilled}
                  style={{ width: "100%", height: 52, borderRadius: 0, border: "none", background: bothFilled ? "#2563EB" : "#1A1A1A", color: "#FFFFFF", fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, cursor: bothFilled ? "pointer" : "not-allowed" }}>
                  Set My Quote Reminder →
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="text-center">
                <div className="mx-auto mb-5 flex items-center justify-center" style={{ width: 72, height: 72, borderRadius: 0, background: "rgba(37,99,235,0.08)", border: "2px solid #2563EB" }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M7 14l5 5 9-9" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 700, color: "#E5E5E5" }}>Reminder set. We'll be there.</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#E5E7EB", lineHeight: 1.75, marginTop: 12 }}>We'll text your mobile on {formatDateDisplay(appointmentDate)} at {reminderTime}.</p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onViewChecklist} className="mt-6 inline-block"
                  style={{ background: "#2563EB", color: "#FFFFFF", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, padding: "14px 28px", borderRadius: 0, border: "none", cursor: "pointer" }}>
                  View My Forensic Checklist →
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-16 md:pb-28 text-center" style={{ marginTop: 40 }}>
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: "0.02em", color: "#E5E5E5", textTransform: "uppercase" }}>Most homeowners decide whether to sign based on how the contractor made them feel.</p>
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: "0.02em", color: "#2563EB", marginTop: 12, textTransform: "uppercase" }}>You'll decide based on what the data says.</p>
        <button onClick={() => onSwitchToFlowA?.()} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#E5E7EB", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", marginTop: 16, display: "inline-block" }}>Already have a quote? Scan it now →</button>
      </div>
    </section>
  );
};

export default QuoteWatcher;
