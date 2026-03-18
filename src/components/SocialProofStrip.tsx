import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

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
  { icon: "📍", end: 4127, start: 4000, prefix: "", suffix: "", label: "Florida scans this month", color: "#C8952A" },
  { icon: "⚠", end: 4800, start: 0, prefix: "$", suffix: "", label: "avg overage found", color: "#DC2626" },
  { icon: "🕐", end: 993, start: 993, prefix: "", suffix: "%", label: "completed under 60s", color: "#059669", fixed: true },
];

const tickerKeyframes = `
@keyframes ticker-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
`;

const SocialProofStrip = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [isLg, setIsLg] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsLg(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsLg(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const count1 = useCountUp(4127, 4000, 1200, inView);
  const count2 = useCountUp(4800, 0, 1200, inView);
  const counts = [count1, count2, null];

  const formatNumber = (idx: number) => {
    const s = stats[idx];
    if ((s as any).fixed) return "99.3";
    return counts[idx]!.toLocaleString();
  };

  const StatContent = () => (
    <>
      {stats.map((stat, i) => (
        <span key={i} className="inline-flex items-center">
          {i > 0 && (
            <span className="mx-4 text-cyan-400/60 text-sm select-none">●</span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span style={{ fontSize: 13 }}>
              {stat.icon === "⚠" ? <span style={{ color: stat.color }}>⚠</span> : stat.icon}
            </span>
            <span
              className="font-mono text-lg font-bold"
              style={{ color: stat.color }}
            >
              {stat.prefix}{formatNumber(i)}{stat.suffix}
            </span>
            <span className="text-[11px]" style={{ color: "#64748B" }}>
              {stat.label}
            </span>
          </span>
        </span>
      ))}
    </>
  );

  return (
    <>
      <style>{tickerKeyframes}</style>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="relative overflow-hidden frosted-card-dark frosted-section-spacing h-14 flex items-center"
      >
        {/* Pinned LIVE badge */}
        <div
          className="absolute left-0 top-0 z-10 h-full flex items-center px-4"
          style={{
            backgroundColor: "rgba(2, 6, 23, 0.9)",
            boxShadow: "10px 0 20px -5px rgba(2, 6, 23, 1)",
          }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="animate-pulse"
              style={{
                width: 7,
                height: 7,
                backgroundColor: "#059669",
                borderRadius: "50%",
                display: "inline-block",
                boxShadow: "0 0 6px #059669",
              }}
            />
            <span
              className="font-mono uppercase tracking-widest"
              style={{ fontSize: 10, color: "#34D399" }}
            >
              LIVE
            </span>
          </div>
        </div>

        {/* Scrolling / static content */}
        <div className="pl-20 overflow-hidden w-full h-full flex items-center">
          {isLg ? (
            /* Desktop: static, centered */
            <div className="whitespace-nowrap flex items-center justify-center w-full">
              <StatContent />
            </div>
          ) : (
            /* Mobile/Tablet: marquee scroll */
            <div
              className="whitespace-nowrap flex items-center w-max"
              style={{
                animation: "ticker-scroll 25s linear infinite",
              }}
            >
              <StatContent />
              <span className="mx-4 text-cyan-400/60 text-sm select-none">●</span>
              <StatContent />
              <span className="mx-4 text-cyan-400/60 text-sm select-none">●</span>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default SocialProofStrip;
