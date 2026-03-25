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
    <section className="wm-ambient">
      <div ref={ref} className="mx-auto max-w-5xl px-4 md:px-8 py-20 md:py-28">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15 }} className="text-center">
          <p className="eyebrow mb-4">REAL RESULTS FROM FLORIDA HOMEOWNERS</p>
          <h2 className="display-hero text-foreground mb-3" style={{ fontSize: "clamp(32px, 5vw, 48px)" }}>WHAT HAPPENS WHEN YOU KNOW THE TRUTH.</h2>
          <p className="font-body text-base text-muted-foreground mb-12">These Are Outcomes Not Reviews</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {stories.map((story, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: i * 0.05 }}
              className="glass-card rounded-2xl p-8">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-xl">
                    <span className="font-body text-base font-bold text-primary">{story.initial}</span>
                  </div>
                  <div>
                    <p className="font-body text-base font-bold text-foreground">{story.name}</p>
                    <p className="font-body text-[13px] text-muted-foreground">{story.location}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center w-11 h-11 rounded-xl" style={{ border: `2px solid ${story.gradeColor}`, background: `${story.gradeColor}15` }}>
                  <span className="font-mono text-xl font-bold" style={{ color: story.gradeColor }}>{story.grade}</span>
                </div>
              </div>
              <div className="mt-5">
                {story.narrative.map((p, j) => <p key={j} className="font-body text-[15px] text-muted-foreground leading-relaxed" style={{ marginTop: j > 0 ? 12 : 0 }}>{p}</p>)}
              </div>
              <div className="flex items-center gap-3 badge-signal rounded-xl p-4 mt-5">
                <span className="text-primary text-xl">✓</span>
                <p className="font-body text-sm text-primary font-semibold">{story.result}</p>
              </div>
              <div className="mt-3">
                <span className="badge-warning rounded-lg px-3 py-1 font-body text-xs font-semibold">{story.flag}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: 0.15 }}
          className="text-center mt-12 glass-card rounded-2xl p-8">
          <h3 className="display-secondary text-foreground" style={{ fontSize: 26 }}>YOUR QUOTE IS EITHER PRICED FAIRLY OR IT ISN'T.</h3>
          <p className="font-body text-lg text-muted-foreground italic mt-3">Right Now, The Contractor Knows Which One. You Don't.</p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleScanClick}
            className="btn-depth-primary rounded-xl font-body text-base font-bold py-4 px-8 mt-6">
            Show Me My Grade →
          </motion.button>
          {onDemoClick && <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onDemoClick}
            className="block mx-auto mt-4 btn-depth-secondary rounded-xl font-body text-sm font-semibold py-3 px-7">
            See the AI in Action — No Upload Needed
          </motion.button>}
        </motion.div>
      </div>
    </section>
  );
};

export default NarrativeProof;
