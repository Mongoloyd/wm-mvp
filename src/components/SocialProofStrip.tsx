import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Shield } from "lucide-react";
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
      className="w-full py-4 px-4 md:py-5 md:px-8 flex items-center justify-center"
      style={{ backgroundColor: "#0A0A0A", borderTop: "1px solid #1A1A1A", borderBottom: "1px solid #1A1A1A" }}
    >
      <div
        className="inline-flex items-center divide-x overflow-hidden"
        style={{ borderColor: "#1A1A1A", border: "1px solid #1A1A1A" }}
      >
        <div className="flex items-center gap-2 px-4 py-2">
          <Shield className="w-4 h-4 flex-shrink-0" style={{ color: "#2563EB" }} />
          <span className="font-bold tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, color: "#2563EB" }}>
            {totalCount.toLocaleString()}
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>
            quotes scanned
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: "rgba(37,99,235,0.05)" }}>
          <div className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full opacity-75" style={{ backgroundColor: "#2563EB", borderRadius: "50%", animationIterationCount: 3 }} />
            <span className="relative inline-flex h-2 w-2" style={{ backgroundColor: "#2563EB", borderRadius: "50%" }} />
          </div>
          <span className="font-semibold tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: "#E5E5E5", whiteSpace: "nowrap" }}>
            +{todayCount} today
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default SocialProofStrip;
