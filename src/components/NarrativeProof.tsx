import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const stories = [
{ initial: "M", initialBg: "#E8F7FB", initialColor: "#0099BB", name: "Maria", location: "Pembroke Pines, FL", grade: "C", gradeColor: "#F97316", gradeBg: "#FEF2F2", narrative: ["She got three quotes. They all looked similar. She uploaded the highest one to WindowMan before calling the contractor back.", "The scan flagged the window brand as unspecified.", "She called back and asked one question. The contractor revised the quote."], result: "Contractor revised quote after one phone call.", flag: "Red flag caught: Unspecified window brand" },
{ initial: "D", initialBg: "#FDF3E3", initialColor: "#C8952A", name: "David", location: "Coral Springs, FL", grade: "D", gradeColor: "#DC2626", gradeBg: "#FEF2F2", narrative: ["His quote was $17,400. He uploaded it because he wasn't sure the price was right.", "The scan put his quote at 26% above fair market for Broward County.", "He didn't negotiate. He walked away and found a contractor whose quote came in $5,200 lower."], result: "Found a contractor $5,200 lower for the same scope.", flag: "Red flag caught: 26% above Broward County benchmark" }];


interface NarrativeProofProps {onScanClick?: () => void;onDemoClick?: () => void;}

const NarrativeProof = ({ onScanClick, onDemoClick }: NarrativeProofProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const handleScanClick = () => {onScanClick ? onScanClick() : document.getElementById("truth-gate")?.scrollIntoView({ behavior: "smooth" });};

  return (
    <section className="frosted-card-light frosted-section-spacing">
      <div ref={ref} className="mx-auto max-w-5xl px-4 md:px-8 py-20 md:py-28">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4 }} className="text-center">
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#0099BB", letterSpacing: "0.1em", marginBottom: 16 }}>REAL RESULTS FROM FLORIDA HOMEOWNERS</p>
          <h2 style={{ fontFamily: "'Jost', sans-serif", fontSize: "clamp(32px, 5vw, 42px)", color: "#0F1F35", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>What Happens When You Know The Truth.</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#6B7280", marginBottom: 48 }}>These Are Outcomes Not Reviews  </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {stories.map((story, i) =>
          <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.45, delay: i * 0.15 }} style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: 16, padding: "32px 28px", boxShadow: "0 4px 20px rgba(15, 31, 53, 0.07)" }}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: story.initialBg }}><span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: story.initialColor }}>{story.initial}</span></div>
                  <div><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#0F1F35" }}>{story.name}</p><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6B7280" }}>{story.location}</p></div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: story.gradeBg, border: `2px solid ${story.gradeColor}` }}><span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, color: story.gradeColor }}>{story.grade}</span></div>
                </div>
              </div>
              <div style={{ marginTop: 20 }}>{story.narrative.map((p, j) => <p key={j} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#374151", lineHeight: 1.8, marginTop: j > 0 ? 12 : 0 }}>{p}</p>)}</div>
              <div className="flex items-center gap-3" style={{ background: "#ECFDF5", borderRadius: 10, padding: "16px 20px", marginTop: 20 }}><span style={{ color: "#059669", fontSize: 20 }}>✓</span><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#065F46", fontWeight: 600 }}>{story.result}</p></div>
              <div style={{ marginTop: 12 }}><span style={{ display: "inline-flex", background: "#FEF2F2", borderRadius: 999, padding: "4px 12px", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#DC2626", fontWeight: 600 }}>{story.flag}</span></div>
            </motion.div>
          )}
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.4 }} className="text-center mt-12" style={{ backgroundColor: "#F9FAFB", borderRadius: 16, padding: 32 }}>
          <h3 style={{ fontFamily: "'Jost', sans-serif", fontSize: 24, color: "#0F1F35", fontWeight: 800, letterSpacing: "-0.02em" }}>Your Quote is Either Priced Fairly or it Isn't.</h3>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#374151", fontStyle: "italic", marginTop: 12 }}>Right Now, The Contractor Knows Which One. You Don't.</p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleScanClick} style={{ marginTop: 24, background: "#C8952A", color: "#FFFFFF", fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, padding: "16px 32px", borderRadius: 10, border: "none", boxShadow: "0 4px 14px rgba(200, 149, 42, 0.35)", cursor: "pointer" }}>Show Me My Grade →</motion.button>
          {onDemoClick && <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onDemoClick} style={{ marginTop: 16, background: "transparent", color: "#0891B2", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: "12px 28px", borderRadius: 10, border: "2px solid #0891B2", cursor: "pointer" }}>See the AI in Action — No Upload Needed</motion.button>}
        </motion.div>
      </div>
    </section>);

};

export default NarrativeProof;