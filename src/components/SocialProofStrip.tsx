import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";

function useCountUp(end: number, start: number, duration: number, active: boolean) {
  const [value, setValue] = useState(start);
  const hasRun = useRef(false);
  useEffect(() => {
    if (!active || hasRun.current) return;
    hasRun.current = true;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      setValue(Math.round(start + (end - start) * progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, end, start, duration]);
  return value;
}

const stats = [
  { icon: "📍", end: 4127, start: 4000, prefix: "", suffix: "", label: "Florida homeowners scanned this month", color: "#C8952A" },
  { icon: "⚠", end: 4800, start: 0, prefix: "$", suffix: "", label: "average overage found per scan", color: "#DC2626" },
  { icon: "🕐", end: 993, start: 993, prefix: "", suffix: "%", label: "of scans completed in under 60 seconds", color: "#059669", fixed: true },
];

const SocialProofStrip = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const count1 = useCountUp(4127, 4000, 1200, inView);
  const count2 = useCountUp(4800, 0, 1200, inView);
  const counts = [count1, count2, null];
  const formatNumber = (idx: number) => {
    const s = stats[idx];
    if ((s as any).fixed) return "99.3";
    const val = counts[idx]!;
    return val.toLocaleString();
  };

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.3 }} className="w-full py-4 px-4 md:py-5 md:px-8 flex items-center justify-start md:justify-center overflow-x-auto md:overflow-visible" style={{ backgroundColor: "#0F1F35", WebkitOverflowScrolling: "touch" }}>
      <div className="flex items-center gap-6 md:gap-12 flex-nowrap">
        {stats.map((stat, i) => (
          <div key={i} className="flex items-center gap-0">
            {i > 0 && <div className="hidden md:block mr-6 md:mr-12" style={{ width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.15)", flexShrink: 0 }} />}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span style={{ fontSize: 14 }}>{stat.icon === "⚠" ? <span style={{ color: stat.color, fontSize: 14 }}>⚠</span> : stat.icon}</span>
              <div>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 700, color: stat.color, whiteSpace: "nowrap" }}>{stat.prefix}{formatNumber(i)}{stat.suffix}</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#94A3B8", whiteSpace: "nowrap" }}>{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default SocialProofStrip;
