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
  const handleScanClick = () => { onScanClick ? onScanClick() : document.getElementById("truth-gate")?.scrollIntoView({ behavior: "smooth" }); };

  return (
    <section className="wm-ambient">
      <div ref={ref} className="mx-auto max-w-4xl px-4 md:px-8 py-24 md:py-32 text-center">
        <motion.p initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15 }}
          className="font-display text-[13px] text-muted-foreground tracking-[0.15em] uppercase mb-10">WHY WINDOWMAN EXISTS</motion.p>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: 0.05 }}
          className="display-hero text-foreground mb-6" style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.3 }}>
          THE INDUSTRY BUILT A SYSTEM WHERE YOU NEED THEIR EXPERTISE TO UNDERSTAND THEIR QUOTE.
        </motion.p>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: 0.1 }}
          className="display-hero text-primary" style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.3 }}>
          WE BUILT A SYSTEM WHERE YOU DON'T.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: 0.15 }}
          className="grid grid-cols-2 gap-4 mx-auto mt-12" style={{ maxWidth: 560 }}>
          {dynamicChecks.map((text, i) => (
            <div key={i} className="flex items-start gap-2.5 text-left">
              <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 bg-primary/15 rounded-lg">
                <span className="text-primary text-xs font-bold">✓</span>
              </div>
              <span className="font-body text-sm text-muted-foreground">{text}</span>
            </div>
          ))}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: 0.2 }} className="mt-14">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleScanClick}
            className="btn-depth-primary rounded-xl font-body text-lg font-bold py-[18px] px-12">Scan My Quote — It's Free</motion.button>
          {onDemoClick && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onDemoClick}
              className="block mx-auto mt-4 btn-depth-secondary rounded-xl font-body text-sm font-semibold py-3 px-7">See the AI in Action — No Upload Needed</motion.button>
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
