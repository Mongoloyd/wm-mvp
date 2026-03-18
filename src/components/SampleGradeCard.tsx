import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { AlertTriangle, Zap, CheckCircle2 } from "lucide-react";

const REPORTS = [
  {
    grade: "C", percent: 55, delta: 4800,
    gradeColor: "hsl(25, 95%, 53%)",
    gradientStops: ["hsl(25,95%,53%)", "hsl(0,79%,50%)"],
    subtitle: "GRADE C — REVIEW BEFORE SIGNING",
    flags: [
      { stripe: "hsl(0,79%,43%)", icon: AlertTriangle, color: "hsl(0,79%,43%)", label: "No Window Brand Specified", sub: "Contractor can install any quality level" },
      { stripe: "hsl(32,90%,44%)", icon: Zap, color: "hsl(32,90%,44%)", label: "Labor Warranty: 1 Year Only", sub: "Industry standard is 2–5 years" },
      { stripe: "hsl(160,84%,39%)", icon: CheckCircle2, color: "hsl(160,84%,39%)", label: "Permit Cost Included", sub: "This is correctly structured" },
    ],
  },
  {
    grade: "F", percent: 20, delta: 12500,
    gradeColor: "hsl(0, 79%, 50%)",
    gradientStops: ["hsl(0,79%,50%)", "hsl(0,60%,40%)"],
    subtitle: "GRADE F — DO NOT SIGN",
    flags: [
      { stripe: "hsl(0,79%,43%)", icon: AlertTriangle, color: "hsl(0,79%,43%)", label: "Missing NOA Codes", sub: "Cannot verify product approval" },
      { stripe: "hsl(0,79%,43%)", icon: AlertTriangle, color: "hsl(0,79%,43%)", label: "Permit Fees Listed as TBD", sub: "Open-ended cost exposure" },
      { stripe: "hsl(32,90%,44%)", icon: Zap, color: "hsl(32,90%,44%)", label: "No Disposal Terms", sub: "Hidden cost risk on removal" },
    ],
  },
  {
    grade: "B", percent: 85, delta: 800,
    gradeColor: "hsl(160, 84%, 39%)",
    gradientStops: ["hsl(160,84%,39%)", "hsl(187,100%,40%)"],
    subtitle: "GRADE B — MOSTLY FAIR",
    flags: [
      { stripe: "hsl(160,84%,39%)", icon: CheckCircle2, color: "hsl(160,84%,39%)", label: "Quality Brand Specified", sub: "PGT WinGuard series confirmed" },
      { stripe: "hsl(160,84%,39%)", icon: CheckCircle2, color: "hsl(160,84%,39%)", label: "Permit Cost Included", sub: "This is correctly structured" },
      { stripe: "hsl(32,90%,44%)", icon: Zap, color: "hsl(32,90%,44%)", label: "Unclear Disposal Terms", sub: "Ask for written confirmation" },
    ],
  },
];

const ANIM_DURATION = 1500;

const GradeRing = ({ percent, gradeColor, gradientStops, grade, id }: {
  percent: number; gradeColor: string; gradientStops: string[]; grade: string; id: number;
}) => {
  const radius = 52;
  const stroke = 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const gradId = `gradeGradient-${id}`;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width={140} height={140} className="absolute -rotate-90">
        <circle cx={70} cy={70} r={radius} fill="none" stroke="hsla(0,0%,100%,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={70} cy={70} r={radius} fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradientStops[0]} />
            <stop offset="100%" stopColor={gradientStops[1]} />
          </linearGradient>
        </defs>
      </svg>
      <motion.span
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3, type: "spring", bounce: 0.4 }}
        style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: 64, fontWeight: 800,
          color: gradeColor, lineHeight: 1,
          textShadow: `0 0 40px ${gradeColor}66`,
        }}
      >
        {grade}
      </motion.span>
    </div>
  );
};

const AnimatedCounter = ({ target }: { target: number }) => {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = null;
    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / ANIM_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);

  return (
    <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 20 }} className="text-red-400">
      ${value.toLocaleString()}
    </span>
  );
};

const SampleGradeCard = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { once: true, margin: "-50px" });
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % REPORTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [inView]);

  const report = REPORTS[currentIndex];

  return (
    <motion.div
      ref={cardRef}
      animate={{ y: [-6, 0, -6] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="relative overflow-hidden"
      style={{
        background: "rgba(15, 23, 42, 0.70)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        borderRadius: 20,
        padding: 28,
        maxWidth: 420,
        width: "100%",
        border: "1px solid rgba(255,255,255,0.20)",
        borderTopColor: "rgba(255,255,255,0.30)",
        boxShadow: "0 40px 100px -20px rgba(34,182,203,0.35), 0 12px 32px -8px rgba(0,0,0,0.5)",
      }}
    >
      {/* Shine sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.10) 45%, rgba(255,255,255,0.04) 50%, transparent 55%)",
          borderRadius: 20,
        }}
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />

      {/* CONFIDENTIAL watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        style={{ transform: "rotate(-12deg)" }}
      >
        <span style={{
          fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 700,
          letterSpacing: "0.5em", color: "hsla(0,0%,100%,0.06)", whiteSpace: "nowrap",
        }}>
          CONFIDENTIAL — SAMPLE
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative">
        <p style={{
          fontFamily: "'DM Mono', monospace", fontSize: 10,
          letterSpacing: "0.12em", color: "hsla(0,0%,100%,0.80)",
        }}>
          SAMPLE GRADE REPORT
        </p>
        <span className="inline-flex items-center" style={{
          fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700,
          letterSpacing: "0.08em", color: "hsl(187,100%,65%)",
          background: "hsla(187,100%,50%,0.1)", border: "1px solid hsla(187,100%,50%,0.2)",
          borderRadius: 4, padding: "2px 8px",
        }}>
          SAMPLE
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Grade ring */}
          <div className="flex flex-col items-center relative mb-5">
            <GradeRing
              key={currentIndex}
              percent={report.percent}
              gradeColor={report.gradeColor}
              gradientStops={report.gradientStops}
              grade={report.grade}
              id={currentIndex}
            />
            <p style={{
              fontFamily: "'DM Mono', monospace", fontSize: 11,
              color: "hsla(0,0%,100%,0.75)", marginTop: 8,
            }}>
              {report.subtitle}
            </p>
          </div>

          {/* Financial callout */}
          <div className="relative mb-5" style={{
            background: "hsla(0,79%,50%,0.08)",
            border: "1px solid hsla(0,79%,50%,0.2)",
            borderRadius: 12, padding: "14px 18px",
          }}>
            <div className="flex items-baseline gap-2">
              <AnimatedCounter key={currentIndex} target={report.delta} />
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                color: "hsla(0,79%,65%,0.9)",
              }}>
                Above Fair Market
              </span>
            </div>
            <p style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              color: "hsla(0,0%,100%,0.65)", marginTop: 4,
            }}>
              Broward County Benchmark · Q1 2025
            </p>
          </div>

          {/* Flag cards */}
          <div className="flex flex-col gap-2 relative">
            {report.flags.map((flag, i) => {
              const Icon = flag.icon;
              return (
                <div key={i} className="flex overflow-hidden" style={{
                  background: "hsla(0,0%,100%,0.04)",
                  border: "1px solid hsla(0,0%,100%,0.08)",
                  borderRadius: 10,
                }}>
                  <div style={{ width: 3, backgroundColor: flag.stripe, flexShrink: 0 }} />
                  <div style={{ padding: "10px 14px" }} className="flex items-start gap-2.5">
                    <Icon size={15} color={flag.color} strokeWidth={2.5} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <p style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
                        color: flag.color,
                      }}>
                        {flag.label}
                      </p>
                      <p style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                        color: "hsla(0,0%,100%,0.6)", marginTop: 2,
                      }}>
                        {flag.sub}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 relative mt-4">
        {REPORTS.map((_, i) => (
          <div
            key={i}
            style={{
              width: 6, height: 6, borderRadius: "50%",
              background: i === currentIndex ? "hsl(187,100%,65%)" : "hsla(0,0%,100%,0.2)",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="text-center relative" style={{
        borderTop: "1px solid hsla(0,0%,100%,0.08)", marginTop: 12, paddingTop: 14,
      }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontStyle: "italic",
          color: "hsla(0,0%,100%,0.5)",
        }}>
          This is a sample. Your quote will generate a real grade.
        </p>
      </div>
    </motion.div>
  );
};

export default SampleGradeCard;
