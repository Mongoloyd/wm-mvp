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
      <div ref={ref} className="mx-auto max-w-5xl px-4 md:px-8 py-24 md:py-32">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="text-center">
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#2563EB", letterSpacing: "0.12em", marginBottom: 20, fontWeight: 700 }}>REAL RESULTS FROM FLORIDA HOMEOWNERS</p>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(34px, 5vw, 52px)", color: "#FFFFFF", fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 16, textTransform: "uppercase", lineHeight: 1.1 }}>WHAT HAPPENS WHEN YOU KNOW THE TRUTH.</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: "rgba(229,231,235,0.75)", marginBottom: 56, fontStyle: "italic" }}>These Are Outcomes Not Reviews</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {stories.map((story, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.3, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "36px 32px", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3.5">
                  <div className="flex items-center justify-center" style={{ width: 44, height: 44, backgroundColor: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.25)" }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, color: "#2563EB" }}>{story.initial}</span>
                  </div>
                  <div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 700, color: "#FFFFFF" }}>{story.name}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(229,231,235,0.55)" }}>{story.location}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center" style={{ width: 48, height: 48, border: `2px solid ${story.gradeColor}`, background: `${story.gradeColor}18` }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 22, fontWeight: 700, color: story.gradeColor }}>{story.grade}</span>
                </div>
              </div>
              <div style={{ marginTop: 24 }}>
                {story.narrative.map((p, j) => <p key={j} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "rgba(229,231,235,0.88)", lineHeight: 1.75, marginTop: j > 0 ? 14 : 0 }}>{p}</p>)}
              </div>
              <div className="flex items-center gap-3.5" style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", padding: "18px 22px", marginTop: 24 }}>
                <span style={{ color: "#2563EB", fontSize: 22, fontWeight: 700 }}>✓</span>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#2563EB", fontWeight: 600, lineHeight: 1.5 }}>{story.result}</p>
              </div>
              <div style={{ marginTop: 14 }}>
                <span style={{ display: "inline-flex", background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", padding: "5px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#F97316", fontWeight: 600 }}>{story.flag}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.3, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mt-16" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: 36, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, color: "#FFFFFF", fontWeight: 800, letterSpacing: "-0.01em", textTransform: "uppercase" }}>
            YOUR QUOTE IS EITHER PRICED FAIRLY OR IT ISN'T.
          </h3>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 19, color: "rgba(229,231,235,0.85)", fontStyle: "italic", marginTop: 14 }}>
            Right Now, The Contractor Knows Which One. You Don't.
          </p>
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98, y: 0 }}
            onClick={handleScanClick}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{
              marginTop: 28,
              background: "#2563EB",
              color: "#FFFFFF",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 16,
              fontWeight: 700,
              padding: "16px 36px",
              border: "none",
              boxShadow: "0 4px 24px rgba(37,99,235,0.4), 0 2px 8px rgba(0,0,0,0.3)",
              cursor: "pointer",
            }}
            className="hover:shadow-[0_6px_32px_rgba(37,99,235,0.5),0_2px_12px_rgba(0,0,0,0.4)] transition-shadow"
          >
            Show Me My Grade →
          </motion.button>
          {onDemoClick && <motion.button
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
          </motion.button>}
        </motion.div>
      </div>
    </section>
  );
};

export default NarrativeProof;
