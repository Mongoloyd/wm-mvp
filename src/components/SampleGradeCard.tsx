import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { AlertTriangle, Zap, CheckCircle2 } from "lucide-react";

const flagCards = [
  {
    stripe: "hsl(0, 79%, 43%)",
    icon: AlertTriangle,
    iconColor: "hsl(0, 79%, 43%)",
    label: "No Window Brand Specified",
    labelColor: "hsl(0, 79%, 43%)",
    sub: "Contractor can install any quality level",
  },
  {
    stripe: "hsl(32, 90%, 44%)",
    icon: Zap,
    iconColor: "hsl(32, 90%, 44%)",
    label: "Labor Warranty: 1 Year Only",
    labelColor: "hsl(32, 90%, 44%)",
    sub: "Industry standard is 2–5 years",
  },
  {
    stripe: "hsl(160, 84%, 39%)",
    icon: CheckCircle2,
    iconColor: "hsl(160, 84%, 39%)",
    label: "Permit Cost Included",
    labelColor: "hsl(160, 84%, 39%)",
    sub: "This is correctly structured",
  },
];

const TARGET_DELTA = 4800;
const ANIM_DURATION = 1500; // 1.5s
const RING_PERCENT = 55; // C grade ~55/100

const GradeRing = ({ inView }: { inView: boolean }) => {
  const radius = 52;
  const stroke = 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (RING_PERCENT / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width={140} height={140} className="absolute -rotate-90">
        {/* Track */}
        <circle
          cx={70} cy={70} r={radius}
          fill="none"
          stroke="hsla(0, 0%, 100%, 0.08)"
          strokeWidth={stroke}
        />
        {/* Fill arc */}
        <motion.circle
          cx={70} cy={70} r={radius}
          fill="none"
          stroke="url(#gradeGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: inView ? offset : circumference }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        <defs>
          <linearGradient id="gradeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(25, 95%, 53%)" />
            <stop offset="100%" stopColor="hsl(0, 79%, 50%)" />
          </linearGradient>
        </defs>
      </svg>
      {/* Grade letter */}
      <motion.span
        initial={{ opacity: 0, scale: 0.5 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.3, type: "spring", bounce: 0.4 }}
        style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: 64,
          fontWeight: 800,
          color: "hsl(25, 95%, 53%)",
          lineHeight: 1,
          textShadow: "0 0 40px hsla(25, 95%, 53%, 0.4)",
        }}
      >
        C
      </motion.span>
    </div>
  );
};

const AnimatedCounter = ({ inView }: { inView: boolean }) => {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!inView) return;
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / ANIM_DURATION, 1);
      // Smooth ease-out: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * TARGET_DELTA));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [inView]);

  return (
    <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 20 }} className="text-red-400">
      ${value.toLocaleString()}
    </span>
  );
};

const SampleGradeCard = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={cardRef}
      animate={{ y: [-6, 0, -6] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="relative overflow-hidden"
      style={{
        background: "hsla(222, 47%, 6%, 0.85)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: 20,
        padding: 28,
        maxWidth: 420,
        width: "100%",
        border: "1px solid hsla(0, 0%, 100%, 0.1)",
        borderTopColor: "hsla(0, 0%, 100%, 0.2)",
        boxShadow: "0 20px 60px -15px hsla(187, 100%, 46%, 0.2), 0 8px 24px -8px hsla(0, 0%, 0%, 0.4)",
      }}
    >
      {/* Scan-line overlay */}
      <motion.div
        className="absolute left-0 w-full pointer-events-none"
        style={{
          height: 60,
          background: "linear-gradient(to bottom, transparent, hsla(187, 100%, 65%, 0.15), transparent)",
        }}
        animate={{ top: ["-60px", "calc(100% + 60px)"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />

      {/* CONFIDENTIAL watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        style={{ transform: "rotate(-12deg)" }}
      >
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.5em",
            color: "hsla(0, 0%, 100%, 0.03)",
            whiteSpace: "nowrap",
          }}
        >
          CONFIDENTIAL — SAMPLE
        </span>
      </div>

      {/* Header label */}
      <div className="flex items-center justify-between mb-5 relative">
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.12em",
            color: "hsla(0, 0%, 100%, 0.45)",
          }}
        >
          SAMPLE GRADE REPORT
        </p>
        <span
          className="inline-flex items-center"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "hsl(187, 100%, 65%)",
            background: "hsla(187, 100%, 50%, 0.1)",
            border: "1px solid hsla(187, 100%, 50%, 0.2)",
            borderRadius: 4,
            padding: "2px 8px",
          }}
        >
          SAMPLE
        </span>
      </div>

      {/* Grade ring + label */}
      <div className="flex flex-col items-center relative mb-5">
        <GradeRing inView={inView} />
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: "hsla(0, 0%, 100%, 0.4)",
            marginTop: 8,
          }}
        >
          GRADE C — REVIEW BEFORE SIGNING
        </p>
      </div>

      {/* Financial pain callout */}
      <div
        className="relative mb-5"
        style={{
          background: "hsla(0, 79%, 50%, 0.08)",
          border: "1px solid hsla(0, 79%, 50%, 0.2)",
          borderRadius: 12,
          padding: "14px 18px",
        }}
      >
        <div className="flex items-baseline gap-2">
          <AnimatedCounter inView={inView} />
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: "hsla(0, 79%, 65%, 0.9)",
            }}
          >
            Above Fair Market
          </span>
        </div>
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: "hsla(0, 0%, 100%, 0.35)",
            marginTop: 4,
          }}
        >
          Broward County Benchmark · Q1 2025
        </p>
      </div>

      {/* Flag cards */}
      <div className="flex flex-col gap-2 relative">
        {flagCards.map((flag, i) => {
          const Icon = flag.icon;
          return (
            <div
              key={i}
              className="flex overflow-hidden"
              style={{
                background: "hsla(0, 0%, 100%, 0.04)",
                border: "1px solid hsla(0, 0%, 100%, 0.08)",
                borderRadius: 10,
              }}
            >
              <div style={{ width: 3, backgroundColor: flag.stripe, flexShrink: 0 }} />
              <div style={{ padding: "10px 14px" }} className="flex items-start gap-2.5">
                <Icon
                  size={15}
                  color={flag.iconColor}
                  strokeWidth={2.5}
                  className="mt-0.5 flex-shrink-0"
                />
                <div>
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      fontWeight: 700,
                      color: flag.labelColor,
                    }}
                  >
                    {flag.label}
                  </p>
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11,
                      color: "hsla(0, 0%, 100%, 0.4)",
                      marginTop: 2,
                    }}
                  >
                    {flag.sub}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="text-center relative"
        style={{ borderTop: "1px solid hsla(0, 0%, 100%, 0.08)", marginTop: 16, paddingTop: 14 }}
      >
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontStyle: "italic",
            color: "hsla(0, 0%, 100%, 0.3)",
          }}
        >
          This is a sample. Your quote will generate a real grade.
        </p>
      </div>
    </motion.div>
  );
};

export default SampleGradeCard;
