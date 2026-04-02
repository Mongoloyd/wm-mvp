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
  const inView = useInView(ref, { once: true, amount: 0.1 });
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
        className="inline-flex items-center overflow-hidden relative"
        style={{
          borderRadius: "var(--radius-btn)",
          background: "linear-gradient(160deg, hsl(210 12% 88%) 0%, hsl(210 10% 82%) 40%, hsl(210 8% 78%) 100%)",
          borderTop: "1px solid hsl(210 15% 92%)",
          borderLeft: "1px solid hsl(210 12% 90%)",
          borderBottom: "1px solid hsl(210 10% 62%)",
          borderRight: "1px solid hsl(210 10% 65%)",
          boxShadow: [
            "0 1px 2px 0 hsla(210 20% 20% / 0.35)",
            "0 4px 12px -2px hsla(210 20% 20% / 0.18)",
            "0 8px 24px -4px hsla(210 15% 30% / 0.10)",
            "inset 0 1px 0 0 hsla(0 0% 100% / 0.45)",
            "inset 1px 0 0 0 hsla(0 0% 100% / 0.20)",
          ].join(", "),
        }}
      >
        {/* Brushed metal texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "repeating-linear-gradient(90deg, hsla(0 0% 100% / 0.04) 0px, hsla(0 0% 100% / 0) 1px, hsla(0 0% 0% / 0.02) 2px, hsla(0 0% 100% / 0) 3px)",
            borderRadius: "inherit",
          }}
        />

        <div className="flex items-center gap-2.5 px-4 py-2.5 relative">
          {/* Icon with debossed cavity */}
          <span
            className="text-base flex-shrink-0 leading-none relative"
            style={{
              filter: "drop-shadow(0 -1px 1px hsla(0 0% 100% / 0.7)) drop-shadow(0 1.5px 1px hsla(210 20% 20% / 0.4))",
            }}
          >🛡️</span>
          <span
            className="font-bold tabular-nums font-mono text-base"
            style={{
              color: "hsl(var(--primary))",
              textShadow: "0 1px 0 hsla(0 0% 100% / 0.6), 0 -1px 1px hsla(210 20% 20% / 0.15)",
            }}
          >{totalCount.toLocaleString()}</span>
          <span
            className="font-body text-xs whitespace-nowrap"
            style={{
              color: "hsl(210 15% 35%)",
              textShadow: "0 1px 0 hsla(0 0% 100% / 0.5), 0 -1px 1px hsla(210 20% 20% / 0.10)",
            }}
          >Quotes Scanned</span>
        </div>

        {/* Divider — etched groove */}
        <div
          className="self-stretch w-[2px] flex-shrink-0"
          style={{
            background: "linear-gradient(180deg, hsla(0 0% 100% / 0.3) 0%, hsla(210 15% 55% / 0.5) 50%, hsla(0 0% 100% / 0.2) 100%)",
          }}
        />

        <div
          className="flex items-center gap-2 px-4 py-2.5 relative"
          style={{
            background: "linear-gradient(160deg, hsla(217 91% 53% / 0.06) 0%, hsla(217 91% 53% / 0.10) 100%)",
          }}
        >
          <div className="relative flex h-2 w-2 flex-shrink-0">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"
              style={{ animationIterationCount: 3 }}
            />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </div>
          <span
            className="font-semibold tabular-nums font-mono text-sm whitespace-nowrap"
            style={{
              color: "hsl(var(--foreground))",
              textShadow: "0 1px 0 hsla(0 0% 100% / 0.5), 0 -1px 1px hsla(210 20% 20% / 0.12)",
            }}
          >
            +{todayCount} Today
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default SocialProofStrip;
