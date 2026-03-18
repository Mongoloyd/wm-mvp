import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const checks = ["No account required to receive your grade", "Scans are private — your contractor never knows", "Built by Florida homeowners who got tired of not knowing", "Used by 4,127+ Florida homeowners this year"];

interface ClosingManifestoProps { onScanClick?: () => void; onDemoClick?: () => void; }

const ClosingManifesto = ({ onScanClick, onDemoClick }: ClosingManifestoProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const handleScanClick = () => { onScanClick ? onScanClick() : document.getElementById("truth-gate")?.scrollIntoView({ behavior: "smooth" }); };

  return (
    <section style={{ backgroundColor: "#0F1F35" }}>
      <div ref={ref} className="mx-auto max-w-4xl px-4 md:px-8 py-24 md:py-32 text-center">
        <motion.p initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4 }} style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: "#94A3B8", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 40 }}>WHY WINDOWMAN EXISTS</motion.p>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }} style={{ fontFamily: "'Jost', sans-serif", fontSize: "clamp(28px, 4vw, 36px)", color: "#F3F4F6", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.5, marginBottom: 24 }}>The Industry Built a System Where You Need Their Expertise to Understand Their Quote.</motion.p>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }} style={{ fontFamily: "'Jost', sans-serif", fontSize: "clamp(28px, 4vw, 36px)", color: "#C8952A", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.5 }}>We Built a System Where You Don't.</motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.35 }} className="grid grid-cols-2 gap-4 mx-auto mt-12" style={{ maxWidth: 560 }}>
          {checks.map((text, i) => (<div key={i} className="flex items-start gap-2.5 text-left"><div className="flex items-center justify-center flex-shrink-0" style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }}><span style={{ color: "#FFFFFF", fontSize: 12, fontWeight: 700 }}>✓</span></div><span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#D1D5DB" }}>{text}</span></div>))}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.5 }} className="mt-14">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleScanClick} style={{ background: "#C8952A", color: "#FFFFFF", fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, padding: "18px 48px", borderRadius: 12, border: "none", boxShadow: "0 6px 24px rgba(200, 149, 42, 0.4)", cursor: "pointer" }}>Scan My Quote — It's Free</motion.button>
          {onDemoClick && (<motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onDemoClick} style={{ marginTop: 16, background: "transparent", color: "#0891B2", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: "12px 28px", borderRadius: 10, border: "2px solid #0891B2", cursor: "pointer" }}>See the AI in Action — No Upload Needed</motion.button>)}
        </motion.div>
        <div style={{ paddingTop: 40, borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 56 }}>
          <div className="flex justify-center items-center gap-6 flex-wrap" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#4B5563" }}><span>© 2025 WindowMan.pro</span></div>
        </div>
      </div>
    </section>
  );
};

export default ClosingManifesto;
