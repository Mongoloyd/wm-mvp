import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { useTickerStats } from "@/hooks/useTickerStats";

function useCountUp(end: number, duration: number, active: boolean) {
  const [value, setValue] = useState(0);
  const hasRun = useRef(false);
  useEffect(() => {
    if (!active || hasRun.current) return;
    hasRun.current = true;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      setValue(Math.round(end * progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, end, duration]);
  return value;
}

const SocialProofStrip = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const { total, today } = useTickerStats();
  const totalCount = useCountUp(total, 2000, inView);
  const todayCount = useCountUp(today, 1200, inView);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.15, delay: 0.1 }}
      className="w-full py-4 px-4 md:py-5 md:px-8 flex items-center justify-center wm-bridge-strip"
    >
      <div
        className="inline-flex items-center divide-x divide-border overflow-hidden bg-white border border-border"
        style={{ borderRadius: "var(--radius-btn)", boxShadow: "var(--shadow-sunken)" }}
      >
        <div className="flex items-center gap-2 px-4 py-2">
          <span className="text-base flex-shrink-0 leading-none">🛡️</span>
          <span className="font-bold tabular-nums font-mono text-base text-primary">{totalCount.toLocaleString()}</span>
          <span className="font-body text-xs text-muted-foreground whitespace-nowrap">quotes scanned</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/5">
          <div className="relative flex h-2 w-2 flex-shrink-0">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"
              style={{ animationIterationCount: 3 }}
            />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </div>
          <span className="font-semibold tabular-nums font-mono text-sm text-foreground whitespace-nowrap">
            +{todayCount} today
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default SocialProofStrip;
