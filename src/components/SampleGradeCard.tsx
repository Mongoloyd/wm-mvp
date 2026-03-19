import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Zap, CheckCircle2 } from "lucide-react";

const REPORTS = [
  { grade: "C", percent: 55, delta: 4800, gradeColor: "#F97316", gradientStops: ["#F97316", "#DC2626"], subtitle: "GRADE C — REVIEW BEFORE SIGNING", flags: [
    { stripe: "#DC2626", icon: AlertTriangle, color: "#F97316", label: "No Window Brand Specified", sub: "Contractor can install any quality level" },
    { stripe: "#F59E0B", icon: Zap, color: "#F59E0B", label: "Labor Warranty: 1 Year Only", sub: "Industry standard is 2–5 years" },
    { stripe: "#2563EB", icon: CheckCircle2, color: "#2563EB", label: "Permit Cost Included", sub: "This is correctly structured" },
  ]},
  { grade: "F", percent: 20, delta: 12500, gradeColor: "#DC2626", gradientStops: ["#DC2626", "#991B1B"], subtitle: "GRADE F — DO NOT SIGN", flags: [
    { stripe: "#DC2626", icon: AlertTriangle, color: "#F97316", label: "Missing NOA Codes", sub: "Cannot verify product approval" },
    { stripe: "#DC2626", icon: AlertTriangle, color: "#F97316", label: "Permit Fees Listed as TBD", sub: "Open-ended cost exposure" },
    { stripe: "#F59E0B", icon: Zap, color: "#F59E0B", label: "No Disposal Terms", sub: "Hidden cost risk on removal" },
  ]},
  { grade: "B", percent: 85, delta: 800, gradeColor: "#2563EB", gradientStops: ["#2563EB", "#1D4ED8"], subtitle: "GRADE B — MOSTLY FAIR", flags: [
    { stripe: "#2563EB", icon: CheckCircle2, color: "#2563EB", label: "Quality Brand Specified", sub: "PGT WinGuard series confirmed" },
    { stripe: "#2563EB", icon: CheckCircle2, color: "#2563EB", label: "Permit Cost Included", sub: "This is correctly structured" },
    { stripe: "#F59E0B", icon: Zap, color: "#F59E0B", label: "Unclear Disposal Terms", sub: "Ask for written confirmation" },
  ]},
];

const ANIM_DURATION = 1500;

const GradeRing = ({ percent, gradeColor, gradientStops, grade, id }: { percent: number; gradeColor: string; gradientStops: string[]; grade: string; id: number }) => {
  const radius = 52; const stroke = 5; const circumference = 2 * Math.PI * radius; const offset = circumference - (percent / 100) * circumference; const gradId = `gradeGradient-${id}`;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width={140} height={140} className="absolute -rotate-90">
        <circle cx={70} cy={70} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <motion.circle cx={70} cy={70} r={radius} fill="none" stroke={`url(#${gradId})`} strokeWidth={stroke} strokeLinecap="butt" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1, ease: "easeOut" }} />
        <defs><linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={gradientStops[0]} /><stop offset="100%" stopColor={gradientStops[1]} /></linearGradient></defs>
      </svg>
      <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15, delay: 0.1 }}
        style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 64, fontWeight: 900, color: gradeColor, lineHeight: 1, textShadow: `0 0 40px ${gradeColor}66` }}>
        {grade}
      </motion.span>
    </div>
  );
};

const AnimatedCounter = ({ target }: { target: number }) => {
  const [value, setValue] = useState(0); const startRef = useRef<number | null>(null); const rafRef = useRef<number>(0);
  useEffect(() => { startRef.current = null; const animate = (timestamp: number) => { if (!startRef.current) startRef.current = timestamp; const progress = Math.min((timestamp - startRef.current) / ANIM_DURATION, 1); const eased = 1 - Math.pow(1 - progress, 3); setValue(Math.round(eased * target)); if (progress < 1) rafRef.current = requestAnimationFrame(animate); }; rafRef.current = requestAnimationFrame(animate); return () => cancelAnimationFrame(rafRef.current); }, [target]);
  return <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 20, color: "#F97316" }}>${value.toLocaleString()}</span>;
};

const SampleGradeCard = () => {
  const cardRef = useRef<HTMLDivElement>(null); const inView = useRef(false); const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => { inView.current = true; const interval = setInterval(() => setCurrentIndex((i) => (i + 1) % REPORTS.length), 5000); return () => clearInterval(interval); }, []);
  const report = REPORTS[currentIndex];

  return (
    <motion.div ref={cardRef} animate={{ y: [-6, 0, -6] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="relative overflow-hidden" style={{ background: "rgba(17,17,17,0.95)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", padding: 28, maxWidth: 420, width: "100%", border: "1px solid #1A1A1A", boxShadow: "0 40px 100px -20px rgba(37,99,235,0.15), 0 12px 32px -8px rgba(0,0,0,0.5)" }}>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden" style={{ transform: "rotate(-12deg)" }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 28, fontWeight: 700, letterSpacing: "0.5em", color: "rgba(255,255,255,0.03)", whiteSpace: "nowrap" }}>CONFIDENTIAL — SAMPLE</span>
      </div>
      <div className="flex items-center justify-between mb-5 relative">
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: "rgba(255,255,255,0.6)" }}>SAMPLE GRADE REPORT</p>
        <span className="inline-flex items-center" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "#2563EB", background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", padding: "2px 8px" }}>SAMPLE</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={currentIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <div className="flex flex-col items-center relative mb-5">
            <GradeRing key={currentIndex} percent={report.percent} gradeColor={report.gradeColor} gradientStops={report.gradientStops} grade={report.grade} id={currentIndex} />
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>{report.subtitle}</p>
          </div>
          <div className="relative mb-5" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(249,115,22,0.2)", padding: "14px 18px" }}>
            <div className="flex items-baseline gap-2">
              <AnimatedCounter key={currentIndex} target={report.delta} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "rgba(249,115,22,0.8)" }}>Above Fair Market</span>
            </div>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>Broward County Benchmark · Q1 2025</p>
          </div>
          <div className="flex flex-col gap-2 relative">
            {report.flags.map((flag, i) => {
              const Icon = flag.icon;
              return (
                <div key={i} className="flex overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ width: 3, backgroundColor: flag.stripe, flexShrink: 0 }} />
                  <div style={{ padding: "10px 14px" }} className="flex items-start gap-2.5">
                    <Icon size={15} color={flag.color} strokeWidth={2.5} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: flag.color }}>{flag.label}</p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{flag.sub}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="text-center relative" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 12, paddingTop: 14 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontStyle: "italic", color: "rgba(255,255,255,0.35)" }}>This is a sample. Your quote will generate a real grade.</p>
      </div>
    </motion.div>
  );
};

export default SampleGradeCard;
