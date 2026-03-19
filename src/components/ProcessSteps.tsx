import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const steps = [
  { num: "01", title: "Answer 4 Questions", copy: "Window count, project type, county, and quote range. Takes 45 seconds." },
  { num: "02", title: "Enter your details", copy: "Name, email, and mobile. Your report is sent here. No password needed." },
  { num: "03", title: "Upload your quote", copy: "PDF, photo, or screenshot. Any format. We extract every line item." },
  { num: "04", title: "AI scans your quote", copy: "Our AI benchmarks your price against county averages and flags every issue." },
  { num: "05", title: "Your grade appears", copy: "A through F. A dollar delta. Every red flag. Your negotiation ammunition." },
];

const deliverables = [
  { color: "#2563EB", icon: "◎", text: "Whether your price is above, below, or at fair market for your specific county" },
  { color: "#F97316", icon: "⚑", text: "Which line items are vague, missing, or potentially inflated" },
  { color: "#C8952A", icon: "◈", text: "What window brand — if any — your contractor actually specified" },
  { color: "#2563EB", icon: "◉", text: "A letter grade: A through F" },
  { color: "#2563EB", icon: "$", text: "The specific dollar amount you're over or under market" },
];

interface ProcessStepsProps { onScanClick?: () => void; onDemoClick?: () => void; }

const ProcessSteps = ({ onScanClick, onDemoClick }: ProcessStepsProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const handleScanClick = () => { onScanClick ? onScanClick() : document.getElementById("truth-gate")?.scrollIntoView({ behavior: "smooth" }); };

  return (
    <section id="how-it-works" style={{ backgroundColor: "#111111", borderTop: "1px solid #1A1A1A", borderBottom: "1px solid #1A1A1A" }}>
      <div ref={ref} className="mx-auto max-w-5xl px-4 md:px-8 py-20 md:py-28">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15 }} className="text-center">
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#2563EB", letterSpacing: "0.1em", marginBottom: 16 }}>WHAT HAPPENS WHEN YOU SCAN</p>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(32px, 5vw, 48px)", color: "#E5E5E5", fontWeight: 800, letterSpacing: "0.01em", marginBottom: 48, textTransform: "uppercase" }}>
            UPLOAD YOUR QUOTE. IN UNDER 60 SECONDS, YOU'LL KNOW:
          </h2>
        </motion.div>

        {/* Desktop */}
        <div className="hidden md:block relative">
          <div className="absolute top-5 left-0 right-0 h-[1px]" style={{ backgroundColor: "#1A1A1A" }} />
          <div className="grid grid-cols-5 gap-6">
            {steps.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: i * 0.05 }} className="relative text-center">
                <div className="mx-auto flex items-center justify-center relative z-10" style={{ width: 40, height: 40, background: "#0A0A0A", border: "1px solid #1A1A1A" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 700, color: "#2563EB" }}>{step.num}</span>
                </div>
                <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#E5E5E5", marginTop: 12 }}>{step.title}</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6B7280", lineHeight: 1.6, marginTop: 4 }}>{step.copy}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex flex-col gap-6">
          {steps.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: i * 0.05 }} className="flex items-start gap-4">
              <div className="flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, backgroundColor: "#2563EB" }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>{step.num}</span>
              </div>
              <div>
                <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#E5E5E5" }}>{step.title}</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6B7280", lineHeight: 1.6, marginTop: 4 }}>{step.copy}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: 0.2 }} className="mt-14">
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, color: "#E5E5E5", marginBottom: 24, textTransform: "uppercase", letterSpacing: "0.02em" }}>
            YOU'LL WALK AWAY KNOWING:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {deliverables.map((d, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex items-center justify-center flex-shrink-0" style={{ width: 28, height: 28, backgroundColor: `${d.color}15` }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: d.color, fontWeight: 700 }}>{d.icon}</span>
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>{d.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="text-center mt-12">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleScanClick}
            style={{ background: "#2563EB", color: "#FFFFFF", fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, padding: "16px 32px", border: "none", boxShadow: "0 4px 24px rgba(37,99,235,0.35)", cursor: "pointer" }}>
            Scan My Quote — It's Free
          </motion.button>
          {onDemoClick && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onDemoClick}
              style={{ marginTop: 16, background: "transparent", color: "#2563EB", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: "12px 28px", border: "1px solid rgba(37,99,235,0.3)", cursor: "pointer" }}>
              See the AI in Action — No Upload Needed
            </motion.button>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProcessSteps;
