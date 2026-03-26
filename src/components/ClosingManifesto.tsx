import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTickerStats } from "@/hooks/useTickerStats";

interface ClosingManifestoProps { onScanClick?: () => void; onDemoClick?: () => void; }

const ClosingManifesto = ({ onScanClick, onDemoClick }: ClosingManifestoProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const { total: tickerTotal } = useTickerStats();
  const dynamicChecks = [
    "No account required to receive your grade",
    "Scans are private — your contractor never knows",
    "Built by Florida homeowners who got tired of not knowing",
    `Used by ${tickerTotal.toLocaleString()}+ Florida homeowners this year`,
  ];
  const handleScanClick = () => {
    onScanClick ? onScanClick() : document.getElementById("truth-gate")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="bg-background">
      <div ref={ref} className="mx-auto max-w-5xl px-4 md:px-8 py-20 md:py-28 text-center">
        <motion.p initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15 }}
          className="wm-eyebrow text-muted-foreground mb-10">
          WHY WINDOWMAN EXISTS
        </motion.p>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: 0.05 }}
          className="wm-title-section leading-[1.25] mb-6" style={{ fontSize: "clamp(32px, 5vw, 48px)", color: "hsl(210 50% 8%)" }}>
          THE INDUSTRY BUILT A SYSTEM WHERE YOU NEED THEIR EXPERTISE TO UNDERSTAND THEIR QUOTE.
        </motion.p>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: 0.1 }}
          className="font-display text-primary font-black tracking-[0.01em] uppercase leading-[1.3]" style={{ fontSize: "clamp(32px, 5vw, 48px)" }}>
          WE BUILT A SYSTEM WHERE YOU DON'T.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: 0.15 }}
          className="grid grid-cols-2 gap-4 mx-auto mt-12" style={{ maxWidth: 560 }}>
          {dynamicChecks.map((text, i) => (
            <div key={i} className="flex items-start gap-2.5 text-left">
              <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 card-raised">
                <span className="text-primary text-xs font-bold">✓</span>
              </div>
              <span className="font-body text-sm text-muted-foreground">{text}</span>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: 0.2 }} className="mt-8">
          <button onClick={handleScanClick}
            className="btn-depth-primary" style={{ padding: "16px 32px" }}>
            Scan My Quote — It's Free
          </button>
          {onDemoClick && (
            <button onClick={onDemoClick}
              className="block mx-auto mt-4 btn-secondary-tactile" style={{ padding: "12px 24px" }}>
              See the AI in Action — No Upload Needed
            </button>
          )}
        </motion.div>

        <div className="pt-10 border-t border-border mt-14">
          <div className="flex justify-center items-center gap-6 flex-wrap font-body text-xs text-muted-foreground">
            <span>© 2025 WindowMan.pro</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClosingManifesto;
