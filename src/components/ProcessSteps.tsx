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
    <section id="how-it-works" className="section-shell rounded-none border-x-0">
      <div ref={ref} className="mx-auto max-w-5xl px-4 md:px-8 py-20 md:py-28">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15 }} className="text-center">
          <p className="eyebrow mb-4">WHAT HAPPENS WHEN YOU SCAN</p>
          <h2 className="display-hero text-foreground mb-12" style={{ fontSize: "clamp(32px, 5vw, 48px)" }}>
            UPLOAD YOUR QUOTE. IN UNDER 60 SECONDS, YOU'LL KNOW:
          </h2>
        </motion.div>

        {/* Desktop */}
        <div className="hidden md:block relative">
          <div className="absolute top-5 left-0 right-0 h-[1px] bg-border" />
          <div className="grid grid-cols-5 gap-6">
            {steps.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: i * 0.05 }} className="relative text-center">
                <div className="mx-auto flex items-center justify-center relative z-10 w-10 h-10 glass-card rounded-xl">
                  <span className="font-mono text-[15px] font-bold text-primary">{step.num}</span>
                </div>
                <h3 className="font-body text-base font-bold text-foreground mt-3">{step.title}</h3>
                <p className="font-body text-[13px] text-muted-foreground mt-1" style={{ lineHeight: 1.65 }}>{step.copy}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex flex-col gap-6">
          {steps.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: i * 0.05 }} className="flex items-start gap-4">
              <div className="flex items-center justify-center flex-shrink-0 w-9 h-9 bg-primary rounded-lg">
                <span className="font-mono text-[13px] font-bold text-primary-foreground">{step.num}</span>
              </div>
              <div>
                <h3 className="font-body text-base font-bold text-foreground">{step.title}</h3>
                <p className="font-body text-[13px] text-muted-foreground mt-1" style={{ lineHeight: 1.65 }}>{step.copy}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: 0.2 }} className="mt-14">
          <h3 className="display-secondary text-foreground mb-6" style={{ fontSize: 22 }}>YOU'LL WALK AWAY KNOWING:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {deliverables.map((d, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex items-center justify-center flex-shrink-0 w-7 h-7 rounded-lg" style={{ backgroundColor: `${d.color}15` }}>
                  <span className="font-mono text-sm font-bold" style={{ color: d.color }}>{d.icon}</span>
                </div>
                <p className="font-body text-[13px] text-muted-foreground" style={{ lineHeight: 1.65 }}>{d.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="text-center mt-12">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleScanClick}
            className="btn-depth-primary rounded-xl font-body text-base font-bold py-4 px-8">
            Scan My Quote — It's Free
          </motion.button>
          {onDemoClick && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onDemoClick}
              className="block mx-auto mt-4 btn-depth-secondary rounded-xl font-body text-sm font-semibold py-3 px-7">
              See the AI in Action — No Upload Needed
            </motion.button>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProcessSteps;
