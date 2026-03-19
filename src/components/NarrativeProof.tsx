import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const stories = [
  { initial: "M", name: "Maria", location: "Pembroke Pines, FL", grade: "C", gradeColor: "#F97316", narrative: ["She got three quotes. They all looked similar. She uploaded the highest one to WindowMan before calling the contractor back.", "The scan flagged the window brand as unspecified.", "She called back and asked one question. The contractor revised the quote."], result: "Contractor revised quote after one phone call.", flag: "Red flag caught: Unspecified window brand" },
  { initial: "D", name: "David", location: "Coral Springs, FL", grade: "D", gradeColor: "#DC2626", narrative: ["His quote was $17,400. He uploaded it because he wasn't sure the price was right.", "The scan put his quote at 26% above fair market for Broward County.", "He didn't negotiate. He walked away and found a contractor whose quote came in $5,200 lower."], result: "Found a contractor $5,200 lower for the same scope.", flag: "Red flag caught: 26% above Broward County benchmark" },
];

interface NarrativeProofProps { onScanClick?: () => void; onDemoClick?: () => void; }

const NarrativeProof = ({ onScanClick, onDemoClick }: NarrativeProofProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const handleScanClick = () => { onScanClick ? onScanClick() : document.getElementById("truth-gate")?.scrollIntoView({ behavior: "smooth" }); };

  return (
    <section style={{ backgroundColor: "#0A0A0A" }}>
      <div ref={ref} className="mx-auto max-w-5xl px-4 md:px-8 py-20 md:py-28">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15 }} className="text-center">
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#2563EB", letterSpacing: "0.1em", marginBottom: 16 }}>REAL RESULTS FROM FLORIDA HOMEOWNERS</p>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(32px, 5vw, 48px)", color: "#E5E5E5", fontWeight: 800, letterSpacing: "0.01em", marginBottom: 12, textTransform: "uppercase" }}>WHAT HAPPENS WHEN YOU KNOW THE TRUTH.</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#6B7280", marginBottom: 48 }}>These Are Outcomes Not Reviews</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {stories.map((story, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: i * 0.05 }}
              style={{ background: "#111111", border: "1px solid #1A1A1A", padding: "32px 28px" }}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center" style={{ width: 40, height: 40, backgroundColor: "rgba(37,99,235,0.1)" }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#2563EB" }}>{story.initial}</span>
                  </div>
                  <div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#E5E5E5" }}>{story.name}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6B7280" }}>{story.location}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center" style={{ width: 44, height: 44, border: `2px solid ${story.gradeColor}`, background: `${story.gradeColor}15` }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, fontWeight: 700, color: story.gradeColor }}>{story.grade}</span>
                </div>
              </div>
              <div style={{ marginTop: 20 }}>
                {story.narrative.map((p, j) => <p key={j} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#6B7280", lineHeight: 1.8, marginTop: j > 0 ? 12 : 0 }}>{p}</p>)}
              </div>
              <div className="flex items-center gap-3" style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", padding: "16px 20px", marginTop: 20 }}>
                <span style={{ color: "#2563EB", fontSize: 20 }}>✓</span>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#2563EB", fontWeight: 600 }}>{story.result}</p>
              </div>
              <div style={{ marginTop: 12 }}>
                <span style={{ display: "inline-flex", background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", padding: "4px 12px", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#F97316", fontWeight: 600 }}>{story.flag}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: 0.15 }}
          className="text-center mt-12" style={{ backgroundColor: "#111111", border: "1px solid #1A1A1A", padding: 32 }}>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, color: "#E5E5E5", fontWeight: 800, letterSpacing: "0.01em", textTransform: "uppercase" }}>
            YOUR QUOTE IS EITHER PRICED FAIRLY OR IT ISN'T.
          </h3>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#6B7280", fontStyle: "italic", marginTop: 12 }}>
            Right Now, The Contractor Knows Which One. You Don't.
          </p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleScanClick}
            style={{ marginTop: 24, background: "#2563EB", color: "#FFFFFF", fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, padding: "16px 32px", border: "none", boxShadow: "0 4px 24px rgba(37,99,235,0.35)", cursor: "pointer" }}>
            Show Me My Grade →
          </motion.button>
          {onDemoClick && <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onDemoClick}
            style={{ marginTop: 16, background: "transparent", color: "#2563EB", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: "12px 28px", border: "1px solid rgba(37,99,235,0.3)", cursor: "pointer" }}>
            See the AI in Action — No Upload Needed
          </motion.button>}
        </motion.div>
      </div>
    </section>
  );
};

export default NarrativeProof;
