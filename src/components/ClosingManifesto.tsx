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
      <div ref={ref} className="mx-auto max-w-4xl px-4 md:px-8 py-28 md:py-36 text-center">
        <motion.p initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "rgba(107,114,128,0.8)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 48, fontWeight: 700 }}>
          WHY WINDOWMAN EXISTS
        </motion.p>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.3, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(30px, 4.5vw, 44px)", color: "#FFFFFF", fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.25, marginBottom: 28, textTransform: "uppercase" }}>
          THE INDUSTRY BUILT A SYSTEM WHERE YOU NEED THEIR EXPERTISE TO UNDERSTAND THEIR QUOTE.
        </motion.p>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.3, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(30px, 4.5vw, 44px)", color: "#2563EB", fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1.25, textTransform: "uppercase", textShadow: "0 2px 24px rgba(37,99,235,0.3)" }}>
          WE BUILT A SYSTEM WHERE YOU DON'T.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.3, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 gap-5 mx-auto mt-16" style={{ maxWidth: 580 }}>
          {dynamicChecks.map((text, i) => (
            <div key={i} className="flex items-start gap-3 text-left">
              <div className="flex items-center justify-center flex-shrink-0" style={{ width: 28, height: 28, background: "rgba(37,99,235,0.18)", border: "1px solid rgba(37,99,235,0.3)" }}>
                <span style={{ color: "#2563EB", fontSize: 14, fontWeight: 700 }}>✓</span>
              </div>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "rgba(229,231,235,0.88)", lineHeight: 1.6 }}>{text}</span>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.3, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} className="mt-16">
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97, y: 0 }}
            onClick={handleScanClick}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{
              background: "#2563EB",
              color: "#FFFFFF",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              padding: "18px 52px",
              border: "none",
              boxShadow: "0 6px 28px rgba(37,99,235,0.45), 0 2px 10px rgba(0,0,0,0.3)",
              cursor: "pointer",
            }}
            className="hover:shadow-[0_8px_36px_rgba(37,99,235,0.55),0_4px_16px_rgba(0,0,0,0.4)] transition-shadow"
          >
            Scan My Quote — It's Free
          </motion.button>
          {onDemoClick && (
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98, y: 0 }}
              onClick={onDemoClick}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{
                marginTop: 16,
                background: "transparent",
                color: "#2563EB",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                padding: "14px 32px",
                border: "1px solid rgba(37,99,235,0.35)",
                cursor: "pointer",
              }}
              className="hover:shadow-[0_4px_20px_rgba(37,99,235,0.15)] hover:border-[rgba(37,99,235,0.5)] transition-all"
            >
              See the AI in Action — No Upload Needed
            </motion.button>
          )}
        </motion.div>

        <div style={{ paddingTop: 48, borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 64 }}>
          <div className="flex justify-center items-center gap-6 flex-wrap" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(75,85,99,0.7)" }}>
            <span>© 2025 WindowMan.pro</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClosingManifesto;
