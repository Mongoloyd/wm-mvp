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
    <section style={{ backgroundColor: "#0A0A0A" }}>
      <div ref={ref} className="mx-auto max-w-4xl px-4 md:px-8 py-24 md:py-32 text-center">
        <motion.p initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15 }}
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, color: "#E5E7EB", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 40 }}>
          WHY WINDOWMAN EXISTS
        </motion.p>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: 0.05 }}
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(28px, 4vw, 40px)", color: "#E5E5E5", fontWeight: 800, letterSpacing: "0.01em", lineHeight: 1.3, marginBottom: 24, textTransform: "uppercase" }}>
          THE INDUSTRY BUILT A SYSTEM WHERE YOU NEED THEIR EXPERTISE TO UNDERSTAND THEIR QUOTE.
        </motion.p>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: 0.1 }}
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(28px, 4vw, 40px)", color: "#2563EB", fontWeight: 900, letterSpacing: "0.01em", lineHeight: 1.3, textTransform: "uppercase" }}>
          WE BUILT A SYSTEM WHERE YOU DON'T.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: 0.15 }}
          className="grid grid-cols-2 gap-4 mx-auto mt-12" style={{ maxWidth: 560 }}>
          {dynamicChecks.map((text, i) => (
            <div key={i} className="flex items-start gap-2.5 text-left">
              <div className="flex items-center justify-center flex-shrink-0" style={{ width: 24, height: 24, background: "rgba(37,99,235,0.15)" }}>
                <span style={{ color: "#2563EB", fontSize: 12, fontWeight: 700 }}>✓</span>
              </div>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#E5E7EB" }}>{text}</span>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: 0.2 }} className="mt-14">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleScanClick}
            style={{ background: "#2563EB", color: "#FFFFFF", fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, padding: "18px 48px", border: "none", boxShadow: "0 6px 24px rgba(37,99,235,0.4)", cursor: "pointer" }}>
            Scan My Quote — It's Free
          </motion.button>
          {onDemoClick && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onDemoClick}
              style={{ marginTop: 16, background: "transparent", color: "#2563EB", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: "12px 28px", border: "1px solid rgba(37,99,235,0.3)", cursor: "pointer" }}>
              See the AI in Action — No Upload Needed
            </motion.button>
          )}
        </motion.div>

        <div style={{ paddingTop: 40, borderTop: "1px solid #1A1A1A", marginTop: 56 }}>
          <div className="flex justify-center items-center gap-6 flex-wrap" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#4B5563" }}>
            <span>© 2025 WindowMan.pro</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClosingManifesto;
