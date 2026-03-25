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
    <div className="mx-auto relative overflow-hidden glass-card-strong shadow-xl" style={{ maxWidth: 480, padding: "32px 28px", minHeight: 200 }}>
      <AnimatePresence mode="wait">
        {phase === 1 && (<motion.div key="p1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col items-center"><span style={{ fontSize: 64, lineHeight: 1 }}>📄</span><p className="font-mono text-[13px] text-foreground mt-3">Your quote.pdf</p></motion.div>)}
        {phase === 2 && (<motion.div key="p2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col items-center"><span style={{ fontSize: 64, lineHeight: 1 }}>📄</span><p className="font-mono text-[11px] text-primary tracking-wider mt-4 min-h-[18px]">{scanTexts[scanTextIdx]}</p></motion.div>)}
        {phase === 3 && (<motion.div key="p3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col items-center"><div className="flex items-center gap-4"><motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }} className="flex items-center justify-center w-20 h-20 rounded-xl" style={{ border: "3px solid #F97316", background: "rgba(249,115,22,0.08)" }}><span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 44, fontWeight: 900, color: "#F97316" }}>C</span></motion.div><div><p className="font-mono text-[14px] font-bold text-wm-orange">+$4,200</p><p className="font-body text-xs text-muted-foreground">above fair market</p></div></div><p className="font-body text-[13px] font-semibold text-primary mt-4">⚡ 2 red flags identified</p></motion.div>)}
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
    <section id="quote-watcher" className="bg-background">
      <div className="mx-auto max-w-4xl px-4 pt-20 md:px-8 md:pt-28 text-center">
        <p className="eyebrow text-primary mb-5">WHAT HAPPENS WHEN YOU UPLOAD YOUR QUOTE</p>
        <h2 className="display-secondary text-foreground mb-10" style={{ fontSize: "clamp(32px, 4.5vw, 42px)" }}>This is what will happen to your quote once you get it.</h2>
        <ScanPreview />
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-20 md:px-8 md:pb-28 mt-12">
        <div className="mx-auto glass-card-strong shadow-2xl" style={{ maxWidth: 500, padding: "clamp(24px, 4vw, 40px) clamp(20px, 4vw, 36px)" }}>
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div key="form" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <div className="inline-flex items-center gap-2 mb-5 badge-signal rounded-lg px-3 py-1">
                  <span className="eyebrow text-primary">SET YOUR QUOTE REMINDER</span>
                </div>
                <h3 className="display-secondary text-foreground text-2xl">When is your contractor visiting?</h3>
                <p className="font-body text-[14px] text-muted-foreground mt-2 mb-7">We'll text you 15 minutes after they leave.</p>
                <div className="mb-3">
                  <label className="font-mono text-[10px] text-muted-foreground tracking-wider block mb-1.5">APPOINTMENT DATE</label>
                  <input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} min={todayStr}
                    className="w-full h-12 border-[1.5px] border-border rounded-lg px-4 font-body text-[15px] text-foreground bg-card outline-none" />
                </div>
                <div className="mb-4">
                  <label className="font-mono text-[10px] text-muted-foreground tracking-wider block mb-1.5">APPROXIMATE APPOINTMENT TIME</label>
                  <input type="time" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full h-12 border-[1.5px] border-border rounded-lg px-4 font-body text-[15px] text-foreground bg-card outline-none" />
                </div>
                <AnimatePresence>
                  {bothFilled && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="flex items-start gap-2.5 mb-4 bg-primary/5 rounded-lg p-3">
                      <span className="shrink-0 text-primary">🔔</span>
                      <p className="font-body text-[13px] text-foreground">We'll send you an SMS at approximately {reminderTime} on {formatDateDisplay(appointmentDate)}.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.button whileHover={bothFilled ? { scale: 1.01 } : {}} whileTap={bothFilled ? { scale: 0.98 } : {}} onClick={handleSubmit} disabled={!bothFilled}
                  className={`w-full h-[52px] rounded-xl border-none font-body text-[16px] font-bold text-white ${bothFilled ? "btn-depth-primary cursor-pointer" : "bg-border cursor-not-allowed"}`}>
                  Set My Quote Reminder →
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="text-center">
                <div className="mx-auto mb-5 flex items-center justify-center w-[72px] h-[72px] rounded-xl bg-primary/10 border-2 border-primary">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M7 14l5 5 9-9" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h3 className="font-body text-xl font-bold text-foreground">Reminder set. We'll be there.</h3>
                <p className="font-body text-[14px] text-muted-foreground leading-relaxed mt-3">We'll text your mobile on {formatDateDisplay(appointmentDate)} at {reminderTime}.</p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onViewChecklist} className="mt-6 inline-block btn-depth-primary rounded-xl py-3.5 px-7 font-body text-[15px] font-bold">
                  View My Forensic Checklist →
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-16 md:pb-28 text-center mt-10">
        <p className="display-secondary text-foreground text-[28px]">Most homeowners decide whether to sign based on how the contractor made them feel.</p>
        <p className="display-secondary text-primary text-[28px] mt-3">You'll decide based on what the data says.</p>
        <button onClick={() => onSwitchToFlowA?.()} className="font-body text-[13px] text-muted-foreground underline bg-transparent border-none cursor-pointer mt-4 inline-block hover:text-primary transition-colors">Already have a quote? Scan it now →</button>
      </div>
    </section>
  );
};

export default QuoteWatcher;
