import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTickerStats } from "@/hooks/useTickerStats";

const SocialProofStrip = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const { total, today } = useTickerStats();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.15, delay: 0.1 }}
      className="w-full py-4 px-4 md:py-5 md:px-8 flex items-center justify-center wm-bridge-strip"
    >
      {/* Ring 1 — outermost, darkest */}
      <motion.div
        animate={{ y: [0, -2, 0, 2, 0] }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity, repeatType: "loop" }}
        className="inline-flex rounded-[11px]"
        style={{
          padding: "1px",
          background: "hsl(214 25% 68%)",
          boxShadow: [
            "0 1px 3px 0 hsla(210 20% 30% / 0.12)",
            "0 2px 8px -1px hsla(210 20% 30% / 0.08)",
          ].join(", "),
        }}
      >
        {/* Ring 2 — middle */}
        <div
          className="inline-flex rounded-[10px]"
          style={{
            padding: "1px",
            background: "hsl(214 22% 78%)",
          }}
        >
          {/* Ring 3 — innermost, lightest */}
          <div
            className="inline-flex rounded-[9px]"
            style={{
              padding: "1px",
              background: "hsl(214 18% 87%)",
            }}
          >
            {/* Core pill — near-white center */}
            <div
              className="inline-flex items-center overflow-hidden relative"
              style={{
                borderRadius: "var(--radius-btn)",
                background: "linear-gradient(180deg, hsl(214 30% 96%) 0%, hsl(214 25% 94%) 100%)",
              }}
            >
              <div className="flex items-center gap-2.5 px-4 py-2.5 relative">
                <span
                  className="text-base flex-shrink-0 leading-none relative"
                  style={{
                    filter: "drop-shadow(0 1px 1px hsla(210 20% 20% / 0.25))",
                  }}
                >🛡️</span>
                <span
                  className="font-bold tabular-nums font-mono text-base"
                  style={{
                    color: "hsl(var(--primary))",
                    textShadow: "0 1px 0 hsla(0 0% 100% / 0.5)",
                  }}
                >{total.toLocaleString()}</span>
                <span
                  className="font-body text-xs whitespace-nowrap"
                  style={{
                    color: "hsl(215 20% 32%)",
                    textShadow: "0 1px 0 hsla(0 0% 100% / 0.4)",
                  }}
                >Quotes Scanned</span>
              </div>

              {/* Etched groove divider */}
              <div
                className="self-stretch w-[1px] flex-shrink-0"
                style={{
                  background: "linear-gradient(180deg, hsla(214 20% 80% / 0.4) 0%, hsla(214 20% 70% / 0.6) 50%, hsla(214 20% 80% / 0.4) 100%)",
                }}
              />

              <div
                className="flex items-center gap-2 px-4 py-2.5 relative"
                style={{
                  background: "hsla(217 91% 53% / 0.04)",
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
                    textShadow: "0 1px 0 hsla(0 0% 100% / 0.4)",
                  }}
                >
                  +{today} Today
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SocialProofStrip;
